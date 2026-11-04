import { test } from "node:test";
import assert from "node:assert/strict";
import { compareDocuments, writingInsights, basicProofread, formatCitations } from "../server/writing-tools.js";

test("comparison reports directional unique word coverage with verifiable original offsets", () => {
  const text = "🌱 Start: Alpha beta, gamma delta epsilon. Extra words remain.", source = "A preface. ALPHA BETA GAMMA DELTA EPSILON!";
  const result = compareDocuments(text, source);
  assert.equal(result.totalWords, 9);
  assert.equal(result.matchedWords, 5);
  assert.equal(result.similarityScore, 56);
  assert.equal(result.matches.length, 1);
  const match = result.matches[0];
  assert.equal(match.text, "Alpha beta, gamma delta epsilon");
  assert.equal(match.text, text.slice(match.start, match.end));
  assert.equal(match.sourceText, source.slice(match.sourceStart, match.sourceEnd));
  assert.equal(compareDocuments(source, text).similarityScore, 71);
});

test("unrelated texts and phrases under five words produce no claimed matches", () => {
  const result = compareDocuments("The river winds through a peaceful valley.", "Astronauts study distant stars using powerful telescopes.");
  assert.equal(result.similarityScore, 0);
  assert.deepEqual(result.matches, []);
  assert.equal(compareDocuments("one two three four", "one two three four").similarityScore, 0);
  assert.equal(compareDocuments("", "").totalWords, 0);
});

test("repeated source anchors do not inflate coverage and displayed passages stay bounded", () => {
  const phrase = "one two three four five";
  const text = Array.from({ length: 80 }, () => phrase).join(". ");
  const result = compareDocuments(text, phrase);
  assert.equal(result.similarityScore, 100);
  assert.equal(result.matchedWords, result.totalWords);
  assert.equal(result.matches.length, 50);
  assert.ok(result.matches.every((match, index) => !index || match.start >= result.matches[index - 1].end));
});

test("Unicode normalization and Burmese segmentation retain original UTF-16 offsets", () => {
  const fullwidth = compareDocuments("ＡＬＰＨＡ beta gamma delta epsilon", "alpha beta gamma delta epsilon");
  assert.equal(fullwidth.similarityScore, 100);
  const text = "😀 မြန်မာစာကို သေချာ ဖတ်ရှု ပြီး မိမိ စိတ်ကူးများကို ရှင်းလင်းစွာ ရေးသားပါ။";
  const result = compareDocuments(text, text);
  assert.equal(result.similarityScore, 100);
  assert.equal(result.matches[0].text, text.slice(result.matches[0].start, result.matches[0].end));
});

test("quote exclusions remove matched quotes without joining words across their boundary", () => {
  const quoted = "Unique start. “one two three four five” Different end.";
  assert.ok(compareDocuments(quoted, "one two three four five").matchedWords > 0);
  assert.equal(compareDocuments(quoted, "one two three four five", { excludeQuotes: true }).matchedWords, 0);
  const interrupted = 'alpha beta "unrelated inserted quote" gamma delta epsilon';
  assert.equal(compareDocuments(interrupted, "alpha beta gamma delta epsilon", { excludeQuotes: true }).matchedWords, 0);
  assert.equal(compareDocuments("> one two three four five\nUnique text", "one two three four five", { excludeQuotes: true }).matchedWords, 0);
});

test("reference exclusions stop at the next clear heading and preserve later match positions", () => {
  const text = "Unique opening words here.\n\nReferences\none two three four five\n# Appendix\nsix seven eight nine ten";
  const result = compareDocuments(text, "one two three four five. six seven eight nine ten", { excludeReferences: true });
  assert.equal(result.matchedWords, 5);
  assert.equal(result.matches[0].text, "six seven eight nine ten");
  assert.equal(text.slice(result.matches[0].start, result.matches[0].end), result.matches[0].text);
  const allExcluded = compareDocuments("References\none two three four five", "one two three four five", { excludeReferences: true });
  assert.equal(allExcluded.totalWords, 0);
  assert.equal(allExcluded.similarityScore, 0);
});

