import { GoogleGenAI, ThinkingLevel, type GenerateContentResponse } from "@google/genai";

// Stable Flash-Lite supports JSON and Search grounding for new Gemini projects.
// Keep the runtime and opt-in deployment checks on the same model and limits.
export const DEFAULT_GEMINI_MODEL = "gemini-3.5-flash-lite";
export type GeminiErrorCode = "missing_credentials" | "invalid_configuration" | "invalid_api_key" |
  "access_denied" | "quota_exceeded" | "model_unavailable" | "request_timeout" |
  "invalid_response" | "blocked_response" | "provider_unavailable";

export class GeminiError extends Error {
  constructor(public code: GeminiErrorCode, public status = 503) {
    super("Gemini service is unavailable.");
  }
}

export function geminiConfigured(): boolean {
  return Boolean(geminiKey());
}
function geminiKey(): string | undefined {
  return [process.env.GEMINI_API_KEY, process.env.GOOGLE_API_KEY]
    .map(value => value?.trim()).find(value => value && value !== "MY_GEMINI_API_KEY");
}
export function geminiModel(): string {
  const model = process.env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL;
  if (model.length > 100 || !/^gemini-[a-z0-9]+(?:[.-][a-z0-9]+)*$/.test(model))
    throw new GeminiError("invalid_configuration");
  return model;
}
export function getAIClient(): GoogleGenAI | null {
  const apiKey = geminiKey();
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: { timeout: 35000, retryOptions: { attempts: 1 } },
  });
}

export function classifyGeminiError(error: unknown): GeminiError {
  if (error instanceof GeminiError) return error;
  const status = Number((error as { status?: unknown })?.status) || 0;
  // SDK errors may contain submitted text or credentials. Inspect only bounded
  // reason/status markers, and never return or log their raw message.
  const message = error instanceof Error ? error.message.slice(0, 4096) : "";
  if (/\bAPI_KEY_(?:INVALID|EXPIRED)\b/.test(message) || status === 401)
    return new GeminiError("invalid_api_key", status);
  if (status === 403) return new GeminiError("access_denied", status);
  if (status === 429) return new GeminiError("quota_exceeded", status);
  if (status === 404) return new GeminiError("model_unavailable", status);
  if (status === 400) return new GeminiError("invalid_configuration", status);
  if ((error instanceof Error && ["AbortError", "TimeoutError"].includes(error.name)) ||
      /\b(?:timed out|timeout)\b/i.test(message)) return new GeminiError("request_timeout");
  return new GeminiError("provider_unavailable", status);
}

export function geminiErrorMessage(error: GeminiError): string {
  if (["missing_credentials", "invalid_api_key", "invalid_configuration"].includes(error.code))
    return "The Gemini connection needs attention. The site owner should check its API key and model configuration.";
  if (error.code === "access_denied")
    return "Gemini has restricted access. The site owner should check the API key permissions, region, and billing setup for web search.";
  if (error.code === "quota_exceeded")
    return "Gemini's request or usage allowance has been reached. Please wait and try again, or contact the site owner.";
  if (error.code === "model_unavailable")
    return "The configured Gemini model is unavailable for this project. The site owner should review the model setting.";
  if (error.code === "blocked_response")
    return "Gemini could not process this text. Please review it and try again.";
  if (error.code === "invalid_response")
    return "Gemini returned an incomplete or invalid result. Please try again.";
  if (error.code === "request_timeout")
    return "Gemini took too long to respond. Please try again.";
  return "Gemini is temporarily unavailable. Please try again later.";
}

export async function generateGemini(ai: GoogleGenAI, contents: string, options: {
  maxOutputTokens: number; temperature?: number; search?: boolean;
}) {
  const model = geminiModel();
  try {
    const response = await ai.models.generateContent({
      model, contents,
      config: {
        maxOutputTokens: Math.max(128, Math.min(8192, Math.floor(options.maxOutputTokens))),
        temperature: options.temperature ?? 0.2,
        thinkingConfig: model.startsWith("gemini-2.5-") ? { thinkingBudget: model.includes("pro") ? 128 : 0 }
          : { thinkingLevel: model.includes("flash-lite") ? ThinkingLevel.MINIMAL : ThinkingLevel.LOW },
        candidateCount: 1,
        // The SDK otherwise resumes CONTINUATION results with extra billed calls.
        automaticContinuation: false,
        ...(options.search ? { tools: [{ googleSearch: {} }] } : { responseMimeType: "application/json" }),
      },
    });
    const reason = response.candidates?.[0]?.finishReason;
    if (response.promptFeedback?.blockReason || ["SAFETY", "BLOCKLIST", "PROHIBITED_CONTENT", "RECITATION"].includes(reason || ""))
      throw new GeminiError("blocked_response", 200);
    if (reason === "MAX_TOKENS" || reason === "CONTINUATION") throw new GeminiError("invalid_response", 200);
    return response;
  } catch (error) { throw classifyGeminiError(error); }
}

export function parseGeminiJson(response: GenerateContentResponse): any {
  const raw = response.text?.trim() || "";
  try { return JSON.parse(raw.match(/```(?:json)?\s*([\s\S]*?)```/)?.[1] || raw); }
  catch { throw new GeminiError("invalid_response"); }
}

export function geminiGroundedSources(response: GenerateContentResponse): Set<string> {
  return new Set((response.candidates?.[0]?.groundingMetadata?.groundingChunks || [])
    .map(chunk => chunk.web?.uri).filter((url): url is string => {
      try { return typeof url === "string" && ["https:", "http:"].includes(new URL(url).protocol); }
      catch { return false; }
    }));
}

export function geminiSourceSuggestions(response: GenerateContentResponse) {
  const sources = geminiGroundedSources(response);
  const seen = new Set<string>();
  return (response.candidates?.[0]?.groundingMetadata?.groundingChunks || []).flatMap(chunk => {
    const url = chunk.web?.uri;
    if (!url || !sources.has(url) || seen.has(url)) return [];
    seen.add(url);
    return [{ title: chunk.web?.title?.slice(0, 300) || new URL(url).hostname, url, matchedExcerpt: "" }];
  }).slice(0, 3);
}
