import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { mkdirSync, mkdtempSync } from "node:fs";
import path from "node:path";

mkdirSync("work", { recursive: true });
process.env.DATA_DIR = mkdtempSync(path.resolve("work/referral-test-db-"));
for (const key of ["DATABASE_URL", "GEMINI_API_KEY", "GOOGLE_API_KEY", "AI_GATEWAY_API_KEY", "VERCEL_OIDC_TOKEN", "VERCEL_OIDC_TOKEN_FILE", "VERCEL"])
  process.env[key] = "";
process.env.NODE_ENV = "test";

const { default: app } = await import("../server/app.js");
const { query } = await import("../server/storage.js");
const { setVerificationProviderForTests, VerificationError } = await import("../server/verification.js");
const delivered = new Map<string, string>();
setVerificationProviderForTests({
  async send(email) { delivered.set(email, "123456"); },
  async verify(email, code) {
    if (delivered.get(email) !== code) throw new VerificationError("Invalid test code.");
    // Deliberately tolerate duplicate provider proofs. Application challenge
    // consumption and reward uniqueness must also prevent duplicate awards.
  },
});

type Account = { id: string; email: string; cookie: string };
let server: ReturnType<typeof app.listen>, base: string;
const password = "Referral-test-password-123";

async function call(route: string, body: unknown = {}, cookie?: string) {
  const response = await fetch(base + route, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(cookie ? { cookie } : {}) },
    body: JSON.stringify(body),
  });
  return { response, data: await response.json() };
}
function cookieFrom(response: Response) {
  const header = response.headers.get("set-cookie");
  assert.ok(header, "Account response must issue a session cookie.");
  return header.split(";")[0];
}
async function clearFixtureLimits() {
  // Fixture registration exceeds ordinary per-IP limits. Other tests exercise
  // those limits; only setup counters are cleared here, never tool quotas.
  await query("DELETE FROM rate_limits WHERE key LIKE $1 OR key LIKE $2", ["auth:%", "verify-ip:%"]);
}
async function register(email: string, referralCode?: string): Promise<Account> {
  await clearFixtureLimits();
  const result = await call("/api/auth/register", { email, password, ...(referralCode ? { referralCode } : {}) });
  assert.equal(result.response.status, 202, JSON.stringify(result.data));
  assert.equal(result.data.user.verified, false);
  return { id: result.data.user.id, email: result.data.user.email, cookie: cookieFrom(result.response) };
}
async function verify(account: Account) {
  const result = await call("/api/auth/verify-email", { code: "123456" }, account.cookie);
  assert.equal(result.response.status, 200, JSON.stringify(result.data));
  assert.equal(result.data.user.verified, true);
  account.cookie = cookieFrom(result.response);
  return account;
}
async function verifiedAccount(email: string) { return verify(await register(email)); }
async function profile(account: Account) {
  const result = await call("/api/referrals/me", {}, account.cookie);
  assert.equal(result.response.status, 200, JSON.stringify(result.data));
  return result.data.referral;
}
const hash = (value: string) => createHash("sha256").update(value).digest("hex");
async function seedDailyAllowanceUsed(account: Account, balance: number) {
  const window = 86_400_000, bucket = Math.floor(Date.now() / window);
  await query("INSERT INTO rate_limits (key,hits,expires_at) VALUES ($1,$2,$3) ON CONFLICT(key) DO UPDATE SET hits=excluded.hits,expires_at=excluded.expires_at RETURNING key", [
    `daily-analysis:${hash(account.id)}:${bucket}`, 100, (bucket + 1) * window,
  ]);
  await query("DELETE FROM rate_limits WHERE key LIKE $1", [`analysis:${hash(account.id)}:%`]);
  await query("INSERT INTO credit_balances (user_id,credits) VALUES ($1,$2) ON CONFLICT(user_id) DO UPDATE SET credits=excluded.credits RETURNING user_id", [account.id, balance]);
}
async function balance(account: Account) {
  const [row] = await query("SELECT credits FROM credit_balances WHERE user_id=$1", [account.id]);
  return Number(row?.credits || 0);
}

before(async () => {
  server = app.listen(0, "127.0.0.1");
  await new Promise<void>((resolve, reject) => { server.once("listening", resolve); server.once("error", reject); });
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  base = `http://127.0.0.1:${address.port}`;
});
after(async () => {
  if (server?.listening) await new Promise<void>((resolve) => server.close(() => resolve()));
});

