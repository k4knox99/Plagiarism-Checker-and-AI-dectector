import { after, before, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync } from "node:fs";
import path from "node:path";

mkdirSync("work", { recursive: true });
process.env.DATA_DIR = mkdtempSync(path.resolve("work/gemini-api-db-"));
for (const name of ["DATABASE_URL", "GEMINI_API_KEY", "GOOGLE_API_KEY", "GEMINI_MODEL", "AI_GATEWAY_API_KEY", "VERCEL_OIDC_TOKEN", "VERCEL"])
  process.env[name] = "";
process.env.NODE_ENV = "test";
const { default: app } = await import("../server/app.js");
const { query } = await import("../server/storage.js");
const { setVerificationProviderForTests } = await import("../server/verification.js");
const { DEFAULT_GEMINI_MODEL, geminiModel, geminiConfigured, getAIClient, generateGemini, GeminiError } = await import("../server/gemini.js");
const { runGeminiDeploymentChecks } = await import("../scripts/check-gemini.js");
setVerificationProviderForTests({ send: async () => {}, verify: async () => {} });
const realFetch = globalThis.fetch;
const testKey = "gemini-test-only-never-a-real-key";
let server: ReturnType<typeof app.listen>, base: string, alice: string, bob: string;

async function call(route: string, text: string, cookie = alice) {
  const response = await realFetch(base + route, {
    method: "POST", headers: { "content-type": "application/json", Cookie: cookie },
    body: JSON.stringify({ text }),
  });
  return { status: response.status, data: await response.json() };
}
async function register(email: string) {
  const response = await realFetch(base + "/api/auth/register", {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password: "Gemini-api-test-password-2026" }),
  });
  assert.equal(response.status, 202);
  const verified = await realFetch(base + "/api/auth/verify-email", {
    method: "POST", headers: { "content-type": "application/json", Cookie: response.headers.get("set-cookie")!.split(";")[0] },
    body: JSON.stringify({ code: "123456" }),
  });
  assert.equal(verified.status, 200);
  return verified.headers.get("set-cookie")!.split(";")[0];
}
function reply(data: unknown, groundingChunks: unknown[] = [], extra: Record<string, unknown> = {}) {
  return Response.json({ candidates: [{
    content: { role: "model", parts: [{ text: typeof data === "string" ? data : JSON.stringify(data) }] },
    finishReason: "STOP", groundingMetadata: { groundingChunks }, ...extra,
  }] });
}
async function withGemini(provider: (request: any, index: number) => Response | Promise<Response>, run: (requests: any[]) => Promise<void>) {
  const requests: any[] = [];
  process.env.GEMINI_API_KEY = ` ${testKey} `;
  // Having Gateway credentials must never switch a configured Gemini request.
  process.env.AI_GATEWAY_API_KEY = "gateway-test-key-that-must-not-be-used";
  globalThis.fetch = async (input, options) => {
    const url = new URL(String(input));
    assert.equal(url.origin, "https://generativelanguage.googleapis.com", "Unexpected external call; no network is allowed in this test");
    assert.equal(url.pathname, `/v1beta/models/${geminiModel()}:generateContent`);
    assert.equal(new Headers(options?.headers).get("x-goog-api-key"), testKey);
    const request = JSON.parse(String(options?.body));
    requests.push(request);
    return provider(request, requests.length);
  };
  try { await run(requests); }
  finally { globalThis.fetch = realFetch; process.env.GEMINI_API_KEY = ""; process.env.AI_GATEWAY_API_KEY = ""; process.env.GEMINI_MODEL = ""; }
}

before(async () => {
  server = app.listen(0, "127.0.0.1");
  await new Promise<void>(resolve => server.once("listening", resolve));
  base = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
  alice = await register("gemini-alice@example.com");
  bob = await register("gemini-bob@example.com");
});
beforeEach(async () => { await query("DELETE FROM rate_limits"); });
after(() => new Promise<void>(resolve => server.close(() => resolve())));

