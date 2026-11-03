const string = (value: unknown) => typeof value === "string";
const score = (value: unknown) =>
  typeof value === "number" &&
  Number.isFinite(value) &&
  value >= 0 &&
  value <= 100;
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
export function validReport(value: any): boolean {
  return Boolean(
    value &&
      string(value.scannedAt) &&
      string(value.originalText) &&
      (value.ai !== undefined || value.plagiarism !== undefined) &&
      (value.ai === undefined || validAI(value.ai)) &&
      (value.plagiarism === undefined || validPlagiarism(value.plagiarism)),
  );
}