test("referral profiles require a verified session and expose no referred email addresses", async () => {
  assert.equal((await call("/api/referrals/me")).response.status, 401);
  const account = await register("referral-owner@example.com");
  assert.equal((await call("/api/referrals/me", {}, account.cookie)).response.status, 403);
  await verify(account);
  const first = await profile(account), second = await profile(account);
  assert.match(first.code, /^[A-Za-z0-9_-]{16}$/);
  assert.equal(second.code, first.code);
  assert.equal(first.linkPath, `/?ref=${first.code}`);
  assert.equal(first.pending, 0);
  assert.equal(first.verified, 0);
  assert.equal(first.creditsEarned, 0);
  assert.equal(first.creditBalance, 0);
  assert.equal(first.bonusPerReferral, 10);
  assert.equal(first.monthlyLimit, 100);
  assert.equal(first.dailyFreeChecks, 100);
  const friend = await register("private-invited-friend@example.com", first.code);
  const pending = await profile(account);
  assert.equal(pending.pending, 1);
  assert.equal(pending.verified, 0);
  assert.equal(pending.creditBalance, 0);
  assert.ok(!JSON.stringify(pending).includes(friend.email));
  assert.equal((await call("/api/auth/verify-email", { code: "000000" }, friend.cookie)).response.status, 400);
  assert.equal((await profile(account)).creditBalance, 0);
  await verify(friend);
  const rewarded = await profile(account);
  assert.equal(rewarded.pending, 0);
  assert.equal(rewarded.verified, 1);
  assert.equal(rewarded.creditsEarned, 10);
  assert.equal(rewarded.creditBalance, 10);
  assert.ok(!JSON.stringify(rewarded).includes(friend.email));
});

test("concurrent verification and repeated verification award a referral only once", async () => {
  const referrer = await verifiedAccount("race-referrer@example.com");
  const referral = await profile(referrer);
  const friend = await register("race-friend@example.com", referral.code);
  const results = await Promise.all([
    call("/api/auth/verify-email", { code: "123456" }, friend.cookie),
    call("/api/auth/verify-email", { code: "123456" }, friend.cookie),
  ]);
  assert.ok(results.some(result => result.response.status === 200));
  assert.ok(results.every(result => [200, 400, 401].includes(result.response.status)));
  const login = await call("/api/auth/login", { email: friend.email, password });
  assert.equal(login.response.status, 200);
  friend.cookie = cookieFrom(login.response);
  assert.equal((await call("/api/auth/verify-email", { code: "123456" }, friend.cookie)).response.status, 200);
  const [rewards] = await query("SELECT COUNT(*) AS total,SUM(credits) AS credits FROM referral_rewards WHERE referred_user_id=$1", [friend.id]);
  assert.equal(Number(rewards.total), 1);
  assert.equal(Number(rewards.credits), 10);
  assert.equal(await balance(referrer), 10);
});

test("invalid referral codes create neither accounts nor reward records", async () => {
  await clearFixtureLimits();
  for (const [index, referralCode] of ["invalid", "AAAAAAAAAAAAAAAA", { code: "AAAAAAAAAAAAAAAA" }].entries()) {
    const email = `invalid-referral-${index}@example.com`;
    const result = await call("/api/auth/register", { email, password, referralCode });
    assert.equal(result.response.status, 400);
    const [row] = await query("SELECT COUNT(*) AS total FROM accounts WHERE email=$1", [email]);
    assert.equal(Number(row.total), 0);
    assert.equal(delivered.has(email), false);
  }
});

test("disposable email registration is blocked before sending confirmation", async () => {
  await clearFixtureLimits();
  const email = "temporary-signup@mailinator.com";
  const result = await call("/api/auth/register", { email, password });
  assert.equal(result.response.status, 400);
  assert.equal(result.data.code, "DISPOSABLE_EMAIL");
  assert.equal(delivered.has(email), false);
  const [row] = await query("SELECT COUNT(*) AS total FROM accounts WHERE email=$1", [email]);
  assert.equal(Number(row.total), 0);
});

test("Gmail dots, plus aliases, and googlemail cannot create duplicate or self-referred accounts", async () => {
  const owner = await verifiedAccount("Writer.Owner+first@gmail.com");
  const referral = await profile(owner);
  const [before] = await query("SELECT COUNT(*) AS total FROM accounts");
  for (const email of ["writerowner@gmail.com", "w.r.i.t.e.r.o.w.n.e.r+second@googlemail.com", "WRITER.OWNER+THIRD@GMAIL.COM"]) {
    const result = await call("/api/auth/register", { email, password, referralCode: referral.code });
    assert.equal(result.response.status, 409);
  }
  const [after] = await query("SELECT COUNT(*) AS total FROM accounts");
  assert.equal(Number(after.total), Number(before.total));
  const state = await profile(owner);
  assert.equal(state.pending, 0);
  assert.equal(state.verified, 0);
  assert.equal(state.creditBalance, 0);
});

