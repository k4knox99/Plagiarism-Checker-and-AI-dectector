import { before, after, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync } from "node:fs";
import { randomUUID } from "node:crypto";
import path from "node:path";
mkdirSync("work", { recursive: true });
process.env.DATA_DIR = mkdtempSync(path.resolve("work/admin-test-db-"));
for (const key of ["DATABASE_URL", "GEMINI_API_KEY", "GOOGLE_API_KEY", "AI_GATEWAY_API_KEY", "VERCEL_OIDC_TOKEN", "VERCEL", "OWNER_ACCOUNT_ID"]) process.env[key] = "";
process.env.NODE_ENV = "test";
const { default: app } = await import("../server/app.js");
const { query } = await import("../server/storage.js");
const { setVerificationProviderForTests } = await import("../server/verification.js");
setVerificationProviderForTests({ send: async () => {}, verify: async (_email, code) => { if (code !== "123456") throw new Error("Invalid fixture code"); } });
let server: ReturnType<typeof app.listen>, base: string;
type Fixture = {id: string; cookie: string; email: string};
let owner: Fixture, other: Fixture, pending: Fixture;
const password = "Owner-test-password-2026";
async function call(route: string, cookie?: string, method = "GET", body?: unknown) {
  const response = await fetch(base + route, { method, headers: { ...(cookie ? { Cookie: cookie } : {}), ...(body === undefined ? {} : { "Content-Type": "application/json" }) }, body: body === undefined ? undefined : JSON.stringify(body) });
  return { response, data: await response.json() };
}
async function account(email: string, verify = true): Promise<Fixture> {
  const result = await call("/api/auth/register", undefined, "POST", { email, password, role: "admin", isAdmin: true });
  assert.equal(result.response.status, 202);
  let cookie = result.response.headers.getSetCookie()[0].split(";")[0];
  if (verify) {
    const confirmed = await call("/api/auth/verify-email", cookie, "POST", { code: "123456" });
    assert.equal(confirmed.response.status, 200);
    cookie = confirmed.response.headers.getSetCookie()[0].split(";")[0];
  }
  return { id: result.data.user.id, email, cookie };
}
before(async () => {
  server = app.listen(0, "127.0.0.1"); await new Promise<void>(resolve => server.once("listening", resolve));
  base = `http://127.0.0.1:${(server.address() as {port:number}).port}`;
  owner = await account("owner-test@example.com"); other = await account("member-test@example.com"); pending = await account("pending-owner@example.com", false);
});
beforeEach(async () => { process.env.OWNER_ACCOUNT_ID = owner.id; await query("DELETE FROM rate_limits"); });
after(() => new Promise<void>(resolve => server.close(() => resolve())));
test("admin endpoints reject anonymous sessions and verified members despite client role claims", async () => {
  assert.equal((await call("/api/admin/overview")).response.status, 401);
  const denied = await call("/api/admin/overview?userId=" + owner.id + "&isAdmin=true", other.cookie);
  assert.equal(denied.response.status, 403);
  assert.equal(denied.data.users, undefined);
  assert.equal((await call("/api/auth/me", other.cookie)).data.user.isAdmin, false);
});
test("only a verified configured owner gets the dashboard without hashes, sessions, or private document text", async () => {
  await call("/api/documents/" + randomUUID(), other.cookie, "PUT", { title: "Private fixture", content: "This private document body must not appear in administrator overview responses.", report: null });
  const result = await call("/api/admin/overview", owner.cookie);
  assert.equal(result.response.status, 200);
  assert.equal(result.data.stats.accounts, 3);
  assert.equal(result.data.stats.verifiedAccounts, 2);
  assert.equal(result.data.stats.documents, 1);
  assert.equal(result.data.users.length, 3);
  assert.ok(result.data.users.every((user: any) => typeof user.verified === "boolean" && typeof user.creditBalance === "number"));
  const raw = JSON.stringify(result.data);
  for (const value of [password, "password_hash", "token_hash", "private document body"]) assert.ok(!raw.includes(value));
  assert.equal((await call("/api/auth/me", owner.cookie)).data.user.isAdmin, true);
  const login = await call("/api/auth/login", undefined, "POST", { email: owner.email, password });
  assert.equal(login.data.user.isAdmin, true);
});
test("unverified owners and missing or changed owner configuration fail closed immediately", async () => {
  process.env.OWNER_ACCOUNT_ID = pending.id;
  assert.equal((await call("/api/admin/overview", pending.cookie)).response.status, 403);
  assert.equal((await call("/api/auth/me", pending.cookie)).data.user.isAdmin, false);
  process.env.OWNER_ACCOUNT_ID = "";
  assert.equal((await call("/api/admin/overview", owner.cookie)).response.status, 403);
  process.env.OWNER_ACCOUNT_ID = other.id;
  assert.equal((await call("/api/admin/overview", owner.cookie)).response.status, 403);
  assert.equal((await call("/api/auth/me", owner.cookie)).data.user.isAdmin, false);
});
