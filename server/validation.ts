const string = (value: unknown) => typeof value === "string";
const score = (value: unknown) =>
  typeof value === "number" &&
  Number.isFinite(value) &&
  value >= 0 &&
  value <= 100;
const bounded = (value: unknown, max: number, min = 0): value is string => typeof value === "string" && value.length >= min && value.length <= max;
const strings = (value: unknown, count: number, max: number) => Array.isArray(value) && value.length <= count && value.every((item) => bounded(item, max));
const nonnegative = (value: unknown, max = 15000) => typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= max;
export function validAI(value: any): boolean {
  return Boolean(
    value &&
      score(value.overallAiScore) &&
      string(value.verdict) &&
      string(value.overallSummary) &&
      Array.isArray(value.sentenceAnalysis) &&
      value.sentenceAnalysis.length <= 1000 &&
      value.sentenceAnalysis.every(
        (s: any) =>
          s &&
          string(s.sentence) &&
          score(s.aiProbability) &&
          Array.isArray(s.reasons) &&
          s.reasons.every(string),
      ),
  );
}
export function validPlagiarism(value: any): boolean {
  return Boolean(
    value &&
      score(value.similarityScore) &&
      string(value.verdict) &&
      string(value.summary) &&
      Array.isArray(value.matchedSources) &&
      value.matchedSources.length <= 100 &&
      value.matchedSources.every(
        (s: any) =>
          s &&
          string(s.title) &&
          string(s.url) &&
          (s.matchedExcerpt === undefined || string(s.matchedExcerpt)),
      ),
  );
}
export const rewriteStyles = ["natural", "professional", "academic", "concise"] as const;
export function validRewrite(value: any): boolean {
  return Boolean(
    value &&
      string(value.rewrittenText) &&
      value.rewrittenText.trim().length > 0 &&
      value.rewrittenText.length <= 15000 &&
      string(value.engine) && value.engine.length <= 100 &&
      rewriteStyles.includes(value.style) &&
      (value.warnings === undefined || strings(value.warnings, 12, 700)) &&
      (value.changes === undefined ||
        (Array.isArray(value.changes) && value.changes.length <= 12 &&
          value.changes.every((change: unknown) => string(change) && (change as string).length <= 500))),
  );
}
export function validProofread(value: any): boolean {
  const insights = value?.insights;
  return Boolean(value && bounded(value.correctedText, 15000, 1) && bounded(value.summary, 3000) && bounded(value.engine, 100, 1) &&
    Array.isArray(value.issues) && value.issues.length <= 40 && value.issues.every((issue: any) => issue && bounded(issue.original, 1500, 1) && bounded(issue.suggestion, 2000) && ["grammar", "clarity", "style", "punctuation"].includes(issue.category) && bounded(issue.explanation, 700)) &&
    insights && ["words", "sentences", "paragraphs", "readingMinutes", "averageSentenceWords", "longSentences"].every((key) => nonnegative(insights[key])) &&
    (insights.readingEase === null || score(insights.readingEase)) && bounded(insights.readingLabel, 200));
}
export function validSummary(value: any): boolean {
  return Boolean(value && bounded(value.summary, 4000, 1) && strings(value.keyPoints, 12, 700) && strings(value.outline, 12, 700) && bounded(value.engine, 100, 1) && (value.scope === undefined || bounded(value.scope, 2000)));
}
export function validComparison(value: any): boolean {
  return Boolean(value && score(value.similarityScore) && nonnegative(value.matchedWords) && nonnegative(value.totalWords) && value.matchedWords <= value.totalWords && bounded(value.engine, 100, 1) && bounded(value.scope, 1000) &&
    Array.isArray(value.matches) && value.matches.length <= 50 && value.matches.every((match: any) => match && bounded(match.text, 15000, 1) && bounded(match.sourceText, 15000, 1) && ["start", "end", "sourceStart", "sourceEnd"].every((key) => Number.isInteger(match[key]) && nonnegative(match[key])) && match.end > match.start && match.sourceEnd > match.sourceStart));
}
export function validCitations(value: any): boolean {
  return Boolean(value && ["apa", "mla", "chicago", "bibtex"].every((key) => bounded(value[key], 15000, 1)) && strings(value.notes, 12, 700) && bounded(value.engine, 100, 1));
}
export function validReport(value: any): boolean {
  return Boolean(
    value &&
      string(value.scannedAt) &&
      string(value.originalText) &&
      ["ai", "plagiarism", "rewrite", "proofread", "summarize", "compare", "citations"].some((key) => value[key] !== undefined) &&
      (value.ai === undefined || validAI(value.ai)) &&
      (value.plagiarism === undefined || validPlagiarism(value.plagiarism)) &&
      (value.rewrite === undefined || validRewrite(value.rewrite)) &&
      (value.proofread === undefined || validProofread(value.proofread)) &&
      (value.summarize === undefined || validSummary(value.summarize)) &&
      (value.compare === undefined || (validComparison(value.compare) && value.compare.matches.every((match: any) => match.text === value.originalText.slice(match.start, match.end)))) &&
      (value.citations === undefined || validCitations(value.citations)),
  );
}
