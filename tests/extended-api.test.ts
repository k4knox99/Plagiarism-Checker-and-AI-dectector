import { after, before, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdirSync, mkdtempSync } from "node:fs";
import path from "node:path";

mkdirSync("work", { recursive: true });
process.env.DATA_DIR = mkdtempSync(path.resolve("work/extended-api-db-"));
for (const name of ["DATABASE_URL", "GEMINI_API_KEY", "GOOGLE_API_KEY", "AI_GATEWAY_API_KEY", "VERCEL_OIDC_TOKEN", "VERCEL"])
  process.env[name] = "";
process.env.NODE_ENV = "test";

const { default: app } = await import("../server/app.js");
const { query } = await import("../server/storage.js");
const { setVerificationProviderForTests, VerificationError } = await import("../server/verification.js");
const delivered = new Map<string, string>();
setVerificationProviderForTests({
  send: async (email) => { delivered.set(email, "123456"); },
  verify: async (email, code) => {
    if (delivered.get(email) !== code) throw new VerificationError("Incorrect test code");
    delivered.delete(email);
  },
});

let server: ReturnType<typeof app.listen>, base: string;
let alice: string, bob: string, pending: string;
const realFetch = globalThis.fetch;
const text = "Our small team studies clear writing and shares useful findings with readers. Every source needs careful review before publication.";
const summaryOutput = {
  summary: "The team studies clear writing and reviews sources before publishing.",
  keyPoints: ["The team studies clear writing.", "Sources need careful review."],
  outline: ["Writing research", "Source review"],
};

