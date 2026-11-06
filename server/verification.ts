import { randomUUID } from "node:crypto";
import { query, transaction } from "./storage.js";
import { awardVerifiedReferral } from "./referrals.js";

export class VerificationError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
type Provider = {
  send(email: string): Promise<void>;
  verify(email: string, code: string): Promise<void>;
};
type ProviderOperation = "send" | "verify" | "sign-out";
const providerErrorCodes = new Set([
  "MISSING_OR_NULL_ORIGIN",
  "INVALID_ORIGIN",
  "INVALID_OTP",
  "OTP_EXPIRED",
  "TOO_MANY_ATTEMPTS",
  "TOO_MANY_REQUESTS",
  "FAILED_TO_SEND_VERIFICATION_EMAIL",
  "FAILED_TO_SEND_EMAIL",
  "INTERNAL_SERVER_ERROR",
  "USER_NOT_FOUND",
  "INVALID_EMAIL",
]);

export function createManagedProvider(
  fetchProvider: typeof fetch = (...args) => fetch(...args),
  timeoutMs = 15000,
): Provider {
  async function providerCall(
    path: string,
    body: unknown,
    operation: ProviderOperation,
    cookies?: string,
  ) {
    const started = Date.now(),
      requestId = randomUUID();
    const diagnose = (providerCode: string, status?: number) =>
      console.error("email_verification_provider_error", {
        operation,
        status,
        providerCode,
        requestId,
        durationMs: Date.now() - started,
      });
    let base: URL;
    try {
      base = new URL(process.env.NEON_AUTH_BASE_URL || "");
      if (
        base.protocol !== "https:" ||
        base.username || base.password || base.search || base.hash
      )
        throw new Error("Invalid provider URL");
    } catch {
      diagnose("INVALID_CONFIGURATION");
      throw new VerificationError(
        "Email verification is temporarily unavailable. Please try again later.",
        503,
      );
    }
    let response: Response;
    try {
      response = await fetchProvider(base.href.replace(/\/$/, "") + path, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Neon requires an Origin even for server-to-server OTP calls.
          // Derive it only from our configured provider, never a browser header.
          Origin: base.origin,
          "X-Request-ID": requestId,
          ...(cookies ? { Cookie: cookies } : {}),
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(
          operation === "sign-out" ? Math.min(timeoutMs, 5000) : timeoutMs,
        ),
        redirect: "error",
      });
    } catch (error) {
      diagnose(
        error instanceof Error && ["TimeoutError", "AbortError"].includes(error.name)
          ? "REQUEST_TIMEOUT"
          : "NETWORK_ERROR",
      );
      throw new VerificationError(
        "Email verification is temporarily unavailable. Please try again later.",
        503,
      );
    }
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      diagnose(
        providerErrorCodes.has(data?.code) ? data.code : "UNKNOWN_PROVIDER_ERROR",
        response.status,
      );
      const unavailable = operation !== "verify" || response.status >= 500;
      throw new VerificationError(
        response.status === 429
          ? "Too many code requests. Please wait before trying again."
          : unavailable
            ? "The verification email service is unavailable. Please try again later."
            : "The code is incorrect or expired. Request a new code if needed.",
        response.status === 429 ? 429 : unavailable ? 503 : 400,
      );
    }
    return { data, response, diagnose };
  }
  return {
    async send(email) {
      const { data, response, diagnose } = await providerCall(
        "/email-otp/send-verification-otp",
        { email, type: "sign-in" },
        "send",
      );
      if (data?.success !== true) {
        diagnose("INVALID_RESPONSE", response.status);
        throw new VerificationError(
          "The verification email could not be sent.",
          503,
        );
      }
    },
    async verify(email, code) {
      // Neon consumes the OTP and returns a verified identity. App accounts,
      // passwords, document ownership, and browser sessions remain in this app.
      const { data, response, diagnose } = await providerCall(
        "/sign-in/email-otp",
        { email, otp: code, name: "Veritas user" },
        "verify",
      );
      if (
        data?.user?.emailVerified !== true ||
        typeof data.user.email !== "string" ||
        data.user.email.trim().toLowerCase() !== email
      ) {
        diagnose("INVALID_IDENTITY", response.status);
        throw new VerificationError("Email ownership could not be confirmed.");
      }
      // This service is only an email-ownership proof: discard its separate session.
      const cookies = response.headers
        .getSetCookie()
        .map((value) => value.split(";")[0])
        .join("; ");
      if (cookies)
        await providerCall("/sign-out", {}, "sign-out", cookies).catch(() => {});
    },
  };
}
const managedProvider = createManagedProvider();
let provider = managedProvider;
export function setVerificationProviderForTests(value: Provider) {
  if (process.env.NODE_ENV !== "test")
    throw new Error("Test providers are disabled.");
  provider = value;
}
export async function sendVerification(userId: string, email: string) {
  const now = Date.now(),
    requestId = randomUUID();
  const rows = await query(
    "INSERT INTO verification_requests (user_id,request_id,last_sent,expires_at,attempts) VALUES ($1,$2,$3,$4,0) ON CONFLICT(user_id) DO UPDATE SET request_id=excluded.request_id,last_sent=excluded.last_sent,expires_at=excluded.expires_at,attempts=0 WHERE verification_requests.last_sent <= excluded.last_sent-60000 RETURNING request_id",
    [userId, requestId, now, now + 10 * 60_000],
  );
  if (!rows.length)
    throw new VerificationError(
      "Please wait 60 seconds before requesting another code.",
      429,
    );
  try {
    await provider.send(email);
  } catch (error) {
    // Retain the cooldown even when delivery fails, to prevent retry storms.
    throw error instanceof VerificationError
      ? error
      : new VerificationError(
          "Email delivery is temporarily unavailable. Please try again later.",
          503,
        );
  }
}
export async function confirmVerification(
  userId: string,
  email: string,
  code: unknown,
) {
  if (typeof code !== "string" || !/^\d{6}$/.test(code))
    throw new VerificationError("Enter the 6-digit code from your email.");
  const [challenge] = await query(
    "UPDATE verification_requests SET attempts=attempts+1 WHERE user_id=$1 AND expires_at>$2 AND attempts<5 RETURNING request_id",
    [userId, Date.now()],
  );
  if (!challenge)
    throw new VerificationError(
      "This code has expired or reached its attempt limit. Request a new code.",
    );
  await provider.verify(email, code);
  await transaction(async (q) => {
  const rows = await q(
    "UPDATE accounts SET verified_at=$1 WHERE id=$2 AND EXISTS (SELECT 1 FROM verification_requests WHERE user_id=$3 AND request_id=$4 AND expires_at>$5) RETURNING id",
    [
      new Date().toISOString(),
      userId,
      userId,
      challenge.request_id,
      Date.now(),
    ],
  );
  if (!rows.length)
    throw new VerificationError(
      "The verification request changed. Please use the latest code.",
    );
  await q(
    "DELETE FROM verification_requests WHERE user_id=$1 AND request_id=$2",
    [userId, challenge.request_id],
  );
  await awardVerifiedReferral(q, userId);
  });
}
