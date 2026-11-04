import { test } from "node:test";
import assert from "node:assert/strict";
import { AsyncLocalStorage } from "node:async_hooks";
import { gatewayAnalysis, gatewayConfigured, GatewayError, gatewayErrorMessage, classifyGatewayError } from "../server/gateway.js";

const contextSymbol = Symbol.for("@vercel/request-context");
const requestContexts = new AsyncLocalStorage<{headers: Record<string, string>}>();
const globals = globalThis as any;
function tokenFor(label: string) {
  const header = Buffer.from('{"alg":"none"}').toString("base64url");
  const payload = Buffer.from(JSON.stringify({sub:label,exp:Math.floor(Date.now()/1000)+3600})).toString("base64url");
  return `${header}.${payload}.test-signature`;
}
function preserveSettings() {
  const envKeys = ["VERCEL", "AI_GATEWAY_API_KEY", "VERCEL_OIDC_TOKEN", "VERCEL_OIDC_TOKEN_FILE"];
  const env = new Map(envKeys.map(key=>[key,process.env[key]]));
  const context = globals[contextSymbol], originalFetch = globalThis.fetch;
  for (const key of envKeys) delete process.env[key];
  globals[contextSymbol] = {get:()=>requestContexts.getStore()};
  return () => {
    for (const [key,value] of env) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
    if (context === undefined) delete globals[contextSymbol]; else globals[contextSymbol] = context;
    globalThis.fetch = originalFetch;
  };
}
function modelReply(data: unknown) {
  return Response.json({output:[{type:"message",content:[{type:"output_text",text:JSON.stringify(data)}]}]});
}

test("deployed Functions use the current request OIDC token and isolate concurrent requests", async () => {
  const restore = preserveSettings();
  process.env.VERCEL = "1";
  const tokens: Record<string,string> = {alice:tokenFor("alice"),bob:tokenFor("bob"),rotated:tokenFor("rotated")};
  const received: string[] = [];
  try {
    globalThis.fetch = async (_url, options) => {
      const input = JSON.parse(String(options?.body)).input;
      const authorization = new Headers(options?.headers).get("authorization");
      assert.equal(authorization, `Bearer ${tokens[input]}`);
      received.push(input);
      await Promise.resolve();
      return modelReply({identity:input});
    };
    const invoke = (label: string) => requestContexts.run(
      {headers:{"x-vercel-oidc-token":tokens[label]}},
      async () => {
        assert.equal(gatewayConfigured(),true);
        return (await gatewayAnalysis(label)).data.identity;
      },
    );
    assert.deepEqual(await Promise.all([invoke("alice"),invoke("bob")]),["alice","bob"]);
    assert.equal(await invoke("rotated"),"rotated");
    assert.equal(gatewayConfigured(),false);
    assert.equal(received.length,3);
  } finally { restore(); }
});

test("self-hosted requests cannot supply a platform header to enable AI access", async () => {
  const restore = preserveSettings();
  let calls = 0;
  try {
    globalThis.fetch = async () => { calls++; return modelReply({}); };
    await requestContexts.run({headers:{"x-vercel-oidc-token":tokenFor("untrusted")}},async()=>{
      assert.equal(gatewayConfigured(),false);
      await assert.rejects(gatewayAnalysis("private document"),error=>error instanceof GatewayError && error.code==="missing_credentials");
    });
    assert.equal(calls,0);
  } finally { restore(); }
});

test("explicit API credentials take priority over platform request credentials", async () => {
  const restore = preserveSettings();
  process.env.VERCEL = "1";
  process.env.AI_GATEWAY_API_KEY = " owner-configured-test-key ";
  try {
    globalThis.fetch = async (_url,options) => {
      assert.equal(new Headers(options?.headers).get("authorization"),"Bearer owner-configured-test-key");
      return modelReply({ok:true});
    };
    const result = await requestContexts.run({headers:{"x-vercel-oidc-token":tokenFor("platform")}},()=>gatewayAnalysis("test"));
    assert.equal(result.data.ok,true);
  } finally { restore(); }
});

test("provider diagnostics retain safe categories and hide raw messages", async () => {
  const restore = preserveSettings();
  process.env.AI_GATEWAY_API_KEY = "do-not-expose-this-key";
  try {
    globalThis.fetch = async () => Response.json({error:{code:"private-content-do-not-log",message:"private document and do-not-expose-this-key"}},{status:502});
    await assert.rejects(gatewayAnalysis("test"),error=>{
      assert.ok(error instanceof GatewayError);
      assert.equal(error.code,"provider_unavailable");
      assert.ok(!String(error).includes("private"));
      assert.ok(!gatewayErrorMessage(error).includes("do-not-expose"));
      return true;
    });
    assert.match(gatewayErrorMessage(new GatewayError("customer_verification_required")),/account verification/);
    assert.match(gatewayErrorMessage(new GatewayError("insufficient_funds")),/allowance is exhausted/);
    assert.match(gatewayErrorMessage(new GatewayError("quota_for_entity_exceeded")),/allowance is exhausted/);
    assert.match(gatewayErrorMessage(new GatewayError("rate_limit_exceeded")),/wait/);
  } finally { restore(); }
});