async function call(route: string, method = "POST", body?: unknown, cookie?: string) {
  const response = await fetch(base + route, {
    method,
    headers: { ...(body === undefined ? {} : { "Content-Type": "application/json" }), ...(cookie ? { Cookie: cookie } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { response, data: await response.json() };
}
async function register(email: string, verify = true) {
  const registered = await call("/api/auth/register", "POST", { email, password: "Extended-api-test-password-2026" });
  assert.equal(registered.response.status, 202);
  const cookie = registered.response.headers.get("set-cookie")!.split(";")[0];
  if (!verify) return cookie;
  const confirmed = await call("/api/auth/verify-email", "POST", { code: "123456" }, cookie);
  assert.equal(confirmed.response.status, 200);
  assert.equal(confirmed.data.user.verified, true);
  return confirmed.response.headers.get("set-cookie")!.split(";")[0];
}
async function withGateway(
  output: unknown | ((request: any, index: number) => unknown),
  run: (requests: any[]) => Promise<void>,
) {
  const previousFetch = globalThis.fetch, previousKey = process.env.AI_GATEWAY_API_KEY;
  const requests: any[] = [];
  process.env.AI_GATEWAY_API_KEY = "extended-api-test-key-only";
  globalThis.fetch = async (input, options) => {
    const url = String(input);
    if (url.startsWith(base + "/")) return realFetch(input, options);
    assert.equal(url, "https://ai-gateway.vercel.sh/v1/responses", "Unexpected external request");
    const request = JSON.parse(String(options?.body));
    assert.equal(request.store, false);
    requests.push(request);
    const data = typeof output === "function" ? output(request, requests.length) : output;
    return Response.json({ output: [{ type: "message", content: [{ type: "output_text", text: JSON.stringify(data) }] }] });
  };
  try { await run(requests); }
  finally {
    globalThis.fetch = previousFetch;
    if (previousKey === undefined) delete process.env.AI_GATEWAY_API_KEY;
    else process.env.AI_GATEWAY_API_KEY = previousKey;
  }
}

before(async () => {
  server = app.listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", resolve));
  base = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
  alice = await register("extended-alice@example.com");
  bob = await register("extended-bob@example.com");
  pending = await register("extended-pending@example.com", false);
});
// Isolate feature assertions from rate-window consumption; production rate-limit
// enforcement has its own integration test against a separate temporary DB.
beforeEach(async () => { await query("DELETE FROM rate_limits"); });
after(() => new Promise<void>((resolve) => server.close(() => resolve())));

test("new local tools require a signed-in account with confirmed email", async () => {
  for (const route of ["compare", "citations", "proofread", "summarize"]) {
    const body = { text, comparisonText: text, title: "A useful source" };
    assert.equal((await call(`/api/tools/${route}`, "POST", body)).response.status, 401);
    const blocked = await call(`/api/tools/${route}`, "POST", body, pending);
    assert.equal(blocked.response.status, 403);
    assert.equal(blocked.data.code, "EMAIL_VERIFICATION_REQUIRED");
  }
});

test("two-document API returns real overlapping passages and validates comparison input", async () => {
  const source = "The notes begin here. " + text + " These notes conclude here.";
  const result = await call("/api/tools/compare", "POST", { text, comparisonText: source, excludeQuotes: false, excludeReferences: false }, alice);
  assert.equal(result.response.status, 200);
  assert.equal(result.data.analysis.similarityScore, 100);
  assert.ok(result.data.analysis.matchedWords > 0);
  assert.ok(result.data.analysis.matches.length > 0);
  for (const match of result.data.analysis.matches) {
    assert.equal(text.slice(match.start, match.end), match.text);
    assert.equal(source.slice(match.sourceStart, match.sourceEnd), match.sourceText);
  }
  for (const body of [
    { text, comparisonText: { private: "invalid" } },
    { text, comparisonText: "x".repeat(15001) },
    { text, comparisonText: source, excludeQuotes: "yes" },
  ]) assert.equal((await call("/api/tools/compare", "POST", body, alice)).response.status, 400);
});

test("comparison exclusions remove quoted and reference-only matches through the API", async () => {
  const shared = "These seven shared words appear only inside quotations";
  const draft = `An entirely independent introduction stays here. “${shared}”\n\nReferences\nA shared bibliography contains these several reference words.`;
  const source = `${shared}. A shared bibliography contains these several reference words.`;
  const included = await call("/api/tools/compare", "POST", { text: draft, comparisonText: source }, alice);
  const excluded = await call("/api/tools/compare", "POST", { text: draft, comparisonText: source, excludeQuotes: true, excludeReferences: true }, alice);
  assert.ok(included.data.analysis.matchedWords > 0);
  assert.equal(excluded.response.status, 200);
  assert.equal(excluded.data.analysis.matchedWords, 0);
});

test("citation API rejects active URLs and saves citation results with an empty draft", async () => {
  const bad = await call("/api/tools/citations", "POST", { title: "Example", url: "javascript:alert(1)" }, alice);
  assert.equal(bad.response.status, 400);
  const generated = await call("/api/tools/citations", "POST", { text: "", title: "A clear writing guide", author: "Example Organization", year: "2026", url: "https://example.com/guide" }, alice);
  assert.equal(generated.response.status, 200);
  for (const style of ["apa", "mla", "chicago", "bibtex"]) assert.match(generated.data.analysis[style], /clear writing guide/i);
  const id = randomUUID(), report = { citations: generated.data.analysis, originalText: "", scannedAt: new Date().toISOString() };
  assert.equal((await call(`/api/documents/${id}`, "PUT", { title: "Source notes", content: "", report }, alice)).response.status, 200);
  const loaded = await call(`/api/documents/${id}`, "GET", undefined, alice);
  assert.deepEqual(loaded.data.document.report, report);
  assert.equal((await call(`/api/documents/${id}`, "GET", undefined, bob)).response.status, 404);
});

test("proofreading without an AI provider returns labeled rules and reading insights", async () => {
  const draft = "At this point in time, the the team works in order to make the document clear.";
  const result = await call("/api/tools/proofread", "POST", { text: draft }, alice);
  assert.equal(result.response.status, 200);
  assert.match(result.data.analysis.engine, /basic|rules|no AI/i);
  assert.doesNotMatch(result.data.analysis.correctedText, /\bthe the\b/);
  assert.ok(result.data.analysis.issues.length > 0);
  assert.ok(result.data.analysis.insights.words > 0);
  assert.equal(typeof result.data.analysis.insights.readingLabel, "string");
  for (const issue of result.data.analysis.issues) assert.ok(draft.includes(issue.original));
});

test("summary API uses the configured model, reuses only the owner's cache, and fails on malformed output", async () => {
  const draft = text + " Summary-specific sample.";
  await withGateway(summaryOutput, async (requests) => {
    const first = await call("/api/tools/summarize", "POST", { text: draft }, alice);
    assert.equal(first.response.status, 200);
    assert.equal(first.data.analysis.summary, summaryOutput.summary);
    assert.ok(requests[0].input.includes(draft));
    const cached = await call("/api/tools/summarize", "POST", { text: draft }, alice);
    assert.equal(cached.data.fromCache, true);
    assert.equal(requests.length, 1);
    assert.equal((await call("/api/tools/summarize", "POST", { text: draft }, bob)).response.status, 200);
    assert.equal(requests.length, 2);
  });
  await withGateway({ summary: "Unstructured response", keyPoints: "not a list", outline: [] }, async () => {
    const bad = await call("/api/tools/summarize", "POST", { text: draft + " malformed" }, alice);
    assert.equal(bad.response.status, 503);
    assert.equal(bad.data.analysis, undefined);
  });
});

test("all extended result types survive save/load and malformed reports are rejected", async () => {
  const proofread = await call("/api/tools/proofread", "POST", { text }, alice);
  const compared = await call("/api/tools/compare", "POST", { text, comparisonText: text }, alice);
  const cited = await call("/api/tools/citations", "POST", { title: "Writing source", year: "2026" }, alice);
  await withGateway(summaryOutput, async () => {
    const summarized = await call("/api/tools/summarize", "POST", { text }, alice);
    const report = { proofread: proofread.data.analysis, compare: compared.data.analysis, citations: cited.data.analysis, summarize: summarized.data.analysis, originalText: text, scannedAt: new Date().toISOString() };
    const id = randomUUID();
    assert.equal((await call(`/api/documents/${id}`, "PUT", { title: "Extended findings", content: text, report }, alice)).response.status, 200);
    assert.deepEqual((await call(`/api/documents/${id}`, "GET", undefined, alice)).data.document.report, report);
    assert.equal((await call(`/api/documents/${id}`, "PUT", { title: "Overwrite attempt", content: text, report }, bob)).response.status, 404);
    for (const invalid of [
      { ...report, compare: { ...report.compare, similarityScore: 101 } },
      { ...report, proofread: { ...report.proofread, issues: [{ original: "a", suggestion: 42, category: "grammar", explanation: "bad" }] } },
      { ...report, summarize: { ...report.summarize, keyPoints: { invalid: true } } },
      { ...report, citations: { ...report.citations, bibtex: { invalid: true } } },
    ]) assert.equal((await call(`/api/documents/${randomUUID()}`, "PUT", { title: "Invalid report", content: text, report: invalid }, alice)).response.status, 400);
  });
});

test("rewrite voice preferences are included as data and partition the cache", async () => {
  const draft = text + " Advanced voice sample.";
  const output = { rewrittenText: "Our team examines clear writing and reviews every source carefully before publishing its findings.", changes: ["Simplified the wording."] };
  await withGateway(output, async (requests) => {
    const preferences = { text: draft, style: "natural", audience: "business", length: "shorter", voiceSample: "I write short sentences and explain ideas directly.", preserveTerms: "clear writing" };
    assert.equal((await call("/api/fix/humanize", "POST", preferences, alice)).response.status, 200);
    assert.ok(requests[0].input.includes(preferences.voiceSample));
    assert.ok(requests[0].input.includes(preferences.preserveTerms));
    assert.match(requests[0].input, /Audience: business/);
    assert.equal((await call("/api/fix/humanize", "POST", preferences, alice)).data.fromCache, true);
    assert.equal(requests.length, 1);
    assert.equal((await call("/api/fix/humanize", "POST", { ...preferences, voiceSample: "My voice has a more reflective rhythm." }, alice)).response.status, 200);
    assert.equal(requests.length, 2);
    assert.equal((await call("/api/fix/humanize", "POST", { ...preferences, length: "expanded" }, alice)).response.status, 200);
    assert.equal(requests.length, 3);
    assert.equal((await call("/api/fix/humanize", "POST", { ...preferences, voiceSample: "x".repeat(1501) }, alice)).response.status, 400);
  });
});

test("rewrite warns when a model changes numbers, citations, quotes, or protected terms", async () => {
  const draft = "The BrandToken study served 125 readers in 2025 (Smith, 2024). The author wrote, “Clarity matters every day.”";
  await withGateway({ rewrittenText: "The project helped readers understand the work clearly.", changes: ["Shortened the explanation."], afterAiScore: 0 }, async () => {
    const result = await call("/api/fix/humanize", "POST", { text: draft, style: "natural", preserveTerms: "BrandToken" }, alice);
    assert.equal(result.response.status, 200);
    assert.ok(result.data.warnings.some((warning: string) => /numbers/i.test(warning)));
    assert.ok(result.data.warnings.some((warning: string) => /citation/i.test(warning)));
    assert.ok(result.data.warnings.some((warning: string) => /quot/i.test(warning)));
    assert.ok(result.data.warnings.some((warning: string) => /protected terms/i.test(warning)));
    assert.equal(result.data.afterAiScore, undefined);
    const rewrite = { rewrittenText: result.data.rewrittenText, style: result.data.style, changes: result.data.changes, warnings: result.data.warnings, engine: result.data.engine };
    const report = { rewrite, originalText: draft, scannedAt: new Date().toISOString() };
    assert.equal((await call(`/api/documents/${randomUUID()}`, "PUT", { title: "Rewrite review", content: draft, report }, alice)).response.status, 200);
    const malformed = { ...report, rewrite: { ...rewrite, warnings: [42] } };
    assert.equal((await call(`/api/documents/${randomUUID()}`, "PUT", { title: "Invalid rewrite", content: draft, report: malformed }, alice)).response.status, 400);
  });
});
