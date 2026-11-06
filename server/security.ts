import {
  Router,
  type Request,
  type Response,
  type NextFunction,
} from "express";
import {
  createHash,
  randomBytes,
  randomUUID,
  scrypt,
  timingSafeEqual,
} from "node:crypto";
import { query, transaction, StorageConfigurationError } from "./storage.js";
import { assessEmail, EmailPolicyError } from "./email-policy.js";
import { attachReferral, ReferralError } from "./referrals.js";
import { validReport } from "./validation.js";
import {
  sendVerification,
  confirmVerification,
  VerificationError,
} from "./verification.js";
import { trustedOrigins } from "./origins.js";
import { isOwnerAccount } from "./owner.js";

const derive = (password: string, salt: string) =>
  new Promise<Buffer>((resolve, reject) => {
    scrypt(
      password,
      salt,
      64,
      { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 },
      (error, key) => (error ? reject(error) : resolve(key)),
    );
  });
const lifetime = 7 * 86400_000;
const production =
  process.env.NODE_ENV === "production" || Boolean(process.env.VERCEL);
const cookieName = production ? "__Host-veritas" : "veritas_session";
const digest = (value: string) =>
  createHash("sha256").update(value).digest("hex");
export type UserRequest = Request & {
  userId?: string;
  userEmail?: string;
  emailVerified?: boolean;
};

export function securityHeaders(
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  res.set({
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "no-referrer",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  });
  if (production) {
    res.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    res.set(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'",
    );
  }
  if (_req.path.startsWith("/api")) res.set("Cache-Control", "no-store");
  next();
}

export function sameOrigin(req: Request, res: Response, next: NextFunction) {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
  const origin = req.get("origin");
  const allowed = trustedOrigins({
    appOrigin: process.env.APP_ORIGIN,
    vercelHost: process.env.VERCEL ? process.env.VERCEL_URL : undefined,
    vercelBranchHost: process.env.VERCEL ? process.env.VERCEL_BRANCH_URL : undefined,
    production,
    localOrigin: `${req.protocol}://${req.get("host")}`,
  });
  if (!allowed.size)
    return res.status(503).json({
      error: "The account service is not ready. Please contact the site owner.",
      code: "ORIGIN_NOT_CONFIGURED",
    });
  if (
    (origin && !allowed.has(origin)) ||
    req.get("sec-fetch-site") === "cross-site"
  ) {
    return res.status(403).json({ error: "Request origin is not allowed." });
  }
  if (!req.is("application/json"))
    return res.status(415).json({ error: "Use application/json." });
  next();
}

// Database-backed fixed windows also work across serverless instances.
export function rateLimit(scope: string, maximum: number, windowMs = 60_000) {
  return async (req: UserRequest, res: Response, next: NextFunction) => {
    try {
      const identity = req.userId || req.ip || "unknown";
      const bucket = Math.floor(Date.now() / windowMs);
      const key = `${scope}:${digest(identity)}:${bucket}`;
      const [row] = await query(
        "INSERT INTO rate_limits (key, hits, expires_at) VALUES ($1, 1, $2) ON CONFLICT(key) DO UPDATE SET hits=rate_limits.hits+1 RETURNING hits",
        [key, (bucket + 1) * windowMs],
      );
      await query("DELETE FROM rate_limits WHERE expires_at < $1", [
        Date.now(),
      ]);
      if (row.hits > maximum) {
        res.set("Retry-After", String(Math.ceil(windowMs / 1000)));
        return res
          .status(429)
          .json({ error: "Too many requests. Please try again shortly." });
      }
      next();
    } catch (error) {
      res.status(503).json(
        error instanceof StorageConfigurationError
          ? {
              error:
                "Accounts are not available yet. The site owner needs to finish account storage setup.",
              code: "STORAGE_NOT_CONFIGURED",
            }
          : { error: "Storage is unavailable. Please try again later." },
      );
    }
  };
}

function readToken(req: Request) {
  return (
    (req.headers.cookie || "")
      .split(";")
      .map((s) => s.trim())
      .find((s) => s.startsWith(`${cookieName}=`))
      ?.slice(cookieName.length + 1) || ""
  );
}

export async function requireSession(
  req: UserRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const token = readToken(req);
    if (!/^[a-f0-9]{64}$/.test(token))
      return res.status(401).json({ error: "Please sign in to continue." });
    const [session] = await query(
      "SELECT sessions.user_id,accounts.email,accounts.verified_at FROM sessions JOIN accounts ON accounts.id=sessions.user_id WHERE token_hash=$1 AND expires_at>$2",
      [digest(token), Date.now()],
    );
    if (!session)
      return res
        .status(401)
        .json({ error: "Your session has expired. Please sign in again." });
    req.userId = session.user_id;
    req.userEmail = session.email;
    req.emailVerified = Boolean(session.verified_at);
    next();
  } catch {
    res.status(503).json({ error: "Account storage is unavailable." });
  }
}