test("malformed provider responses cannot become successful tool output", async () => {
  const restore = preserveSettings();
  process.env.AI_GATEWAY_API_KEY = "unit-test-key";
  try {
    for (const body of [{output:{}},{output:[{type:"message",content:[{type:"output_text",text:"private non-JSON text"}]}]}]) {
      globalThis.fetch = async () => Response.json(body);
      await assert.rejects(gatewayAnalysis("test"),error=>error instanceof GatewayError && error.code==="invalid_response");
    }
  } finally { restore(); }
});
test("gateway parses model JSON and retains only actual cited source URLs", async () => {
  const original = globalThis.fetch,
    token = process.env.AI_GATEWAY_API_KEY;
  process.env.AI_GATEWAY_API_KEY = "unit-test-only";
  try {
    globalThis.fetch = async (_url, options) => {
      const request = JSON.parse(String(options?.body));
      assert.equal(request.store, false);
      assert.equal(request.tools[0].type, "web_search");
      return Response.json({
        output: [
          {
            type: "message",
            content: [
              {
                type: "output_text",
                text: '{"similarityScore":0,"verdict":"Possible source matches","summary":"","matchedSources":[],"flaggedPassages":[]}',
                annotations: [
                  { type: "url_citation", url: "https://example.com/source" },
                ],
              },
            ],
          },
          {
            type: "web_search_call",
            action: { sources: [{ url: "https://example.org/source" }] },
          },
        ],
      });
    };
    const result = await gatewayAnalysis("test", true);
    assert.equal(result.data.similarityScore, 0);
    assert.equal(result.sources.size, 2);
  } finally {
    globalThis.fetch = original;
    if (token === undefined) delete process.env.AI_GATEWAY_API_KEY;
    else process.env.AI_GATEWAY_API_KEY = token;
  }
});
test("gateway reports provider setup errors without revealing credentials", async () => {
  const original = globalThis.fetch,
    token = process.env.AI_GATEWAY_API_KEY;
  process.env.AI_GATEWAY_API_KEY = "unit-test-only";
  try {
    globalThis.fetch = async () =>
      Response.json(
        { error: { code: "customer_verification_required" } },
        { status: 403 },
      );
    await assert.rejects(
      gatewayAnalysis("test"),
      (error) =>
        (error as any).code === "customer_verification_required" &&
        !String(error).includes("unit-test-only"),
    );
  } finally {
    globalThis.fetch = original;
    if (token === undefined) delete process.env.AI_GATEWAY_API_KEY;
    else process.env.AI_GATEWAY_API_KEY = token;
  }
});

test("Gateway compatible error.type and message-only verification errors retain actionable categories", async () => {
  const restore = preserveSettings();
  process.env.AI_GATEWAY_API_KEY = "secret-test-key";
  const cases = [
    {body:{error:{message:"Requires verification",type:"customer_verification_required"}},status:403,code:"customer_verification_required"},
    {body:{error:{message:"Forbidden.",type:"access_denied"}},status:403,code:"access_denied"},
    {body:{type:"customer_verification_required",message:"Requires verification"},status:403,code:"customer_verification_required"},
    {body:{error:{message:"AI Gateway requires a valid credit card on file to service requests."}},status:403,code:"customer_verification_required"},
    {body:{error:{message:"Forbidden."}},status:403,code:"access_denied"},
    {body:{error:{type:"insufficient_funds",message:"Private provider details"}},status:402,code:"insufficient_funds"},
    {body:{error:{type:"quota_for_entity_exceeded"}},status:402,code:"quota_for_entity_exceeded"},
    {body:{error:{type:"rate_limit_exceeded"}},status:429,code:"rate_limit_exceeded"},
    {body:{error:{type:"private-unrecognized-type",message:"secret-test-key"}},status:500,code:"provider_unavailable"},
  ];
  try {
    for (const scenario of cases) {
      assert.equal(classifyGatewayError(scenario.body,scenario.status),scenario.code);
      globalThis.fetch = async () => Response.json(scenario.body,{status:scenario.status});
      await assert.rejects(gatewayAnalysis("test"),error=>{
        assert.ok(error instanceof GatewayError);
        assert.equal(error.code,scenario.code);
        assert.ok(!gatewayErrorMessage(error).includes("secret-test-key"));
        return true;
      });
    }
    assert.match(gatewayErrorMessage(new GatewayError("access_denied")),/review AI Gateway access/);
    assert.ok(!gatewayErrorMessage(new GatewayError("access_denied")).includes("verification"));
  } finally { restore(); }
});
