import { test } from "node:test";
import assert from "node:assert/strict";
import { gatewayAnalysis } from "../server/gateway.js";
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
