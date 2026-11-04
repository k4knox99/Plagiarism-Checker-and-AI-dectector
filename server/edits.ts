// Surface mechanical changes that need human review; this is not semantic fact checking.
export function preservationWarnings(original: string, revised: string, preserveTerms = ""): string[] {
  const missing = (values: string[]) => [...new Set(values)].filter((value) => !revised.includes(value));
  const warnings: string[] = [];
  const numberPattern = /\p{N}+(?:[.,:/%-]\p{N}+)*/gu;
  const revisedNumbers = new Set(revised.match(numberPattern) || []);
  const numbers = [...new Set(original.match(numberPattern) || [])].filter((value) => !revisedNumbers.has(value));
  if (numbers.length) warnings.push(`Review changed or missing numbers: ${numbers.slice(0, 8).join(", ")}.`);
  const citations = missing(original.match(/\[\d+(?:[\s,–-]+\d+)*\]|\([^()\n]{1,100},\s*\d{4}[a-z]?\)/g) || []);
  if (citations.length) warnings.push("Some citation markers changed or disappeared. Check them against the original.");
  const quotations = missing(original.match(/“[^”\n]{3,1000}”|"[^"\n]{3,1000}"/g) || []);
  if (quotations.length) warnings.push("Some quoted wording changed. Check direct quotations before using this edit.");
  const terms = missing(preserveTerms.split(/[,\n]/).map((term) => term.trim()).filter(Boolean));
  if (terms.length) warnings.push(`Review protected terms: ${terms.slice(0, 8).join(", ")}.`);
  return warnings;
}
