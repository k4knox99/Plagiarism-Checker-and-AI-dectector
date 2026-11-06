import { ArrowDownToLine, Check, Copy, Save } from "lucide-react";
import type { CitationResult, ComparisonResult, ProofreadResult, SummaryResult } from "../types";

type Props = {
  report: { originalText: string; proofread?: ProofreadResult; summarize?: SummaryResult; compare?: ComparisonResult; citations?: CitationResult };
  busy: boolean; canSave: boolean;
  copy: (text: string) => Promise<void>; apply: (text: string) => void; save: () => Promise<void>;
};
function ResultActions({ value, apply, copy, save, busy, canSave }: {
  value: string; apply?: (value: string) => void; copy: Props["copy"]; save: Props["save"]; busy: boolean; canSave: boolean;
}) {
  return <div className="rewrite-actions">
    {apply && <button className="button" disabled={busy} onClick={() => apply(value)}><Check size={16} />Use in editor</button>}
    <button className="button secondary" disabled={busy} onClick={() => copy(value)}><Copy size={16} />Copy result</button>
    <button className="button secondary" disabled={busy} onClick={() => downloadResult(value)}><ArrowDownToLine size={16} />Download TXT</button>
    <button className="button secondary" disabled={busy || !canSave} onClick={save}><Save size={16} />Save result</button>
  </div>;
}
function downloadResult(value: string) {
  const url = URL.createObjectURL(new Blob([value], { type: "text/plain;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "veritas_result.txt";
  link.click();
  URL.revokeObjectURL(url);
}
function HighlightedMatches({ text, matches }: { text: string; matches: ComparisonResult["matches"] }) {
  const ranges = matches.map(({ start, end }) => ({ start: Math.max(0, Math.min(text.length, start)), end: Math.max(0, Math.min(text.length, end)) })).filter(({ start, end }) => Number.isFinite(start) && Number.isFinite(end) && end > start).sort((a, b) => a.start - b.start);
  const parts = []; let cursor = 0;
  for (const range of ranges) {
    if (range.end <= cursor) continue;
    if (range.start > cursor) parts.push(<span key={`plain-${cursor}`}>{text.slice(cursor, range.start)}</span>);
    const start = Math.max(cursor, range.start);
    parts.push(<mark key={`match-${start}`}>{text.slice(start, range.end)}</mark>);
    cursor = range.end;
  }
  if (cursor < text.length) parts.push(<span key={`plain-${cursor}`}>{text.slice(cursor)}</span>);
  return <p className="rewrite-text compare-highlight" tabIndex={0}>{parts}</p>;
}
export default function ExtendedToolResults({ report, copy, apply, save, busy, canSave }: Props) {
  const proofread = report.proofread, summary = report.summarize, comparison = report.compare, citations = report.citations;
  const summaryText = summary ? [summary.summary, "", "Key points", ...summary.keyPoints.map((point) => `• ${point}`), "", "Outline", ...summary.outline.map((point, index) => `${index + 1}. ${point}`)].join("\n") : "";
  return <>
    {proofread && <article className="result-card extended-result">
      <div className="rewrite-result-heading"><div><span className="eyebrow">GRAMMAR & CLARITY</span><h3>Your writing review</h3></div><span className="rewrite-engine">{proofread.engine}</span></div>
      <p>{proofread.summary}</p>
      {proofread.insights && <div className="writing-insights" aria-label="Reading insights">
        <div><strong>{proofread.insights.words}</strong><span>words</span></div>
        <div><strong>{proofread.insights.sentences}</strong><span>sentences</span></div>
        <div><strong>{proofread.insights.averageSentenceWords}</strong><span>words / sentence</span></div>
        <div><strong>{proofread.insights.readingMinutes}</strong><span>min read</span></div>
        <div><strong>{proofread.insights.longSentences}</strong><span>long sentences</span></div>
        <div><strong>{proofread.insights.readingEase === null ? "—" : proofread.insights.readingEase}</strong><span>{proofread.insights.readingLabel}</span></div>
      </div>}
      <div className="rewrite-comparison"><div><h4>Original</h4><p className="rewrite-text original-text" tabIndex={0}>{report.originalText}</p></div><div><h4>Corrected draft</h4><p className="rewrite-text" tabIndex={0}>{proofread.correctedText}</p></div></div>
      <details className="suggestion-details" open><summary>{proofread.issues.length} writing suggestions</summary>
        {proofread.issues.map((issue, index) => <div className="writing-suggestion" key={index}>
          <span className="issue-category">{issue.category}</span>
          <div className="suggestion-change"><span>{issue.original}</span><span aria-label="Suggested replacement">{issue.suggestion || "Remove this text"}</span></div>
          <p>{issue.explanation}</p>
        </div>)}
      </details>
      <ResultActions value={proofread.correctedText} apply={apply} copy={copy} save={save} busy={busy} canSave={canSave} />
      <small className="result-caution">{/no AI/i.test(proofread.engine) ? "Basic mode checks a limited set of English punctuation, repetition, and wordiness patterns. " : ""}Review suggestions in context. Applying the corrected draft clears checks made against the old text.</small>
    </article>}
    {summary && <article className="result-card extended-result summary-result">
      <div className="rewrite-result-heading"><div><span className="eyebrow">SUMMARIZER</span><h3>The main idea, in focus</h3></div><span className="rewrite-engine">{summary.engine}</span></div>
      <p className="summary-copy">{summary.summary}</p>
      <div className="summary-columns"><section><h4>Key points</h4><ul>{summary.keyPoints.map((point, index) => <li key={index}>{point}</li>)}</ul></section><section><h4>Document outline</h4><ol>{summary.outline.map((point, index) => <li key={index}>{point}</li>)}</ol></section></div>
      <ResultActions value={summaryText} copy={copy} save={save} busy={busy} canSave={canSave} />
      <small className="result-caution">{summary.scope ? `${summary.scope} ` : /no AI|extractive/i.test(summary.engine) ? "Basic mode selects and retains sentences from your original draft. " : ""}Compare the summary with your document before sharing it. Important qualifications can be lost when a text is shortened.</small>
    </article>}
    {comparison && <article className="result-card extended-result">
      <div className="rewrite-result-heading"><div><span className="eyebrow">TWO-DOCUMENT COMPARISON</span><h3>Shared passages</h3></div><span className="rewrite-engine">{comparison.engine}</span></div>
      <div className="comparison-overview"><strong>{comparison.similarityScore}<small>%</small></strong><p>{comparison.matchedWords} matched words out of {comparison.totalWords} included words in your draft.</p></div>
      <p>{comparison.scope}</p>
      <div className="comparison-document"><h4>Matches in your draft</h4><HighlightedMatches text={report.originalText} matches={comparison.matches} /></div>
      {comparison.matches.length > 0 ? <details className="suggestion-details"><summary>Review {comparison.matches.length} matching passages</summary>{comparison.matches.slice(0, 100).map((match, index) => <div className="matched-passage" key={index}><h4>Passage {index + 1}</h4><div className="rewrite-comparison"><div><h4>Your draft</h4><p>{match.text}</p></div><div><h4>Comparison document</h4><p>{match.sourceText}</p></div></div></div>)}</details> : <p>No matching passages were found by this comparison method.</p>}
      <ResultActions value={[`Two-document similarity: ${comparison.similarityScore}%`, comparison.scope, ...comparison.matches.map((match) => `\nDraft: ${match.text}\nComparison: ${match.sourceText}`)].join("\n")} copy={copy} save={save} busy={busy} canSave={canSave} />
      <small className="result-caution">This compares only the two documents you supplied. Similarity can come from quotations, common language, or shared sources; it is not a plagiarism verdict.</small>
    </article>}
    {citations && <article className="result-card extended-result">
      <div className="rewrite-result-heading"><div><span className="eyebrow">CITATION BUILDER</span><h3>Source references</h3></div><span className="rewrite-engine">{citations.engine}</span></div>
      {([['APA', citations.apa], ['MLA', citations.mla], ['Chicago', citations.chicago], ['BibTeX', citations.bibtex]] as const).map(([label, value]) => <div className="citation-output" key={label}><div><h4>{label}</h4><button className="button secondary small" disabled={busy} onClick={() => copy(value)} aria-label={`Copy ${label} citation`}><Copy size={14} />Copy</button></div><p className={label === 'BibTeX' ? 'citation-code' : ''}>{value}</p></div>)}
      {!!citations.notes.length && <div className="rewrite-notes"><h4>Check these details</h4><ul>{citations.notes.map((note, index) => <li key={index}>{note}</li>)}</ul></div>}
      <ResultActions value={[`APA: ${citations.apa}`, `MLA: ${citations.mla}`, `Chicago: ${citations.chicago}`, `BibTeX:\n${citations.bibtex}`].join("\n\n")} copy={copy} save={save} busy={busy} canSave={canSave} />
    </article>}
  </>;
}
