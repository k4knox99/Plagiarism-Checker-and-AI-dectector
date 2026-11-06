import { test } from "node:test";
import assert from "node:assert/strict";
import { readApiResponse } from "../src/utils/apiResponse";
import { trustedOrigins } from "../server/origins.js";

test("HTML success pages cannot be mistaken for successful sign-up", async () => {
  await assert.rejects(
    readApiResponse(
      new Response("<html>Login</html>", {
        headers: { "content-type": "text/html" },
      }),
    ),
    /deployment routing/,
  );
});
test("restricted preview responses explain Vercel access", async () => {
  await assert.rejects(
    readApiResponse(new Response("Protected", { status: 401 })),
    /Vercel/,
  );
});
test("platform errors never expose their HTML to users", async () => {
  await assert.rejects(
    readApiResponse(
      new Response("<html>INTERNAL_ERROR</html>", { status: 500 }),
    ),
    /temporarily unavailable/,
  );
});
test("JSON API errors preserve actionable server messages", async () => {
  await assert.rejects(
    readApiResponse(
      Response.json(
        { error: "Accounts are not available yet." },
        { status: 503 },
      ),
    ),
    /Accounts are not available/,
  );
});
test("invalid JSON fails explicitly", async () => {
  await assert.rejects(
    readApiResponse(
      new Response("broken", {
        headers: { "content-type": "application/json" },
      }),
    ),
    /invalid response/,
  );
});
test("valid account response is preserved", async () => {
  assert.deepEqual(
    await readApiResponse(
      Response.json({ user: { id: "1", email: "test@example.com" } }),
    ),
    { user: { id: "1", email: "test@example.com" } },
  );
});
test("exact Vercel deployment origin works alongside a custom domain", () => {
  const origins = trustedOrigins({
    production: true,
    appOrigin: "https://writing.example/",
    vercelHost: "preview-123.vercel.app",
    localOrigin: "https://attacker.example",
  });
  assert.ok(origins.has("https://writing.example"));
  assert.ok(origins.has("https://preview-123.vercel.app"));
  assert.ok(!origins.has("https://attacker.example"));
});
test("only the exact HTTPS Vercel branch alias is trusted alongside other origins", () => {
  const origins = trustedOrigins({
    production: true,
    appOrigin: "https://writing.example/",
    vercelHost: "preview-123.vercel.app",
    vercelBranchHost: "Writing-Git-Preview-Team.vercel.app",
    localOrigin: "https://attacker.example",
  });
  assert.deepEqual([...origins].sort(), [
    "https://preview-123.vercel.app",
    "https://writing-git-preview-team.vercel.app",
    "https://writing.example",
  ]);
  assert.ok(!origins.has("http://writing-git-preview-team.vercel.app"));
  assert.ok(!origins.has("https://unrelated.vercel.app"));
});

test("a valid Vercel branch alias can configure production without a custom domain", () => {
  assert.deepEqual(
    [...trustedOrigins({
      production: true,
      vercelBranchHost: "writing-git-preview-team.vercel.app",
      localOrigin: "https://attacker.example",
    })],
    ["https://writing-git-preview-team.vercel.app"],
  );
});

test("hostile and malformed Vercel branch hosts fail closed", () => {
  for (const vercelBranchHost of [
    "evil.example",
    "writing.vercel.app.evil.example",
    "https://writing.vercel.app",
    "writing.vercel.app/path",
    "writing.vercel.app?origin=evil",
    "writing.vercel.app#evil",
    "writing.vercel.app:443",
    "writing.vercel.app@evil.example",
    "evil.example@writing.vercel.app",
  ]) {
    assert.equal(
      trustedOrigins({
        production: true,
        vercelBranchHost,
        localOrigin: "https://attacker.example",
      }).size,
      0,
      vercelBranchHost,
    );
  }
});

test("invalid preview hosts and missing production configuration fail closed", () => {
  assert.equal(
    trustedOrigins({
      production: true,
      vercelHost: "evil.example",
      localOrigin: "https://evil.example",
    }).size,
    0,
  );
});
