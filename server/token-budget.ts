export type WritingTask = "rewrite" | "proofread" | "summary" | "signals" | "sources";
export function outputBudget(text: string, task: WritingTask): number {
  let estimated = 0;
  for (const character of text) estimated += character.charCodeAt(0) <= 127 ? 1 / 3.5 : 1.5;
  if (task === "sources") return 1600;
  if (task === "signals") return Math.max(1024, Math.min(2400, Math.ceil(estimated * 0.4 + 900)));
  if (task === "summary") return Math.max(768, Math.min(2000, Math.ceil(estimated * 0.3 + 700)));
  // Full edits need room for the complete source text, especially non-Latin scripts.
  return Math.max(768, Math.min(8192, Math.ceil(estimated * 1.1 + 650)));
}
