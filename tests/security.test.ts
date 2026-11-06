import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdtempSync, mkdirSync } from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
mkdirSync("work", { recursive: true });
process.env.DATA_DIR = mkdtempSync(path.resolve("work/test-db-"));
// Empty strings prevent dotenv from accidentally loading production credentials during tests.
process.env.DATABASE_URL = "";
process.env.GEMINI_API_KEY = "";
process.env.GOOGLE_API_KEY = "";
process.env.AI_GATEWAY_API_KEY = "";
process.env.VERCEL_OIDC_TOKEN = "";
process.env.NODE_ENV = "test";
process.env.VERCEL = "";
const { default: app, getCacheKey } = await import("../server/app.js");
const { query } = await import("../server/storage");
const { setVerificationProviderForTests, VerificationError } = await import(
  "../server/verification.js"
);
const delivered = new Map<string, string>();
setVerificationProviderForTests({
  send: async (email) => {
    delivered.set(email, "123456");
  },
  verify: async (email, code) => {
    if (delivered.get(email) !== code)
      throw new VerificationError("Invalid OTP");
    delivered.delete(email);
  },
});
let server: any, base: string, alice: string, bob: string;
const documentId = randomUUID();
async function call(
  route: string,
  method = "GET",
  body?: unknown,
  cookie?: string,
  extra: Record<string, string> = {},
) {
  const response = await fetch(base + route, {
    method,
    headers: {
      ...(body === undefined ? {} : { "content-type": "application/json" }),
      ...(cookie ? { cookie } : {}),
      ...extra,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { response, data: await response.json() };
}
before(async () => {
  server = app.listen(0, "127.0.0.1");
  await new Promise((r) => server.once("listening", r));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => new Promise<void>((resolve) => server.close(() => resolve())));
test("anonymous access cannot read documents or spend AI quota", async () => {
  for (const route of [
    "/api/documents",
    "/api/detect/ai",
    "/api/parse/pdf",
    "/api/fix/humanize",
  ]) {
    const { response } = await call(
      route,
      route.includes("documents") ? "GET" : "POST",
      route.includes("documents")
        ? undefined
        : { text: "This is a private document for analysis." },
    );
    assert.equal(response.status, 401);
  }
});
test("registration creates a server-verified cookie; does not expose password hash", async () => {
  const { response, data } = await call("/api/auth/register", "POST", {
    email: "alice@example.com",
    password: "Alice-test-password-123",
  });
  assert.equal(response.status, 202);
  assert.equal(data.user.verified, false);
  alice = response.headers.get("set-cookie")!.split(";")[0];
  assert.match(response.headers.get("set-cookie")!, /HttpOnly/);
  assert.match(response.headers.get("set-cookie")!, /SameSite=Strict/);
  assert.equal(data.user.email, "alice@example.com");
  assert.equal(data.user.password_hash, undefined);
  const [row] = await query(
    "SELECT password_hash FROM accounts WHERE email=$1",
    ["alice@example.com"],
  );
  assert.ok(!row.password_hash.includes("Alice-test"));
});
test("unverified accounts cannot access tools or documents; code confirms ownership", async () => {
  assert.equal(
    (await call("/api/documents", "GET", undefined, alice)).response.status,
    403,
  );
  const bad = await call(
    "/api/auth/verify-email",
    "POST",
    { code: "000000" },
    alice,
  );
  assert.equal(bad.response.status, 400);
  const good = await call(
    "/api/auth/verify-email",
    "POST",
    { code: "123456" },
    alice,
  );
  assert.equal(good.response.status, 200);
  assert.equal(good.data.user.verified, true);
  alice = good.response.headers.get("set-cookie")!.split(";")[0];
});
test("second account is separate", async () => {
  const { response } = await call("/api/auth/register", "POST", {
    email: "bob@example.com",
    password: "Bob-test-password-123",
  });
  assert.equal(response.status, 202);
  bob = response.headers.get("set-cookie")!.split(";")[0];
  const verified = await call(
    "/api/auth/verify-email",
    "POST",
    { code: "123456" },
    bob,
  );
  assert.equal(verified.response.status, 200);
  bob = verified.response.headers.get("set-cookie")!.split(";")[0];
});
test("saving and loading preserves text with no browser storage", async () => {
  const content = "A private document that should remain private.";
  assert.equal(
    (
      await call(
        "/api/documents/" + documentId,
        "PUT",
        { title: "Private draft", content, report: null },
        alice,
      )
    ).response.status,
    200,
  );
  const { data } = await call(
    "/api/documents/" + documentId,
    "GET",
    undefined,
    alice,
  );
  assert.equal(data.document.content, content);
  assert.equal(
    (await call("/api/documents", "GET", undefined, alice)).data.documents
      .length,
    1,
  );
});
test("other accounts cannot list, read, overwrite, or delete a private document", async () => {
  assert.equal(
    (await call("/api/documents", "GET", undefined, bob)).data.documents.length,
    0,
  );
  assert.equal(
    (await call("/api/documents/" + documentId, "GET", undefined, bob)).response
      .status,
    404,
  );
  assert.equal(
    (
      await call(
        "/api/documents/" + documentId,
        "PUT",
        { title: "Attack", content: "Stolen", report: null },
        bob,
      )
    ).response.status,
    404,
  );
  await call("/api/documents/" + documentId, "DELETE", {}, bob);
  assert.equal(
    (await call("/api/documents/" + documentId, "GET", undefined, alice)).data
      .document.title,
    "Private draft",
  );
});
test("forged cookies and local admin claims provide no access", async () => {
  assert.equal(
    (await call("/api/auth/me", "GET", undefined, "veritas_session=admin"))
      .response.status,
    401,
  );
  assert.equal(
    (
      await call(
        "/api/auth/me",
        "GET",
        undefined,
        "veritas_session=" + "a".repeat(64),
      )
    ).response.status,
    401,
  );
});
test("cross-origin writes are rejected", async () => {
  assert.equal(
    (
      await call(
        "/api/documents/" + documentId,
        "PUT",
        { title: "Attack", content: "malicious" },
        alice,
        { origin: "https://evil.example" },
      )
    ).response.status,
    403,
  );
});
test("Vercel branch writes require the exact platform alias and same-site requests", async () => {
  const keys = ["VERCEL", "VERCEL_URL", "VERCEL_BRANCH_URL", "APP_ORIGIN"];
  const saved = keys.map((key) => [key, process.env[key]] as const);
  const branchOrigin = "https://writing-git-preview-team.vercel.app";
  try {
    process.env.VERCEL = "1";
    process.env.VERCEL_URL = "preview-123.vercel.app";
    process.env.VERCEL_BRANCH_URL = "writing-git-preview-team.vercel.app";
    process.env.APP_ORIGIN = "https://writing.example";

    const allowed = await call("/api/auth/logout", "POST", {}, undefined, {
      origin: branchOrigin,
      "sec-fetch-site": "same-origin",
    });
    assert.equal(allowed.response.status, 200);

    const blockedHeaders: Record<string, string>[] = [
      { origin: "https://unrelated.vercel.app" },
      { origin: "https://writing-git-preview-team.vercel.app.evil.example" },
      { origin: "http://writing-git-preview-team.vercel.app" },
      { origin: branchOrigin, "sec-fetch-site": "cross-site" },
    ];
    for (const headers of blockedHeaders) {
      const denied = await call("/api/auth/logout", "POST", {}, undefined, headers);
      assert.equal(denied.response.status, 403, JSON.stringify(headers));
      assert.equal(denied.data.error, "Request origin is not allowed.");
    }

    process.env.VERCEL = "";
    const outsideVercel = await call("/api/auth/logout", "POST", {}, undefined, { origin: branchOrigin });
    assert.equal(outsideVercel.response.status, 403);
  } finally {
    for (const [key, value] of saved) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});

test("malformed JSON is a generic 400", async () => {
  const r = await fetch(base + "/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: '{"password":"secret"',
  });
  assert.equal(r.status, 400);
  assert.equal((await r.json()).error, "Invalid JSON request.");
});
test("oversized document and invalid report are rejected", async () => {
  assert.equal(
    (
      await call(
        "/api/documents/" + documentId,
        "PUT",
        { title: "large", content: "x".repeat(15001) },
        alice,
      )
    ).response.status,
    400,
  );
  assert.equal(
    (
      await call(
        "/api/documents/" + documentId,
        "PUT",
        { title: "bad", content: "text", report: { ai: {} } },
        alice,
      )
    ).response.status,
    400,
  );
});
test("cache includes full text, case, and account identity", () => {
  assert.notEqual(
    getCacheKey("ai", "x".repeat(500) + "a", "alice"),
    getCacheKey("ai", "x".repeat(500) + "b", "alice"),
  );
  assert.notEqual(
    getCacheKey("ai", "Hello", "alice"),
    getCacheKey("ai", "hello", "alice"),
  );
  assert.notEqual(
    getCacheKey("ai", "Hello", "alice"),
    getCacheKey("ai", "Hello", "bob"),
  );
});
test("heuristic scan works and repeated text is cached", async () => {
  const text =
    "I wrote this short example today. It contains several sentences with different rhythms. Some are short.";
  const a = await call("/api/detect/ai", "POST", { text }, alice);
  assert.equal(a.response.status, 200);
  assert.ok(a.data.analysis.sentenceAnalysis.length);
  const b = await call("/api/detect/ai", "POST", { text }, alice);
  assert.equal(b.data.fromCache, true);
});
test("PDF import extracts actual document text", async () => {
  const { PDFDocument, StandardFonts } = await import("pdf-lib");
  const pdf = await PDFDocument.create();
  const page = pdf.addPage();
  page.drawText("A genuine PDF import test.", {
    x: 50,
    y: 700,
    font: await pdf.embedFont(StandardFonts.Helvetica),
  });
  const bytes = await pdf.save();
  const result = await call(
    "/api/parse/pdf",
    "POST",
    { fileBase64: Buffer.from(bytes).toString("base64"), fileName: "test.pdf" },
    alice,
  );
  assert.equal(result.response.status, 200);
  assert.match(result.data.text, /genuine PDF import test/);
});
test("missing web search never certifies originality", async () => {
  const { data } = await call(
    "/api/detect/plagiarism",
    "POST",
    { text: "This is a document to search for source similarity." },
    alice,
  );
  assert.equal(data.analysis.verdict, "Not checked");
});
test("rewrite rejects unsupported styles and labels its limited basic mode without a model", async () => {
  await query("DELETE FROM rate_limits WHERE key LIKE 'analysis:%'");
  const text = "This original document should be edited without losing its meaning.";
  const invalid = await call(
    "/api/fix/humanize", "POST", { text, style: "unsupported" }, alice,
  );
  assert.equal(invalid.response.status, 400);
  const missing = await call(
    "/api/fix/humanize", "POST", { text, style: "natural" }, alice,
  );
  assert.equal(missing.response.status, 200);
  assert.equal(typeof missing.data.rewrittenText, "string");
  assert.match(missing.data.engine, /no AI/);
  assert.ok(missing.data.warnings.length > 0);
});
test("rewrite returns edited text, isolates its cache and saves a rewrite-only report", async () => {
  await query("DELETE FROM rate_limits WHERE key LIKE 'analysis:%'");
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.AI_GATEWAY_API_KEY;
  process.env.AI_GATEWAY_API_KEY = "test-gateway-key";
  const text = "It is worth noting that our first community workshop starts on 12 March, according to [1].";
  const rewrittenText = "Our first community workshop starts on 12 March, according to [1].";
  let providerCalls = 0;
  try {
    globalThis.fetch = async (input, init) => {
      if (String(input) !== "https://ai-gateway.vercel.sh/v1/responses")
        return originalFetch(input, init);
      providerCalls++;
      const request = JSON.parse(String(init?.body));
      assert.equal(request.store, false);
      assert.match(request.input, /12 March/);
      return Response.json({ output: [{ type: "message", content: [{
        type: "output_text",
        text: JSON.stringify({ rewrittenText, changes: ["Removed an empty introductory phrase."], predictedAiScore: 0 }),
      }] }] });
    };
    const first = await call("/api/fix/humanize", "POST", { text, style: "natural" }, alice);
    assert.equal(first.response.status, 200);
    assert.equal(first.data.success, true);
    assert.equal(first.data.rewrittenText, rewrittenText);
    assert.equal(first.data.style, "natural");
    assert.equal(first.data.predictedAiScore, undefined);
    assert.match(first.data.engine, /Vercel gateway/);
    const repeated = await call("/api/fix/humanize", "POST", { text, style: "natural" }, alice);
    assert.equal(repeated.data.fromCache, true);
    assert.equal(providerCalls, 1);
    assert.equal((await call("/api/fix/humanize", "POST", { text, style: "professional" }, alice)).response.status, 200);
    assert.equal(providerCalls, 2);
    const otherAccount = await call("/api/fix/humanize", "POST", { text, style: "natural" }, bob);
    assert.equal(otherAccount.response.status, 200);
    assert.equal(otherAccount.data.fromCache, undefined);
    assert.equal(providerCalls, 3);

    const rewriteId = randomUUID();
    const report = {
      scannedAt: new Date().toISOString(), originalText: text,
      rewrite: { rewrittenText: first.data.rewrittenText, changes: first.data.changes, engine: first.data.engine, style: first.data.style },
    };
    assert.equal((await call("/api/documents/" + rewriteId, "PUT", { title: "Edited workshop draft", content: text, report }, alice)).response.status, 200);
    const loaded = await call("/api/documents/" + rewriteId, "GET", undefined, alice);
    assert.equal(loaded.data.document.content, text);
    assert.deepEqual(loaded.data.document.report, report);
    assert.equal((await call("/api/documents/" + rewriteId, "GET", undefined, bob)).response.status, 404);
    assert.equal((await call("/api/documents/" + rewriteId, "PUT", { title: "Other user", content: text, report }, bob)).response.status, 404);
    const invalidReport = { ...report, rewrite: { ...report.rewrite, rewrittenText: "x".repeat(15001) } };
    assert.equal((await call("/api/documents/" + rewriteId, "PUT", { title: "Invalid output", content: text, report: invalidReport }, alice)).response.status, 400);
  } finally {
    globalThis.fetch = originalFetch;
    process.env.AI_GATEWAY_API_KEY = originalKey;
  }
});
test("rewrite discards malformed model output without overwriting original text", async () => {
  await query("DELETE FROM rate_limits WHERE key LIKE 'analysis:%'");
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.AI_GATEWAY_API_KEY;
  process.env.AI_GATEWAY_API_KEY = "test-gateway-key";
  try {
    globalThis.fetch = async (input, init) => String(input) === "https://ai-gateway.vercel.sh/v1/responses"
      ? Response.json({ output: [{ type: "message", content: [{ type: "output_text", text: '{"rewrittenText":42}' }] }] })
      : originalFetch(input, init);
    const result = await call("/api/fix/humanize", "POST", {
      text: "A separate original document whose invalid model result must not be accepted.", style: "concise",
    }, alice);
    assert.equal(result.response.status, 503);
    assert.equal(result.data.rewrittenText, undefined);
  } finally {
    globalThis.fetch = originalFetch;
    process.env.AI_GATEWAY_API_KEY = originalKey;
  }
});
test("plagiarism check returns only searched HTTP sources and caches the result", async () => {
  await query("DELETE FROM rate_limits WHERE key LIKE 'analysis:%'");
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.AI_GATEWAY_API_KEY;
  process.env.AI_GATEWAY_API_KEY = "test-gateway-key";
  let providerCalls = 0;
  try {
    globalThis.fetch = async (input, init) => {
      if (String(input) !== "https://ai-gateway.vercel.sh/v1/responses") return originalFetch(input, init);
      providerCalls++;
      const request = JSON.parse(String(init?.body));
      assert.equal(request.tools[0].type, "web_search");
      assert.equal(request.tool_choice, "required");
      const analysis = {
        similarityScore: 25, verdict: "Possible source matches", summary: "Review sources.", flaggedPassages: [],
        matchedSources: [
          { title: "Actual search source", url: "https://example.com/source", matchedExcerpt: "Workshop source passage" },
          { title: "Invented citation", url: "https://example.com/invented" },
          { title: "Unsafe URL", url: "javascript:alert(1)" },
        ],
      };
      return Response.json({ output: [
        { type: "message", content: [{ type: "output_text", text: JSON.stringify(analysis) }] },
        { type: "web_search_call", action: { sources: [{ url: "https://example.com/source" }, { url: "javascript:alert(1)" }] } },
      ] });
    };
    const text = "Workshop source passage and other writing for a grounded plagiarism search.";
    const result = await call("/api/detect/plagiarism", "POST", { text }, alice);
    assert.equal(result.response.status, 200);
    assert.deepEqual(result.data.analysis.matchedSources.map((source: any) => source.url), ["https://example.com/source"]);
    assert.match(result.data.analysis.summary, /coverage is incomplete/);
    const repeated = await call("/api/detect/plagiarism", "POST", { text }, alice);
    assert.equal(repeated.data.fromCache, true);
    assert.equal(providerCalls, 1);
  } finally {
    globalThis.fetch = originalFetch;
    process.env.AI_GATEWAY_API_KEY = originalKey;
  }
});
test("PDF parser rejects invalid files and wrong data types", async () => {
  for (const fileBase64 of ["bm90IGEgcGRm", 42])
    assert.equal(
      (await call("/api/parse/pdf", "POST", { fileBase64 }, alice)).response
        .status,
      400,
    );
});
test("legacy email relay is disabled", async () => {
  assert.equal(
    (
      await call("/api/send-verification", "POST", {
        email: "victim@example.com",
        code: "<html>",
      })
    ).response.status,
    410,
  );
});
test("security headers protect account responses", async () => {
  const { response } = await call("/api/auth/me", "GET", undefined, alice);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.equal(response.headers.get("x-powered-by"), null);
});
test("wrong passwords are rejected and valid login rotates session", async () => {
  assert.equal(
    (
      await call("/api/auth/login", "POST", {
        email: "alice@example.com",
        password: "Wrong-password-12345",
      })
    ).response.status,
    401,
  );
  const { response } = await call(
    "/api/auth/login",
    "POST",
    { email: "alice@example.com", password: "Alice-test-password-123" },
    alice,
  );
  assert.equal(response.status, 200);
  const old = alice;
  alice = response.headers.get("set-cookie")!.split(";")[0];
  assert.notEqual(old, alice);
  assert.equal(
    (await call("/api/auth/me", "GET", undefined, old)).response.status,
    401,
  );
});
test("logout revokes server session", async () => {
  assert.equal(
    (await call("/api/auth/logout", "POST", {}, alice)).response.status,
    200,
  );
  assert.equal(
    (await call("/api/auth/me", "GET", undefined, alice)).response.status,
    401,
  );
});
test("expired session is rejected", async () => {
  await query("UPDATE sessions SET expires_at=$1", [0]);
  assert.equal(
    (await call("/api/auth/me", "GET", undefined, bob)).response.status,
    401,
  );
});
test("existing accounts and old sessions must verify after migration; expiry, cooldown and attempts are enforced", async () => {
  const [account] = await query("SELECT id FROM accounts WHERE email=$1", [
    "alice@example.com",
  ]);
  await query("UPDATE accounts SET verified_at=NULL WHERE id=$1", [account.id]);
  const login = await call("/api/auth/login", "POST", {
    email: "alice@example.com",
    password: "Alice-test-password-123",
  });
  assert.equal(login.response.status, 202);
  const cookie = login.response.headers.get("set-cookie")!.split(";")[0];
  assert.equal(
    (await call("/api/documents", "GET", undefined, cookie)).response.status,
    403,
  );
  assert.equal(
    (await call("/api/auth/me", "GET", undefined, cookie)).data.user.verified,
    false,
  );
  assert.equal(
    (await call("/api/auth/resend-verification", "POST", {}, cookie)).response
      .status,
    429,
  );
  for (let i = 0; i < 5; i++)
    await call("/api/auth/verify-email", "POST", { code: "000000" }, cookie);
  assert.equal(
    (await call("/api/auth/verify-email", "POST", { code: "123456" }, cookie))
      .response.status,
    400,
  );
  await query(
    "UPDATE verification_requests SET expires_at=0,attempts=0 WHERE user_id=$1",
    [account.id],
  );
  assert.equal(
    (await call("/api/auth/verify-email", "POST", { code: "123456" }, cookie))
      .response.status,
    400,
  );
});
test("concurrent duplicate registrations create only one canonical account", async () => {
  const responses = await Promise.all([
    call("/api/auth/register", "POST", {
      email: "DUPLICATE@example.com",
      password: "Duplicate-password-123",
    }),
    call("/api/auth/register", "POST", {
      email: "duplicate@example.com",
      password: "Duplicate-password-123",
    }),
  ]);
  assert.deepEqual(responses.map((r) => r.response.status).sort(), [202, 409]);
  const [count] = await query(
    "SELECT COUNT(*) AS total FROM accounts WHERE email=$1",
    ["duplicate@example.com"],
  );
  assert.equal(Number(count.total), 1);
});
test("login rate limits persist in database", async () => {
  let status = 0;
  for (let i = 0; i < 12; i++)
    status = (
      await call("/api/auth/login", "POST", {
        email: "nobody@example.com",
        password: "Some-password-12345",
      })
    ).response.status;
  assert.equal(status, 429);
});
test("saved drafts persist when opened by a new server process", () => {
  const output = execFileSync(
    process.execPath,
    [
      "--import",
      "tsx",
      "--input-type=module",
      "-e",
      "import {query} from './server/storage.ts'; const [row]=await query('SELECT title,content FROM documents WHERE id=$1',[process.env.TEST_DOCUMENT_ID]); console.log(JSON.stringify(row));",
    ],
    { encoding: "utf8", env: { ...process.env, TEST_DOCUMENT_ID: documentId } },
  );
  const row = JSON.parse(output.trim());
  assert.equal(row.title, "Private draft");
  assert.equal(row.content, "A private document that should remain private.");
});