export function requireUser(
  req: UserRequest,
  res: Response,
  next: NextFunction,
) {
  return requireSession(req, res, () => {
    if (!req.emailVerified)
      return res
        .status(403)
        .json({
          error:
            "Please verify your email to use your library and analysis tools.",
          code: "EMAIL_VERIFICATION_REQUIRED",
        });
    next();
  });
}
async function issueSession(req: Request, res: Response, userId: string) {
  await query("DELETE FROM sessions WHERE token_hash=$1 OR expires_at<$2", [
    digest(readToken(req)),
    Date.now(),
  ]);
  const token = randomBytes(32).toString("hex");
  await query(
    "INSERT INTO sessions (token_hash,user_id,expires_at) VALUES ($1,$2,$3)",
    [digest(token), userId, Date.now() + lifetime],
  );
  res.cookie(cookieName, token, {
    httpOnly: true,
    secure: production,
    sameSite: "strict",
    maxAge: lifetime,
    path: "/",
  });
}

export const accountRouter = Router();
accountRouter.post(
  ["/register", "/login"],
  rateLimit("auth", 10, 15 * 60_000),
  async (req, res) => {
    try {
      const { email, password } = req.body || {};
      if (
        typeof email !== "string" ||
        email.length > 254 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
        typeof password !== "string" ||
        password.length < 12 ||
        password.length > 128
      ) {
        return res.status(400).json({
          error: "Enter a valid email and a password of 12–128 characters.",
        });
      }
      const identity = assessEmail(email);
      if (req.path === "/register" && identity.isDisposable)
        return res.status(400).json({ error: "Temporary email addresses are not supported. Use a permanent email address.", code: "DISPOSABLE_EMAIL" });
      const cleanEmail = identity.email;
      let [user] = await query("SELECT * FROM accounts WHERE email=$1", [req.path === "/login" ? email.trim().toLowerCase() : cleanEmail]);
      if (!user && req.path === "/login") [user] = await query("SELECT accounts.* FROM accounts JOIN account_mailboxes ON accounts.id=account_mailboxes.user_id WHERE mailbox_key=$1", [identity.mailboxKey]);
      if (req.path === "/register") {
        if (user)
          return res
            .status(409)
            .json({ error: "Unable to create account. Try signing in." });
        const salt = randomBytes(16).toString("hex");
        const hash = ((await derive(password, salt)) as Buffer).toString("hex");
        user = { id: randomUUID(), email: cleanEmail };
        await transaction(async (q) => {
          const timestamp = new Date().toISOString();
          const created = await q("INSERT INTO accounts (id,email,password_hash,created_at) VALUES ($1,$2,$3,$4) ON CONFLICT(email) DO NOTHING RETURNING id", [user.id, cleanEmail, `${salt}:${hash}`, timestamp]);
          if (!created.length) throw new ReferralError("An account already exists for this email. Please sign in.", 409, "ACCOUNT_EXISTS");
          const claimed = await q("INSERT INTO account_mailboxes (mailbox_key,user_id,created_at) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING RETURNING user_id", [identity.mailboxKey, user.id, timestamp]);
          if (!claimed.length) throw new ReferralError("An account already exists for this mailbox. Please sign in.", 409, "ACCOUNT_EXISTS");
          await attachReferral(q, user.id, identity.mailboxKey, req.body?.referralCode);
        });
      } else {
        // Derive even for unknown accounts to reduce timing differences.
        const [salt, hash] = (
          user?.password_hash || `${"0".repeat(32)}:${"0".repeat(128)}`
        ).split(":");
        const actual = (await derive(password, salt)) as Buffer;
        if (!timingSafeEqual(actual, Buffer.from(hash, "hex")) || !user)
          return res
            .status(401)
            .json({ error: "Email or password is incorrect." });
      }
      await issueSession(req, res, user.id);
      if (!user.verified_at) {
        let verificationSent = false,
          message = "";
        try {
          await sendVerification(user.id, user.email);
          verificationSent = true;
        } catch (error) {
          message =
            error instanceof Error
              ? error.message
              : "Email delivery is unavailable.";
        }
        return res
          .status(202)
          .json({
            user: { id: user.id, email: user.email, verified: false },
            verificationRequired: true,
            verificationSent,
            message,
          });
      }
      res.json({ user: { id: user.id, email: user.email, verified: true, isAdmin: isOwnerAccount(user.id, true) } });
    } catch (error) {
      if (error instanceof EmailPolicyError) return res.status(400).json({ error: error.message, code: error.code });
      if (error instanceof ReferralError) return res.status(error.status).json({ error: error.message, code: error.code });
      res
        .status(503)
        .json({ error: "Account service is unavailable. Please try again." });
    }
  },
);
accountRouter.get(
  "/me",
  requireSession,
  async (req: UserRequest, res, next) => {
    try {
      const [user] = await query(
        "SELECT id,email,verified_at FROM accounts WHERE id=$1",
        [req.userId],
      );
      res.json({
        user: {
          id: user.id,
          email: user.email,
          verified: Boolean(user.verified_at),
          isAdmin: isOwnerAccount(user.id, Boolean(user.verified_at)),
        },
      });
    } catch (e) {
      next(e);
    }
  },
);
accountRouter.post(
  "/resend-verification",
  requireSession,
  rateLimit("resend-ip", 10, 3600000),
  async (req: UserRequest, res) => {
    if (req.emailVerified) return res.json({ verified: true });
    try {
      await sendVerification(req.userId!, req.userEmail!);
      res.json({ success: true, retryAfter: 60 });
    } catch (error) {
      res
        .status(error instanceof VerificationError ? error.status : 503)
        .json({
          error:
            error instanceof VerificationError
              ? error.message
              : "Email delivery is unavailable.",
        });
    }
  },
);
accountRouter.post(
  "/verify-email",
  requireSession,
  rateLimit("verify-ip", 30, 15 * 60000),
  async (req: UserRequest, res) => {
    if (req.emailVerified)
      return res.json({
        user: { id: req.userId, email: req.userEmail, verified: true, isAdmin: isOwnerAccount(req.userId, true) },
      });
    try {
      await confirmVerification(req.userId!, req.userEmail!, req.body?.code);
      await issueSession(req, res, req.userId!);
      res.json({
        user: { id: req.userId, email: req.userEmail, verified: true, isAdmin: isOwnerAccount(req.userId, true) },
      });
    } catch (error) {
      res
        .status(error instanceof VerificationError ? error.status : 503)
        .json({
          error:
            error instanceof VerificationError
              ? error.message
              : "Verification is temporarily unavailable.",
        });
    }
  },
);
accountRouter.post("/logout", async (req, res, next) => {
  try {
    await query("DELETE FROM sessions WHERE token_hash=$1", [
      digest(readToken(req)),
    ]);
    res.clearCookie(cookieName, {
      path: "/",
      httpOnly: true,
      secure: production,
      sameSite: "strict",
    });
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
});

export const documentRouter = Router();
documentRouter.use(requireUser, rateLimit("documents", 60));
documentRouter.get("/", async (req: UserRequest, res, next) => {
  try {
    res.json({
      documents: await query(
        "SELECT id,title,updated_at FROM documents WHERE user_id=$1 ORDER BY updated_at DESC LIMIT 100",
        [req.userId],
      ),
    });
  } catch (e) {
    next(e);
  }
});
documentRouter.get("/:id", async (req: UserRequest, res, next) => {
  try {
    const [doc] = await query(
      "SELECT * FROM documents WHERE id=$1 AND user_id=$2",
      [req.params.id, req.userId],
    );
    if (!doc) return res.status(404).json({ error: "Document not found." });
    res.json({
      document: { ...doc, report: doc.report ? JSON.parse(doc.report) : null },
    });
  } catch (e) {
    next(e);
  }
});
documentRouter.put("/:id", async (req: UserRequest, res, next) => {
  try {
    const { title, content, report } = req.body || {};
    if (
      !/^[a-f0-9-]{36}$/.test(String(req.params.id)) ||
      typeof title !== "string" ||
      !title.trim() ||
      title.length > 120 ||
      typeof content !== "string" ||
      content.length > 15000 ||
      JSON.stringify(report || null).length > 250000 ||
      (report != null &&
        (!validReport(report) || report.originalText !== content))
    )
      return res.status(400).json({
        error:
          "Invalid document. Limit: 15,000 characters and a 120-character title.",
      });
    const [existing] = await query(
      "SELECT user_id FROM documents WHERE id=$1",
      [req.params.id],
    );
    if (existing && existing.user_id !== req.userId)
      return res.status(404).json({ error: "Document not found." });
    const [count] = await query(
      "SELECT COUNT(*) AS total FROM documents WHERE user_id=$1",
      [req.userId],
    );
    if (!existing && Number(count.total) >= 100)
      return res.status(409).json({
        error: "Document limit reached. Delete an older document first.",
      });
    const updated = new Date().toISOString();
    const rows = await query(
      "INSERT INTO documents (id,user_id,title,content,report,updated_at) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT(id) DO UPDATE SET title=excluded.title, content=excluded.content, report=excluded.report, updated_at=excluded.updated_at WHERE documents.user_id=excluded.user_id RETURNING id",
      [
        req.params.id,
        req.userId,
        title.trim(),
        content,
        JSON.stringify(report || null),
        updated,
      ],
    );
    if (!rows.length)
      return res.status(404).json({ error: "Document not found." });
    res.json({ success: true, updated_at: updated });
  } catch (e) {
    next(e);
  }
});
documentRouter.delete("/:id", async (req: UserRequest, res, next) => {
  try {
    await query("DELETE FROM documents WHERE id=$1 AND user_id=$2", [
      req.params.id,
      req.userId,
    ]);
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
});