test("insights expose approximate English readability without grading Burmese prose", () => {
  const english = writingInsights("The cat is on the mat. We can see it in the sun.\n\nThis is a clear sentence.");
  assert.equal(english.sentences, 3);
  assert.equal(english.paragraphs, 2);
  assert.equal(english.readingMinutes, 1);
  assert.equal(typeof english.readingEase, "number");
  assert.ok(english.readingEase! >= 0 && english.readingEase! <= 100);
  const burmese = writingInsights("ဒီစာကို ရှင်းလင်းစွာ ဖတ်ရှု နားလည်နိုင်ရန် မြန်မာလို ရေးသားထားပါသည်။");
  assert.equal(burmese.readingEase, null);
  assert.match(burmese.readingLabel, /not calibrated/);
  const empty = writingInsights("");
  assert.equal(empty.words, 0);
  assert.equal(empty.sentences, 0);
  assert.equal(empty.readingMinutes, 0);
  assert.equal(empty.readingEase, null);
});

test("basic proofreading provides reversible suggestions and preserves quotations, URLs, and code", () => {
  const text = 'The the draft  needs work ,and in order to improve it,read carefully. "the the quoted source" https://example.com/a,b `the the code`';
  const result = basicProofread(text);
  assert.match(result.correctedText, /^The draft needs work, and to improve it, read carefully\./);
  assert.ok(result.correctedText.includes('"the the quoted source"'));
  assert.ok(result.correctedText.includes("https://example.com/a,b"));
  assert.ok(result.correctedText.includes("`the the code`"));
  assert.ok(result.issues.length > 3);
  assert.ok(result.issues.every((issue) => text.includes(issue.original) && issue.explanation));
  assert.match(result.engine, /no AI/);
  assert.match(result.summary, /limited/);
  assert.equal(basicProofread("I had had enough and knew that that was true.").issues.length, 0);
});

test("citation formatter uses supplied metadata and escapes BibTeX field injection", () => {
  const result = formatCitations({ title: "A {title} \\ demo\n@article{bad,", author: "Doe, Jane", year: "2024", url: "https://example.com/a_b?x=1&y=2", accessed: "2026-11-04" });
  assert.ok(result.apa.includes("Doe, Jane. (2024)."));
  assert.ok(result.mla.includes("Accessed 4 Nov 2026."));
  assert.ok(result.chicago.includes("November 4, 2026"));
  assert.ok(result.bibtex.includes("\\{title\\}"));
  assert.ok(result.bibtex.includes("\\textbackslash{}"));
  assert.ok(result.bibtex.includes("@article\\{bad,"));
  assert.ok(!result.bibtex.includes("\n@article{"));
  assert.ok(result.bibtex.includes("a\\_b?x=1\\&y=2"));
});

test("basic proofreading caps issues at 40 and skips edits that would exceed the document limit", () => {
  const manyIssues = basicProofread("the the draft. ".repeat(100));
  assert.equal(manyIssues.issues.length, 40);
  assert.ok(manyIssues.correctedText.includes("the the draft"));
  const atLimit = "word,word ".repeat(1000) + "x".repeat(5000);
  assert.equal(atLimit.length, 15000);
  const full = basicProofread(atLimit);
  assert.equal(full.correctedText, atLimit);
  assert.equal(full.issues.length, 0);
  const nearLimit = basicProofread(atLimit.slice(0, -1));
  assert.equal(nearLimit.issues.length, 1);
  assert.equal(nearLimit.correctedText.length, 15000);
  assert.ok(nearLimit.correctedText.startsWith("word, word "));
  assert.ok(nearLimit.correctedText.endsWith("x".repeat(4999)));
});

test("missing or invalid citation metadata is disclosed without invented facts or unsafe URLs", () => {
  const result = formatCitations({ title: "A source", year: "yesterday", url: "javascript:alert(1)", accessed: "2026-02-31" });
  assert.match(result.apa, /n\.d\./);
  assert.ok(!result.apa.includes("javascript:"));
  assert.ok(!result.bibtex.includes("year ="));
  assert.ok(!result.bibtex.includes("note ="));
  assert.ok(result.notes.some((note) => /Author missing/.test(note)));
  assert.ok(result.notes.some((note) => /year missing or invalid/.test(note)));
  assert.ok(result.notes.some((note) => /URL/.test(note)));
  assert.ok(result.notes.some((note) => /access date/.test(note)));
  assert.match(formatCitations({}).apa, /Untitled webpage/);
});