test("HTTP rewriting uses Gemini SDK with a small budget, no Gateway, and owner-separated caching", async () => {
  const draft = "Our team is currently in the process of improving this synthetic sample.";
  const rewritten = "Our team is improving this synthetic sample.";
  await withGemini(() => reply({ rewrittenText: rewritten, changes: ["Removed wordy phrasing."], afterAiScore: 0 }), async requests => {
    const first = await call("/api/fix/humanize", draft);
    assert.equal(first.status, 200);
    assert.equal(first.data.rewrittenText, rewritten);
    assert.equal(first.data.engine, "Google Gemini writing edit");
    assert.equal(first.data.afterAiScore, undefined);
    assert.equal(requests[0].generationConfig.responseMimeType, "application/json");
    assert.equal(requests[0].generationConfig.thinkingConfig.thinkingLevel, "MINIMAL");
    assert.ok(requests[0].generationConfig.maxOutputTokens < 2048);
    assert.equal(requests[0].generationConfig.candidateCount, 1);
    assert.ok(JSON.stringify(requests[0].contents).includes(draft));
    assert.equal((await call("/api/fix/humanize", draft)).data.fromCache, true);
    assert.equal(requests.length, 1);
    assert.equal((await call("/api/fix/humanize", draft, bob)).status, 200);
    assert.equal(requests.length, 2);
  });
});

test("HTTP source search uses Gemini grounding and removes fabricated and active URLs", async () => {
  const actual = "https://example.org/grounded-source";
  await withGemini(() => reply({ similarityScore: 30, verdict: "Possible source matches", summary: "Synthetic result", matchedSources: [
    { title: "Grounded source", url: actual, matchedExcerpt: "A synthetic excerpt" },
    { title: "Invented source", url: "https://invented.invalid/fake" },
    { title: "Active URL", url: "javascript:alert(1)" },
  ], flaggedPassages: ["unverified"] }, [{ web: { uri: actual, title: "Grounded source" } }]), async requests => {
    const result = await call("/api/detect/plagiarism", "A synthetic document searches for source overlap with careful attribution.");
    assert.equal(result.status, 200);
    assert.deepEqual(result.data.analysis.matchedSources.map((source: any) => source.url), [actual]);
    assert.deepEqual(result.data.analysis.flaggedPassages, []);
    assert.match(result.data.analysis.summary, /coverage is incomplete/);
    assert.deepEqual(requests[0].tools, [{ googleSearch: {} }]);
    assert.equal(requests[0].generationConfig.maxOutputTokens, 1600);
    assert.equal(requests.length, 1);
  });
});

test("Google grounding redirect URIs survive as suggestions without invented matches", async () => {
  const redirect = "https://vertexaisearch.cloud.google.com/grounding-api-redirect/synthetic";
  await withGemini(() => reply({ similarityScore: 85, verdict: "Possible source matches", summary: "Synthetic result", matchedSources: [
    { title: "Model URL", url: "https://example.org/direct", matchedExcerpt: "Model's unverified quote" },
  ], flaggedPassages: [] }, [
    { web: { uri: redirect, title: "Metadata source title" } },
    { web: { uri: "javascript:alert(1)", title: "Unsafe" } },
  ]), async () => {
    const result = await call("/api/detect/plagiarism", "Another synthetic source search should retain grounded metadata redirects.");
    assert.equal(result.status, 200);
    assert.deepEqual(result.data.analysis.matchedSources, [{ title: "Metadata source title", url: redirect, matchedExcerpt: "" }]);
    assert.equal(result.data.analysis.similarityScore, 0);
    assert.match(result.data.analysis.summary, /no matching excerpt was verified/);
  });
});

test("ungrounded Gemini responses remain Not checked and are not cached", async () => {
  const draft = "This ungrounded synthetic sample cannot establish originality without search metadata.";
  await withGemini(() => reply({ similarityScore: 0, verdict: "Original", summary: "Unverified", matchedSources: [], flaggedPassages: [] }), async requests => {
    for (let attempt = 0; attempt < 2; attempt++) {
      const result = await call("/api/detect/plagiarism", draft);
      assert.equal(result.data.analysis.verdict, "Not checked");
      assert.match(result.data.analysis.summary, /No originality assessment/);
    }
    assert.equal(requests.length, 2);
  });
});

