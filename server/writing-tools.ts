type Range = { start: number; end: number };
type Word = Range & { value: string; group: number };
const wordSegmenter = new Intl.Segmenter(undefined, { granularity: "word" });
const sentenceSegmenter = new Intl.Segmenter(undefined, { granularity: "sentence" });
const phraseLength = 5;
const maxDisplayedMatches = 50;

function mergeRanges(ranges: Range[]): Range[] {
  const merged: Range[] = [];
  for (const range of ranges.sort((a, b) => a.start - b.start || a.end - b.end)) {
    const last = merged.at(-1);
    if (last && range.start <= last.end) last.end = Math.max(last.end, range.end);
    else merged.push({ ...range });
  }
  return merged;
}

function quotedRanges(text: string): Range[] {
  const ranges: Range[] = [];
  for (const pattern of [/"(?:\\.|[^"\\])*"/g, /“[^”]*”/g, /«[^»]*»/g, /^[ \t]*>[^\n]*/gm])
    for (const match of text.matchAll(pattern))
      ranges.push({ start: match.index!, end: match.index! + match[0].length });
  return ranges;
}

function referenceRanges(text: string): Range[] {
  const lines = [...text.matchAll(/^.*(?:\n|$)/gm)].filter((line) => line[0]);
  const ranges: Range[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!/^\s*(?:#{1,6}\s*)?(?:references|bibliography|works cited)\s*:?\s*$/i.test(line[0])) continue;
    let end = text.length;
    for (let j = i + 1; j < lines.length; j++) {
      if (/^\s*#{1,6}\s+\S|^\s*(?:appendix(?:\s+[A-Z\d]+)?|appendices|acknowledg(?:e)?ments)\s*:?\s*$/i.test(lines[j][0])) {
        end = lines[j].index!;
        break;
      }
    }
    ranges.push({ start: line.index!, end });
  }
  return ranges;
}

function words(text: string, ranges: Range[] = []): Word[] {
  const result: Word[] = [];
  let group = 0;
  for (const segment of wordSegmenter.segment(text)) {
    if (!segment.isWordLike) continue;
    const start = segment.index, end = start + segment.segment.length;
    while (ranges[group] && ranges[group].end <= start) group++;
    if (ranges[group] && ranges[group].start < end) continue;
    result.push({ start, end, group, value: segment.segment.normalize("NFKC").toLowerCase() });
  }
  return result;
}

export function compareDocuments(
  text: string,
  comparisonText: string,
  options: { excludeQuotes?: boolean; excludeReferences?: boolean } = {},
) {
  const exclusions = (value: string) => mergeRanges([
    ...(options.excludeQuotes ? quotedRanges(value) : []),
    ...(options.excludeReferences ? referenceRanges(value) : []),
  ]);
  const target = words(text, exclusions(text)), source = words(comparisonText, exclusions(comparisonText));
  const keyAt = (tokens: Word[], index: number) => {
    if (index + phraseLength > tokens.length || tokens[index].group !== tokens[index + phraseLength - 1].group) return null;
    return tokens.slice(index, index + phraseLength).map((token) => token.value).join("\u0001");
  };
  const sourceIndex = new Map<string, number[]>();
  for (let i = 0; i + phraseLength <= source.length; i++) {
    const key = keyAt(source, i);
    if (key === null) continue;
    const candidates = sourceIndex.get(key);
    // A repeated phrase has many equivalent anchors. Bound work on repetitive input.
    if (!candidates) sourceIndex.set(key, [i]);
    else if (candidates.length < 64) candidates.push(i);
  }
  const matches: { text: string; sourceText: string; start: number; end: number; sourceStart: number; sourceEnd: number }[] = [];
  let matchedWords = 0;
  for (let i = 0; i + phraseLength <= target.length;) {
    const key = keyAt(target, i), candidates = key === null ? [] : sourceIndex.get(key) || [];
    let bestLength = 0, bestSource = 0;
    for (const sourceStart of candidates) {
      let length = phraseLength;
      while (i + length < target.length && sourceStart + length < source.length &&
        target[i + length].group === target[i].group && source[sourceStart + length].group === source[sourceStart].group &&
        target[i + length].value === source[sourceStart + length].value) length++;
      if (length > bestLength) { bestLength = length; bestSource = sourceStart; }
    }
    if (!bestLength) { i++; continue; }
    matchedWords += bestLength;
    if (matches.length < maxDisplayedMatches) {
      const start = target[i].start, end = target[i + bestLength - 1].end;
      const sourceStart = source[bestSource].start, sourceEnd = source[bestSource + bestLength - 1].end;
      matches.push({ text: text.slice(start, end), sourceText: comparisonText.slice(sourceStart, sourceEnd), start, end, sourceStart, sourceEnd });
    }
    // Every target word contributes at most once, even when a source phrase repeats.
    i += bestLength;
  }
  return {
    similarityScore: target.length ? Math.round(100 * matchedWords / target.length) : 0,
    matchedWords,
    totalWords: target.length,
    matches,
    engine: "Deterministic five-word phrase comparison",
    scope: `Compares only the two supplied documents on this server; no third-party AI or web search. Measures directional coverage of the first document by case-insensitive phrases of at least five segmented words. Shows up to ${maxDisplayedMatches} passages; the score includes all matched words.${options.excludeQuotes ? " Paired double quotes and blockquote lines are excluded." : ""}${options.excludeReferences ? " Labeled References, Bibliography, or Works Cited sections are excluded until the next clear heading or document end." : ""} Similarity alone does not establish plagiarism.`,
  };
}

const englishMarkers = new Set("the a an and is are was were to of in for on with this that these it we you as be have has can will from by our your not they their but or if".split(" "));
function likelyEnglish(text: string, tokens: Word[]) {
  const letters = text.match(/\p{L}/gu) || [], latin = text.match(/[A-Za-z]/g) || [];
  const markers = tokens.filter((token) => englishMarkers.has(token.value));
  return tokens.length >= 5 && letters.length > 0 && latin.length / letters.length >= 0.9 &&
    markers.length / tokens.length >= 0.15 && new Set(markers.map((token) => token.value)).size >= 2;
}
function syllables(value: string) {
  let word = value.toLowerCase().replace(/[^a-z]/g, "");
  if (word.length <= 3) return 1;
  if (!/le$/.test(word)) word = word.replace(/e$/, "");
  return Math.max(1, (word.match(/[aeiouy]+/g) || []).length);
}

export function writingInsights(text: string) {
  const tokens = words(text);
  const sentenceLengths = [...sentenceSegmenter.segment(text)]
    .map((sentence) => words(sentence.segment).length).filter(Boolean);
  const sentences = sentenceLengths.length;
  const english = likelyEnglish(text, tokens);
  const readingEase = english && sentences
    ? Math.round(Math.max(0, Math.min(100, 206.835 - 1.015 * tokens.length / sentences -
      84.6 * tokens.reduce((total, token) => total + syllables(token.value), 0) / tokens.length)) * 10) / 10
    : null;
  return {
    words: tokens.length,
    sentences,
    paragraphs: text.trim() ? text.trim().split(/\n[ \t]*\n/).filter((value) => value.trim()).length : 0,
    readingMinutes: tokens.length ? Math.ceil(tokens.length / 200) : 0,
    averageSentenceWords: sentences ? Math.round(tokens.length / sentences * 10) / 10 : 0,
    longSentences: sentenceLengths.filter((length) => length > 25).length,
    readingEase,
    readingLabel: readingEase === null
      ? "Unicode word counts; reading time assumes 200 words/minute. English reading ease is not calibrated for this text."
      : "Approximate English Flesch reading ease (0–100; higher is easier), using estimated syllables. Reading time assumes 200 words/minute.",
  };
}

export function basicProofread(text: string) {
  type Edit = Range & { suggestion: string; category: "grammar" | "clarity" | "style" | "punctuation"; explanation: string; priority: number };
  const edits: Edit[] = [];
  const protectedRanges = mergeRanges([
    ...quotedRanges(text),
    ...[...text.matchAll(/https?:\/\/[^\s<>]+|```[\s\S]*?(?:```|$)|`[^`\n]+`/g)]
      .map((match) => ({ start: match.index!, end: match.index! + match[0].length })),
  ]);
  const add = (pattern: RegExp, replacement: (match: RegExpMatchArray) => string, category: Edit["category"], explanation: string, priority = 1) => {
    for (const match of text.matchAll(pattern)) {
      const start = match.index!, end = start + match[0].length;
      if (!protectedRanges.some((range) => range.start < end && range.end > start))
        edits.push({ start, end, suggestion: replacement(match), category, explanation, priority });
    }
  };
  add(/\b(the|and|or|but|for|from|with|to|of|at|by|as|an|a)[ \t]+\1\b/gi,
    (match) => match[1], "grammar", "Remove a likely accidental repeated function word.", 0);
  add(/([^\s])[ \t]{2,}(?=[^\s])/g, (match) => match[1] + " ", "punctuation", "Use one space between words; indentation and line breaks are preserved.");
  add(/\S[ \t]+[,;!?]/g, (match) => match[0].replace(/[ \t]+/, "") +
    (/[A-Za-z]/.test(text[(match.index || 0) + match[0].length] || "") ? " " : ""),
    "punctuation", "In English prose, punctuation follows the preceding word directly and is separated from the next word.");
  add(/,(?=[A-Za-z])/g, () => ", ", "punctuation", "Add a space after this comma in prose.");
  for (const [phrase, replacement] of [
    ["in order to", "to"], ["due to the fact that", "because"], ["at this point in time", "now"],
  ]) add(new RegExp(`\\b${phrase}\\b`, "gi"), (match) => /^[A-Z]/.test(match[0]) ? replacement[0].toUpperCase() + replacement.slice(1) : replacement,
    "clarity", "A shorter phrase can express the same point; check that it fits your intended meaning.");
  const accepted: Edit[] = [];
  let correctedLength = text.length;
  for (const edit of edits.sort((a, b) => a.start - b.start || a.priority - b.priority || b.end - a.end)) {
    if (accepted.length >= 40) break;
    if (accepted.length && edit.start < accepted.at(-1)!.end) continue;
    const nextLength = correctedLength + edit.suggestion.length - (edit.end - edit.start);
    // Preserve the complete original: skip a growing edit instead of truncating output.
    if (nextLength > 15000) continue;
    accepted.push(edit);
    correctedLength = nextLength;
  }
  let correctedText = "", cursor = 0;
  for (const edit of accepted) {
    correctedText += text.slice(cursor, edit.start) + edit.suggestion;
    cursor = edit.end;
  }
  correctedText += text.slice(cursor);
  return {
    correctedText,
    summary: accepted.length
      ? `Basic rules found ${accepted.length} suggested changes. Review each change; this is a limited punctuation, repetition, and wordiness check.`
      : "No issues matched the basic rules. This limited check does not establish that the text is grammatically correct.",
    issues: accepted.map((edit) => ({ original: text.slice(edit.start, edit.end), suggestion: edit.suggestion, category: edit.category, explanation: edit.explanation })),
    engine: "Basic punctuation, repetition, and wordiness rules (no AI)",
    insights: writingInsights(text),
  };
}

export function localRewrite(
  text: string,
  style: "natural" | "professional" | "academic" | "concise" = "natural",
) {
  const result = basicProofread(text);
  const changes = result.issues.length
    ? [...new Set(result.issues.map((issue) => issue.explanation))].slice(0, 6)
    : ["No basic-rule changes were found; your original text was preserved."];
  return {
    rewrittenText: result.correctedText,
    style,
    engine: "Basic English clarity edit (no AI)",
    changes,
    warnings: [
      `The selected ${style} style is limited to basic punctuation, repeated-word, and wordiness edits here. Review the changes before using them.`,
      "Advanced rewriting, custom voice, audience adaptation, and expansion require an available AI service. These rules do not establish authorship or guarantee a detector score.",
    ],
  };
}

function sourceExcerpt(value: string, limit = 700) {
  const original = value.trim();
  if (original.length <= limit) return { value: original, shortened: false };
  let boundary = 0;
  for (const segment of wordSegmenter.segment(original)) {
    const end = segment.index + segment.segment.length;
    if (end > limit) break;
    boundary = end;
  }
  // An unusually long unbroken token may offer no word boundary within the limit.
  if (!boundary) {
    boundary = limit;
    const previous = original.charCodeAt(boundary - 1), next = original.charCodeAt(boundary);
    if (previous >= 0xd800 && previous <= 0xdbff && next >= 0xdc00 && next <= 0xdfff) boundary--;
  }
  return { value: original.slice(0, boundary).trimEnd(), shortened: true };
}

export function extractiveSummary(text: string) {
  const seen = new Set<string>();
  const sentences = [...sentenceSegmenter.segment(text)]
    .map((segment) => segment.segment.trim())
    .filter((sentence) => {
      const key = sentence.normalize("NFKC").toLowerCase().replace(/\s+/g, " ");
      if (!words(sentence).length || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  const candidates = sentences.map((sentence, index) => {
    const tokens = words(sentence).map((token) => token.value);
    const content = [...new Set(tokens.filter((token) => token.length > 1 &&
      !englishMarkers.has(token) && /\p{L}/u.test(token)))];
    return { sentence, index, tokens, content };
  });
  const frequency = new Map<string, number>();
  for (const candidate of candidates)
    for (const token of candidate.content) frequency.set(token, (frequency.get(token) || 0) + 1);
  const selected: typeof candidates = [], selectedIndexes = new Set<number>(), covered = new Set<string>();
  const count = Math.min(8, Math.ceil(Math.sqrt(candidates.length)));
  for (let i = 0; i < count; i++) {
    let best: typeof candidates[number] | undefined, bestScore = -1;
    for (const candidate of candidates) {
      if (selectedIndexes.has(candidate.index)) continue;
      const weight = candidate.content.reduce((total, token) => total + Math.log1p(frequency.get(token) || 0), 0);
      const novelty = candidate.content.filter((token) => !covered.has(token)).length / Math.max(1, candidate.content.length);
      const score = ((weight / Math.sqrt(Math.max(1, candidate.tokens.length))) + 0.35 / (candidate.index + 1)) *
        (0.35 + 0.65 * novelty) * (candidate.tokens.length < 4 ? 0.5 : 1);
      if (score > bestScore) { best = candidate; bestScore = score; }
    }
    if (!best) break;
    selected.push(best);
    selectedIndexes.add(best.index);
    best.content.forEach((token) => covered.add(token));
  }
  let shortened = false;
  const excerpt = (sentence: string) => {
    const result = sourceExcerpt(sentence);
    shortened ||= result.shortened;
    return result.value;
  };
  const ordered = selected.sort((a, b) => a.index - b.index);
  const keyPoints = ordered.map((candidate) => excerpt(candidate.sentence));
  const summary = keyPoints.slice(0, 5).join("\n\n");
  const outline = text.trim().split(/\n[ \t]*\n/)
    .map((paragraph) => [...sentenceSegmenter.segment(paragraph)]
      .map((segment) => segment.segment.trim()).find((sentence) => words(sentence).length))
    .filter((sentence): sentence is string => Boolean(sentence))
    .slice(0, 10).map(excerpt);
  return {
    summary,
    keyPoints,
    outline,
    engine: "Extractive summary (no AI)",
    scope: shortened
      ? "Selected passages are copied from your document. Long passages are shortened to source excerpts at a word boundary where possible. This is an extractive preview, without new facts or AI interpretation."
      : "Selected sentences are copied verbatim from your document and kept in source order. This is an extractive summary, without new facts or AI interpretation.",
  };
}

export type CitationInput = { title?: string; author?: string; year?: string | number; url?: string; accessed?: string };
const oneLine = (value: unknown) => typeof value === "string" ? value.replace(/[\r\n\t]+/g, " ").replace(/\s+/g, " ").trim() : "";
function bibtexEscape(value: string) {
  const escapes: Record<string, string> = { "\\": "\\textbackslash{}", "{": "\\{", "}": "\\}", "%": "\\%", "&": "\\&", "#": "\\#", "_": "\\_", "$": "\\$", "^": "\\textasciicircum{}", "~": "\\textasciitilde{}" };
  return value.replace(/[\\{}%&#_$^~]/g, (character) => escapes[character]);
}
export function formatCitations(input: CitationInput) {
  const title = oneLine(input.title), author = oneLine(input.author), rawYear = String(input.year ?? "");
  const year = /^\d{4}$/.test(rawYear) ? rawYear : "";
  const notes: string[] = ["Draft references for a webpage using only the metadata you supplied. Review author name order and your institution's style requirements."];
  let url = "";
  try {
    const parsed = new URL(oneLine(input.url));
    if (["https:", "http:"].includes(parsed.protocol) && !parsed.username && !parsed.password) url = parsed.href;
  } catch { /* Missing or invalid metadata is reported below. */ }
  let accessed: Date | null = null;
  const rawAccessed = oneLine(input.accessed);
  if (/^\d{4}-\d{2}-\d{2}$/.test(rawAccessed)) {
    const date = new Date(rawAccessed + "T00:00:00Z");
    if (!Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === rawAccessed) accessed = date;
  }
  if (!title) notes.push("Title missing: an Untitled webpage placeholder is used.");
  if (!author) notes.push("Author missing: no author was invented.");
  if (!year) notes.push("Publication year missing or invalid: APA uses n.d.; other outputs omit it.");
  if (!url) notes.push("A valid HTTP(S) source URL was not supplied; the URL is omitted.");
  if (!accessed) notes.push("A valid access date was not supplied; the access date is omitted.");
  const displayTitle = title || "Untitled webpage";
  const period = (value: string) => /[.!?]$/.test(value) ? value : value + ".";
  const apa = author
    ? `${period(author)} (${year || "n.d."}). ${period(displayTitle)}${url ? " " + url : ""}`
    : `${period(displayTitle)} (${year || "n.d."}).${url ? " " + url : ""}`;
  const mlaDate = accessed ? new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(accessed) : "";
  const chicagoDate = accessed ? new Intl.DateTimeFormat("en-US", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(accessed) : "";
  const mla = `${author ? period(author) + " " : ""}"${period(displayTitle)}"${year ? " " + year + "," : ""}${url ? " " + period(url) : ""}${mlaDate ? " Accessed " + mlaDate + "." : ""}`;
  const chicago = `${author ? period(author) + " " : ""}"${period(displayTitle)}"${year ? " Published " + year + "." : ""}${chicagoDate ? " Accessed " + chicagoDate + "." : ""}${url ? " " + period(url) : ""}`;
  const fields = [["title", displayTitle], ...(author ? [["author", author]] : []), ...(year ? [["year", year]] : []), ...(url ? [["url", url]] : []), ...(accessed ? [["note", "Accessed " + rawAccessed]] : [])];
  const bibtex = "@misc{web_source,\n" + fields.map(([key, value]) => `  ${key} = {${bibtexEscape(value)}}`).join(",\n") + "\n}";
  return { apa, mla, chicago, bibtex, notes, engine: "Manual webpage citation formatter (no AI or metadata lookup)" };
}