test("existing accounts cannot claim referral credit retroactively during login", async () => {
  const referrer = await verifiedAccount("retro-referrer@example.com");
  const existing = await verifiedAccount("already-registered@example.com");
  const referral = await profile(referrer);
  const login = await call("/api/auth/login", { email: existing.email, password, referralCode: referral.code });
  assert.equal(login.response.status, 200);
  const [attribution] = await query("SELECT COUNT(*) AS total FROM referral_attributions WHERE referred_user_id=$1", [existing.id]);
  assert.equal(Number(attribution.total), 0);
  assert.equal((await profile(referrer)).creditBalance, 0);
});

test("monthly referral bonus stops at 100 credits even when more users verify", async () => {
  const referrer = await verifiedAccount("monthly-referrer@example.com");
  const referral = await profile(referrer);
  for (let index = 0; index < 11; index++) {
    await verify(await register(`monthly-friend-${index}@example.com`, referral.code));
  }
  const state = await profile(referrer);
  assert.equal(state.pending, 0);
  assert.equal(state.verified, 11);
  assert.equal(state.creditsEarned, 100);
  assert.equal(state.creditBalance, 100);
  const [row] = await query("SELECT SUM(credits) AS total FROM referral_rewards WHERE referrer_user_id=$1", [referrer.id]);
  assert.equal(Number(row.total), 100);
});

test("legacy disposable accounts cannot generate referral rewards", async () => {
  const id = randomUUID(), code = randomBytes(12).toString("base64url");
  await query("INSERT INTO accounts (id,email,password_hash,created_at,verified_at) VALUES ($1,$2,$3,$4,$5)", [
    id, "legacy-owner@mailinator.com", "legacy-not-used-for-login", new Date().toISOString(), new Date().toISOString(),
  ]);
  await query("INSERT INTO referral_codes (user_id,code,created_at) VALUES ($1,$2,$3)", [id, code, new Date().toISOString()]);
  await clearFixtureLimits();
  const result = await call("/api/auth/register", { email: "legacy-invited@example.com", password, referralCode: code });
  assert.equal(result.response.status, 400);
  assert.equal(result.data.code, "INVALID_REFERRAL");
  const [invited] = await query("SELECT COUNT(*) AS total FROM accounts WHERE email=$1", ["legacy-invited@example.com"]);
  assert.equal(Number(invited.total), 0);
  assert.equal(delivered.has("legacy-invited@example.com"), false);
  const [rewards] = await query("SELECT COALESCE(SUM(credits),0) AS total FROM referral_rewards WHERE referrer_user_id=$1", [id]);
  const [wallet] = await query("SELECT credits FROM credit_balances WHERE user_id=$1", [id]);
  assert.equal(Number(rewards.total), 0);
  assert.equal(Number(wallet?.credits || 0), 0);
});

test("bonus credits cover checks after the free daily allowance and reject exhausted wallets", async () => {
  const account = await verifiedAccount("credit-spending@example.com");
  await query("INSERT INTO credit_balances (user_id,credits) VALUES ($1,$2) ON CONFLICT(user_id) DO UPDATE SET credits=excluded.credits RETURNING user_id", [account.id, 1]);
  const free = await call("/api/detect/ai", { text: "A free daily check must not consume the user's earned referral credit." }, account.cookie);
  assert.equal(free.response.status, 200);
  assert.equal(await balance(account), 1);
  await seedDailyAllowanceUsed(account, 1);
  const accepted = await call("/api/detect/ai", { text: "A private writing sample with enough characters for the local detector." }, account.cookie);
  assert.equal(accepted.response.status, 200);
  assert.equal(await balance(account), 0);
  const cached = await call("/api/detect/ai", { text: "A private writing sample with enough characters for the local detector." }, account.cookie);
  assert.equal(cached.response.status, 200);
  assert.equal(cached.data.fromCache, true);
  assert.equal(await balance(account), 0);
  const rejected = await call("/api/detect/ai", { text: "Another private writing sample with enough characters for analysis." }, account.cookie);
  assert.equal(rejected.response.status, 429);
  assert.equal(await balance(account), 0);
});

