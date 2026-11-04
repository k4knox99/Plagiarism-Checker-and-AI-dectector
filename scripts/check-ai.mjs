// Optional deployment-only smoke checks. No user documents or credentials are logged.
// The branch flag is removed after the intended deployment to avoid recurring calls.
if (process.env.VERITAS_AI_DEPLOY_CHECK !== "1") process.exit(0);

const endpoint = "https://ai-gateway.vercel.sh/v1/responses";
const token = process.env.VERCEL_OIDC_TOKEN;
const configuredModel = process.env.AI_GATEWAY_MODEL || "openai/gpt-5.4-mini";
const model = /^[a-z0-9.-]+\/[a-z0-9._:-]+$/i.test(configuredModel)
  ? configuredModel : null;
const safeCodes = new Set([
  "customer_verification_required", "insufficient_funds", "quota_for_entity_exceeded",
  "invalid_api_key", "model_not_found", "rate_limit_exceeded",
]);
function report(event, success, status, code) {
  console.log(JSON.stringify({event,success,status,code,model:model || "unconfigured"}));
}
if (!token || !model) {
  report("ai_deploy_configuration",false,0,!token ? "missing_build_token" : "invalid_model_configuration");
  process.exit(0);
}

function messageParts(body) {
  return (Array.isArray(body?.output) ? body.output : [])
    .filter(entry=>entry?.type === "message")
    .flatMap(entry=>Array.isArray(entry.content) ? entry.content : []);
}
function parseModelJson(body) {
  const raw = messageParts(body)
    .filter(part=>part?.type === "output_text" && typeof part.text === "string")
    .map(part=>part.text).join("");
  return JSON.parse(raw.match(/```(?:json)?\s*([\s\S]*?)```/)?.[1] || raw);
}
function hasGroundedOfficialSource(body) {
  const citations = messageParts(body)
    .flatMap(part=>Array.isArray(part.annotations) ? part.annotations : [])
    .filter(annotation=>annotation?.type === "url_citation")
    .map(annotation=>annotation.url);
  const searchSources = (Array.isArray(body?.output) ? body.output : [])
    .filter(entry=>entry?.type === "web_search_call")
    .flatMap(entry=>Array.isArray(entry.action?.sources) ? entry.action.sources : [])
    .map(source=>source?.url);
  return [...citations,...searchSources].some(value=>{
    try {
      const url = new URL(value);
      return url.protocol === "https:" && ["vercel.com","www.vercel.com"].includes(url.hostname);
    } catch { return false; }
  });
}
async function check(event, input, search, maxOutputTokens) {
  try {
    const response = await fetch(endpoint,{
      method:"POST",
      headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},
      body:JSON.stringify({
        model,input,max_output_tokens:maxOutputTokens,reasoning:{effort:"low"},store:false,
        instructions:"Return only the requested JSON object. This is a non-sensitive deployment smoke test.",
        ...(search ? {
          tools:[{type:"web_search",search_context_size:"low"}],
          tool_choice:"required",include:["web_search_call.action.sources"],
        } : {}),
      }),
      signal:AbortSignal.timeout(30000),redirect:"error",
    });
    const body = await response.json().catch(()=>null);
    if (!response.ok) {
      const code = safeCodes.has(body?.error?.code) ? body.error.code
        : response.status === 401 ? "invalid_api_key"
        : response.status === 429 ? "rate_limit_exceeded" : "provider_unavailable";
      report(event,false,response.status,code);
      return;
    }
    let success = false;
    try {
      const data = parseModelJson(body);
      success = search
        ? typeof data?.url === "string" && hasGroundedOfficialSource(body)
        : typeof data?.rewrittenText === "string" && data.rewrittenText.trim().length > 0;
    } catch { /* Invalid model output is reported without its content. */ }
    report(event,success,response.status,success ? "ok" : "invalid_response");
  } catch (error) {
    report(event,false,0,error instanceof Error && ["AbortError","TimeoutError"].includes(error.name)
      ? "request_timeout" : "network_error");
  }
}

await check("ai_deploy_writing",
  'Rewrite this sentence clearly: "We are currently in the process of making an improvement." Return JSON {"rewrittenText":"revised sentence"}.',
  false,256);
await check("ai_deploy_web_search",
  'Search official vercel.com documentation for AI Gateway. Return JSON {"title":"page title","url":"official documentation URL"}.',
  true,384);
// Service setup failures are diagnostic; independent site features can still deploy.