test("Gemini failures expose only fixed helpful messages and never retry through Gateway", async () => {
  const cases = [
    { status: 400, reason: "API_KEY_INVALID", message: /Gemini connection needs attention/ },
    { status: 403, reason: "PERMISSION_DENIED", message: /Gemini has restricted access/ },
    { status: 429, reason: "RESOURCE_EXHAUSTED", message: /Gemini's request or usage allowance/ },
    { status: 404, reason: "NOT_FOUND", message: /Gemini model is unavailable/ },
    { status: 500, reason: "INTERNAL", message: /Gemini is temporarily unavailable/ },
  ];
  let scenario = cases[0];
  const privateMarker = "PRIVATE_DOCUMENT_AND_PROVIDER_DETAILS_NEVER_EXPOSE";
  await withGemini(() => Response.json({ error: { code: scenario.status, status: scenario.reason, message: `${scenario.reason}: ${privateMarker} ${testKey}` } }, { status: scenario.status }), async requests => {
    for (const [index, item] of cases.entries()) {
      scenario = item;
      const draft = `The the synthetic failure sample ${index} should remain usable without leaking private provider details.`;
      const rewrite = await call("/api/fix/humanize", draft);
      assert.equal(rewrite.status, 200);
      assert.match(rewrite.data.engine, /no AI/i);
      assert.ok(rewrite.data.warnings.some((warning: string) => item.message.test(warning)));
      const search = await call("/api/detect/plagiarism", draft);
      assert.equal(search.status, 503);
      assert.match(search.data.error, item.message);
      assert.match(search.data.error, /No originality assessment/);
      for (const data of [rewrite.data, search.data]) {
        assert.ok(!JSON.stringify(data).includes(privateMarker));
        assert.ok(!JSON.stringify(data).includes(testKey));
        assert.ok(!JSON.stringify(data).includes("Gateway"));
      }
    }
    assert.equal(requests.length, cases.length * 2);
  });
});

test("malformed, truncated and continuation output never becomes a successful rewrite or extra request", async () => {
  for (const [index, response] of [
    reply("private invalid JSON that must not be logged"),
    reply({ rewrittenText: "A truncated result." }, [], { finishReason: "MAX_TOKENS" }),
    reply({ rewrittenText: "A continuation result." }, [], { finishReason: "CONTINUATION", continuationToken: "never-resume" }),
  ].entries()) {
    await withGemini(() => response, async requests => {
      const result = await call("/api/fix/humanize", `Synthetic malformed output case ${index} must leave the original document unchanged.`);
      assert.equal(result.status, 503);
      assert.equal(result.data.rewrittenText, undefined);
      assert.match(result.data.error, /Gemini returned an incomplete or invalid result/);
      assert.equal(requests.length, 1);
    });
  }
});

test("Gemini model overrides are validated and timeouts remain safe", async () => {
  assert.equal(geminiModel(), DEFAULT_GEMINI_MODEL);
  process.env.GEMINI_MODEL = "gemini-3.5-flash-lite/path?key=private";
  assert.throws(() => geminiModel(), error => error instanceof GeminiError && error.code === "invalid_configuration");
  process.env.GEMINI_MODEL = "";
  process.env.GOOGLE_API_KEY = " alternate-test-key ";
  assert.equal(geminiConfigured(), true);
  process.env.GOOGLE_API_KEY = "";
  await withGemini(() => { throw new DOMException("private timeout details", "TimeoutError"); }, async requests => {
    await assert.rejects(generateGemini(getAIClient()!, "Synthetic timeout", { maxOutputTokens: 256 }), error => error instanceof GeminiError && error.code === "request_timeout" && !String(error).includes("private"));
    assert.equal(requests.length, 1);
  });
});

test("deployment Gemini checks use at most two small calls and log independent safe outcomes", async () => {
  const reports: any[] = [];
  await withGemini((_request, index) => index === 1 ? reply({ rewrittenText: "We are improving.", changes: ["Removed filler."] })
    : Response.json({ error: { status: "PERMISSION_DENIED", message: `private ${testKey}` } }, { status: 403 }), async requests => {
    await runGeminiDeploymentChecks(value => reports.push(value));
    assert.equal(requests.length, 2);
    assert.deepEqual(requests.map(request => request.generationConfig.maxOutputTokens), [256, 384]);
    assert.deepEqual(reports, [
      { event: "ai_deploy_writing", success: true, status: 200, code: "ok", model: DEFAULT_GEMINI_MODEL },
      { event: "ai_deploy_web_search", success: false, status: 403, code: "access_denied", model: DEFAULT_GEMINI_MODEL },
    ]);
    assert.ok(!JSON.stringify(reports).includes(testKey));
    assert.ok(!JSON.stringify(reports).includes("private"));
  });
  const redirect = "https://vertexaisearch.cloud.google.com/grounding-api-redirect/smoke";
  await withGemini((_request, index) => index === 1 ? reply({ rewrittenText: "We are improving.", changes: ["Removed filler."] })
    : reply({ similarityScore: 0, verdict: "Possible source matches", summary: "Synthetic", matchedSources: [{ title: "Grounding", url: "https://ai.google.dev/gemini-api/docs/google-search", matchedExcerpt: "" }], flaggedPassages: [] }, [{ web: { uri: redirect } }]), async requests => {
    const successReports: any[] = [];
    await runGeminiDeploymentChecks(value => successReports.push(value));
    assert.equal(requests.length, 2);
    assert.equal(successReports[1].success, true);
    assert.equal(successReports[1].code, "ok");
  });
});
