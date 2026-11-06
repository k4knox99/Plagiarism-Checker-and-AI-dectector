import { classifyGeminiError, geminiModel, getAIClient, generateGemini, parseGeminiJson, geminiGroundedSources } from "../server/gemini.js";
import { validRewrite, validPlagiarism } from "../server/validation.js";

type Report = (value: { event: string; success: boolean; status: number; code: string; model: string }) => void;

// Invoked only by check-ai.mjs's explicit one-deployment opt-in flag. Reuse the
// real SDK client/config, disable retries/continuation, and send synthetic text.
export async function runGeminiDeploymentChecks(report: Report = value => console.log(JSON.stringify(value))) {
  let model: string;
  try { model = geminiModel(); }
  catch {
    report({ event: "ai_deploy_configuration", success: false, status: 0, code: "invalid_configuration", model: "unconfigured" });
    return;
  }
  const ai = getAIClient();
  if (!ai) {
    report({ event: "ai_deploy_configuration", success: false, status: 0, code: "missing_credentials", model });
    return;
  }
  const checks = [
    { event: "ai_deploy_writing", search: false, maxOutputTokens: 256,
      prompt: 'Rewrite this sentence clearly: "We are currently in the process of making an improvement." Return JSON {"rewrittenText":"revised sentence","changes":["one brief edit"]}. No extra fields.' },
    { event: "ai_deploy_web_search", search: true, maxOutputTokens: 384,
      prompt: 'Use one focused Google Search for official ai.google.dev documentation about Grounding with Google Search. This is a synthetic source-search check. Return JSON {"similarityScore":0,"verdict":"Possible source matches","summary":"brief","matchedSources":[{"title":"source title","url":"source URL","matchedExcerpt":""}],"flaggedPassages":[]}. Return one grounded source and no extra fields.' },
  ];
  for (const check of checks) {
    let status = 0;
    try {
      const response = await generateGemini(ai, check.prompt, {
        search: check.search, maxOutputTokens: check.maxOutputTokens, temperature: 0.1,
      });
      status = 200;
      const data = parseGeminiJson(response);
      const success = check.search
        ? validPlagiarism(data) && Array.isArray(data.flaggedPassages) && geminiGroundedSources(response).size > 0
        : validRewrite({ rewrittenText: data?.rewrittenText, changes: data?.changes, style: "natural", engine: "Google Gemini writing edit" }) &&
          Array.isArray(data?.changes) && data.rewrittenText.length <= 500;
      report({ event: check.event, success, status, code: success ? "ok" : "invalid_response", model });
    } catch (error) {
      const safe = classifyGeminiError(error);
      report({ event: check.event, success: false, status: status || safe.status, code: safe.code, model });
    }
  }
}
