import { randomUUID } from "node:crypto";
import { query } from "./storage.js";

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
async function providerCall(path: string, body: unknown) {
  const base = process.env.NEON_AUTH_BASE_URL;
  if (!base || !base.startsWith("https://"))
    throw new VerificationError(
      "Email verification is temporarily unavailable. Please try again later.",
      503,
    );
  const response = await fetch(base.replace(/\/$/, "") + path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15000),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok)
    throw new VerificationError(
      response.status === 429
        ? "Too many code requests. Please wait before trying again."
        : path.includes("send-")
          ? "The verification email could not be sent. Please try again later."
          : "The code is incorrect or expired. Request a new code if needed.",
      response.status === 429 ? 429 : path.includes("send-") ? 503 : 400,
    );
  return { data, response };
}
const managedProvider: Provider = {
  async send(email) {
    const { data } = await providerCall("/email-otp/send-verification-otp", {
      email,
      type: "sign-in",
    });
    if (data?.success !== true)
      throw new VerificationError(
        "The verification email could not be sent.",
        503,
      );
  },
  async verify(email, code) {
    // Neon consumes the OTP and returns a verified identity. App accounts,
    // passwords, document ownership, and browser sessions remain in this app.
    const { data, response } = await providerCall("/sign-in/email-otp", {
      email,
      otp: code,
      name: "Veritas user",
    });
    if (
      !data?.user?.emailVerified ||
      data.user.email?.trim().toLowerCase() !== email
    )
      throw new VerificationError("Email ownership could not be confirmed.");
    // This service is only an email-ownership proof: discard its separate session.
    const cookies = response.headers
      .getSetCookie()
      .map((value) => value.split(";")[0])
      .join("; ");
    if (cookies)
      await fetch(
        process.env.NEON_AUTH_BASE_URL!.replace(/\/$/, "") + "/sign-out",
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Cookie: cookies },
          body: "{}",
          signal: AbortSignal.timeout(5000),
        },
      ).catch(() => {});
  },
};
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
  const rows = await query(
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
  await query(
    "DELETE FROM verification_requests WHERE user_id=$1 AND request_id=$2",
    [userId, challenge.request_id],
  );
}
