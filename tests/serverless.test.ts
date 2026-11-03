import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";

test("compiled serverless handler boots in plain Node and missing database returns JSON", () => {
  const output = execFileSync(
    process.execPath,
    [
      "--input-type=module",
      "-e",
      `
    import {createServer} from 'node:http';
    import handler from './work/compiled-api/handler.js';
    const server=createServer(handler); await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
    const base='http://127.0.0.1:'+server.address().port;
    const health=await fetch(base+'/api/health');
    const signup=await fetch(base+'/api/auth/register',{method:'POST',headers:{'content-type':'application/json',origin:'https://preview-example.vercel.app'},body:JSON.stringify({email:'test@example.com',password:'A-test-password-123'})});
    const badOrigin=await fetch(base+'/api/auth/register',{method:'POST',headers:{'content-type':'application/json',origin:'https://evil.example'},body:'{}'});
    console.log(JSON.stringify({health:health.status,status:signup.status,type:signup.headers.get('content-type'),body:await signup.json(),badOrigin:badOrigin.status}));
    await new Promise(resolve=>server.close(resolve));
  `,
    ],
    {
      encoding: "utf8",
      timeout: 20000,
      env: {
        ...process.env,
        NODE_ENV: "production",
        VERCEL: "1",
        VERCEL_URL: "preview-example.vercel.app",
        DATABASE_URL: "",
        APP_ORIGIN: "",
        GEMINI_API_KEY: "",
        GOOGLE_API_KEY: "",
      },
    },
  );
  const result = JSON.parse(output.trim().split("\n").at(-1)!);
  assert.equal(result.health, 200);
  assert.equal(result.status, 503);
  assert.match(result.type, /application\/json/);
  assert.equal(result.body.code, "STORAGE_NOT_CONFIGURED");
  assert.equal(result.badOrigin, 403);
});
