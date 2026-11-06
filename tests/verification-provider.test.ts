import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { createManagedProvider, VerificationError } from "../server/verification.js";

const base = "https://auth.example.test/database/auth/";
const email = "person@example.test";
let originalBase: string | undefined;
before(() => {
  originalBase = process.env.NEON_AUTH_BASE_URL;
  process.env.NEON_AUTH_BASE_URL = base;
});
after(() => {
  if (originalBase === undefined) delete process.env.NEON_AUTH_BASE_URL;
  else process.env.NEON_AUTH_BASE_URL = originalBase;
});

test("OTP sending includes the configured provider Origin and server request ID", async () => {
  let calls = 0;
  const provider = createManagedProvider(async (url, options) => {
    calls++;
    assert.equal(url, base + "email-otp/send-verification-otp");
    const headers = new Headers(options?.headers);
    assert.equal(headers.get("origin"), "https://auth.example.test");
    assert.match(headers.get("x-request-id")!, /^[0-9a-f-]{36}$/);
    assert.equal(headers.get("cookie"), null);
    assert.deepEqual(JSON.parse(String(options?.body)), { email, type: "sign-in" });
    assert.equal(options?.redirect, "error");
    assert.ok(options?.signal);
    return Response.json({ success: true });
  });
  await provider.send(email);
  assert.equal(calls, 1);
});

test("OTP verification and provider session cleanup both include provider Origin", async () => {
  const calls: string[] = [];
  const provider = createManagedProvider(async (url, options) => {
    calls.push(String(url));
    const headers = new Headers(options?.headers);
    assert.equal(headers.get("origin"), "https://auth.example.test");
    if (String(url).endsWith("/sign-in/email-otp")) {
      assert.deepEqual(JSON.parse(String(options?.body)), {
        email, otp: "123456", name: "Veritas user",
      });
      return Response.json({ token: "provider-token", user: { email, emailVerified: true } }, {
        headers: { "Set-Cookie": "provider_session=provider-token; Secure; HttpOnly" },
      });
    }
    assert.equal(String(url), base + "sign-out");
    assert.equal(headers.get("cookie"), "provider_session=provider-token");
    assert.equal(options?.body, "{}");
    return Response.json({ success: true });
  });
  await provider.verify(email, "123456");
  assert.equal(calls.length, 2);
});

test("provider errors fail closed and diagnostics exclude recipient, code, and raw messages", async (t) => {
  const logs: unknown[][] = [];
  t.mock.method(console, "error", (...args: unknown[]) => logs.push(args));
  const provider = createManagedProvider(async () => Response.json({
    code: "MISSING_OR_NULL_ORIGIN",
    message: `${email} 123456 provider-token smtp-password`,
  }, { status: 403 }));
  await assert.rejects(provider.send(email), (error) =>
    error instanceof VerificationError && error.status === 503 && !String(error).includes(email));
  assert.equal(logs.length, 1);
  const diagnostic = logs[0][1] as Record<string, unknown>;
  assert.equal(diagnostic.providerCode, "MISSING_OR_NULL_ORIGIN");
  assert.equal(diagnostic.operation, "send");
  assert.equal(diagnostic.status, 403);
  assert.match(String(diagnostic.requestId), /^[0-9a-f-]{36}$/);
  const serialized = JSON.stringify(logs);
  for (const privateValue of [email, "123456", "provider-token", "smtp-password"])
    assert.equal(serialized.includes(privateValue), false);
});

test("unrecognized provider error strings are never logged", async (t) => {
  const logs: unknown[][] = [];
  t.mock.method(console, "error", (...args: unknown[]) => logs.push(args));
  const provider = createManagedProvider(async () => Response.json({
    code: "PRIVATE_CREDENTIAL_VALUE", message: "private diagnostic",
  }, { status: 500 }));
  await assert.rejects(provider.verify(email, "123456"), (error) =>
    error instanceof VerificationError && error.status === 503);
  assert.equal((logs[0][1] as any).providerCode, "UNKNOWN_PROVIDER_ERROR");
  assert.equal(JSON.stringify(logs).includes("PRIVATE_CREDENTIAL_VALUE"), false);
});

test("a successful HTTP status without a successful send result is rejected", async (t) => {
  t.mock.method(console, "error", () => {});
  const provider = createManagedProvider(async () => Response.json({ success: false }));
  await assert.rejects(provider.send(email), (error) =>
    error instanceof VerificationError && error.status === 503);
});

test("verification requires an exact verified provider identity", async (t) => {
  t.mock.method(console, "error", () => {});
  for (const user of [
    { email, emailVerified: false },
    { email, emailVerified: "true" },
    { email: "other@example.test", emailVerified: true },
    { email: 123, emailVerified: true },
  ]) {
    const provider = createManagedProvider(async () => Response.json({ user }));
    await assert.rejects(provider.verify(email, "123456"), VerificationError);
  }
});

test("invalid or insecure provider URLs are rejected before any request", async (t) => {
  t.mock.method(console, "error", () => {});
  let calls = 0;
  const provider = createManagedProvider(async () => {
    calls++;
    return Response.json({ success: true });
  });
  try {
    for (const invalidBase of ["", "not a URL", "http://auth.example.test/auth", "https://user:secret@auth.example.test/auth", base + "?token=secret"]) {
      process.env.NEON_AUTH_BASE_URL = invalidBase;
      await assert.rejects(provider.send(email), (error) =>
        error instanceof VerificationError && error.status === 503);
    }
    assert.equal(calls, 0);
  } finally {
    process.env.NEON_AUTH_BASE_URL = base;
  }
});

test("a stalled provider request times out with a safe unavailable response", async (t) => {
  const logs: unknown[][] = [];
  t.mock.method(console, "error", (...args: unknown[]) => logs.push(args));
  const provider = createManagedProvider(async (_url, options) => new Promise<Response>((_resolve, reject) => {
    options!.signal!.addEventListener("abort", () => reject(options!.signal!.reason), { once: true });
  }), 5);
  // AbortSignal's own timer is unreferenced; hold the test process until it fires.
  const keepAlive = setTimeout(() => {}, 100);
  try {
    await assert.rejects(provider.send(email), (error) =>
      error instanceof VerificationError && error.status === 503);
    assert.equal((logs[0][1] as any).providerCode, "REQUEST_TIMEOUT");
  } finally {
    clearTimeout(keepAlive);
  }
});