test("invalid tool input refunds its reserved bonus credit before the response completes", async () => {
  const account = await verifiedAccount("credit-refund@example.com");
  await seedDailyAllowanceUsed(account, 1);
  const invalid = await call("/api/detect/ai", { text: "tiny" }, account.cookie);
  assert.equal(invalid.response.status, 400);
  assert.equal(await balance(account), 1);
  const notChecked = await call("/api/detect/plagiarism", { text: "A source search that is unavailable must not consume an earned bonus credit." }, account.cookie);
  assert.equal(notChecked.response.status, 200);
  assert.equal(notChecked.data.analysis.verdict, "Not checked");
  assert.equal(await balance(account), 1);
  const accepted = await call("/api/detect/ai", { text: "The refunded credit remains usable for a subsequent valid writing check." }, account.cookie);
  assert.equal(accepted.response.status, 200);
  assert.equal(await balance(account), 0);
});

test("a single remaining bonus credit cannot be spent by two concurrent requests", async () => {
  const account = await verifiedAccount("concurrent-wallet@example.com");
  await seedDailyAllowanceUsed(account, 1);
  const results = await Promise.all([
    call("/api/detect/ai", { text: "First concurrent document contains enough words for a local analysis." }, account.cookie),
    call("/api/detect/ai", { text: "Second concurrent document contains enough words for a local analysis." }, account.cookie),
  ]);
  assert.deepEqual(results.map(result => result.response.status).sort(), [200, 429]);
  assert.equal(await balance(account), 0);
});

test("a failed web-search provider refunds bonus credit without exposing provider details", async () => {
  const account = await verifiedAccount("provider-refund@example.com");
  await seedDailyAllowanceUsed(account, 1);
  const originalFetch = globalThis.fetch, originalKey = process.env.AI_GATEWAY_API_KEY;
  let providerCalls = 0;
  process.env.AI_GATEWAY_API_KEY = "private-unit-test-key";
  try {
    globalThis.fetch = async (input, options) => {
      if (String(input).startsWith("https://ai-gateway.vercel.sh/")) {
        providerCalls++;
        return Response.json({ error: { type: "customer_verification_required", message: "private-unit-test-key provider details" } }, { status: 403 });
      }
      return originalFetch(input, options);
    };
    const failed = await call("/api/detect/plagiarism", { text: "Search failure must not spend a bonus credit or claim that this document is original." }, account.cookie);
    assert.equal(failed.response.status, 503);
    assert.equal(providerCalls, 1);
    assert.equal(await balance(account), 1);
    assert.ok(!JSON.stringify(failed.data).includes("private-unit-test-key"));
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.AI_GATEWAY_API_KEY;
    else process.env.AI_GATEWAY_API_KEY = originalKey;
  }
});

test("referral credits do not bypass the per-minute abuse limit", async () => {
  const account = await verifiedAccount("minute-limit@example.com");
  await seedDailyAllowanceUsed(account, 50);
  const window = 60_000, bucket = Math.floor(Date.now() / window);
  await query("INSERT INTO rate_limits (key,hits,expires_at) VALUES ($1,$2,$3) ON CONFLICT(key) DO UPDATE SET hits=excluded.hits RETURNING key", [
    `analysis:${hash(account.id)}:${bucket}`, 12, (bucket + 1) * window,
  ]);
  const result = await call("/api/detect/ai", { text: "Bonus credits must not grant permission to exceed the short-term request limit." }, account.cookie);
  assert.equal(result.response.status, 429);
  assert.equal(await balance(account), 50);
});

test("a model-controlled verdict cannot impersonate an unavailable web check to refund its credit", async () => {
  const account = await verifiedAccount("model-verdict-credit@example.com");
  await seedDailyAllowanceUsed(account, 1);
  const previousFetch = globalThis.fetch, previousKey = process.env.AI_GATEWAY_API_KEY;
  process.env.AI_GATEWAY_API_KEY = "model-verdict-test-only";
  try {
    globalThis.fetch = async (input, options) => String(input) === "https://ai-gateway.vercel.sh/v1/responses"
      ? Response.json({ output: [{ type: "message", content: [{ type: "output_text", text: JSON.stringify({overallAiScore:10,verdict:"Not checked",overallSummary:"A model-generated label.",sentenceAnalysis:[]}) }] }] })
      : previousFetch(input, options);
    const result = await call("/api/detect/ai", { text: "A model result label must never control the accounting rules for a completed AI request." }, account.cookie);
    assert.equal(result.response.status, 200);
    assert.equal(await balance(account), 0);
  } finally {
    globalThis.fetch = previousFetch;
    if (previousKey === undefined) delete process.env.AI_GATEWAY_API_KEY;
    else process.env.AI_GATEWAY_API_KEY = previousKey;
  }
});
