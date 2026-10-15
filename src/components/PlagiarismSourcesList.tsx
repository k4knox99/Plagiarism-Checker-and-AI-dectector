import React, { useState } from 'react';
import { ExternalLink, Quote, Check, Copy, BookOpen, AlertTriangle, ShieldCheck, ChevronDown, ChevronUp } from 'lucide-react';
import { MatchedSource, FlaggedPassage, CitationFormat } from '../types';

interface PlagiarismSourcesListProps {
  similarityScore: number;
  verdict: string;
  summary: string;
  matchedSources: MatchedSource[];
  flaggedPassages: FlaggedPassage[];
  liveWebSources?: Array<{ title: string; url: string }>;
}

export const PlagiarismSourcesList: React.FC<PlagiarismSourcesListProps> = ({
  similarityScore,
  verdict,
  summary,
  matchedSources,
  flaggedPassages,
  liveWebSources = []
}) => {
  const [selectedCitation, setSelectedCitation] = useState<{
    source: MatchedSource;
    citations: CitationFormat;
  } | null>(null);
  const [loadingCitation, setLoadingCitation] = useState(false);
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);
  const [expandedSource, setExpandedSource] = useState<number | null>(0);

  const handleOpenCitation = async (source: MatchedSource) => {
    if (source.citationFormatted) {
      setSelectedCitation({ source, citations: source.citationFormatted });
      return;
    }

    setLoadingCitation(true);
    try {
      const res = await fetch('/api/fix/cite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceUrl: source.url,
          sourceTitle: source.title,
          author: source.domain || 'Online Source'
        })
      });
      const data = await res.json();
      if (data.success && data.citations) {
        setSelectedCitation({ source, citations: data.citations });
      }
    } catch (err) {
      console.warn('Citation generation failed:', err);
      // Fallback simple APA citation
      setSelectedCitation({
        source,
        citations: {
          apa: `${source.title || 'Source document'}. Retrieved from ${source.url}`,
          mla: `"${source.title || 'Source document'}." Web. <${source.url}>.`,
          chicago: `"${source.title || 'Source document'}." ${source.url}.`
        }
      });
    } finally {
      setLoadingCitation(false);
    }
  };

  const copyToClipboard = (text: string, format: string) => {
    navigator.clipboard.writeText(text);
    setCopiedFormat(format);
    setTimeout(() => setCopiedFormat(null), 2000);
  };

  const isOriginal = similarityScore === 0 && matchedSources.length === 0;

  return (
    <div className="space-y-4">
      {/* Overview Status Banner */}
      <div className={`p-4 rounded-2xl border transition-all ${
        isOriginal
          ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
          : similarityScore > 40
          ? 'bg-rose-950/30 border-rose-500/40 text-rose-200'
          : 'bg-amber-950/30 border-amber-500/40 text-amber-200'
      }`}>
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-black/40 border border-current/20 shrink-0">
            {isOriginal ? (
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-base text-white">{verdict}</h4>
              <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-black/50 border border-current/30 font-bold">
                {similarityScore}% Similarity
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">{summary}</p>
          </div>
        </div>
      </div>

      {/* Matched Web Sources Cards */}
      {matchedSources.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
              <span>Matched Online Sources & Literature ({matchedSources.length})</span>
            </h4>
            <span className="text-[11px] text-slate-500">Live search grounded</span>
          </div>

          <div className="space-y-2.5">
            {matchedSources.map((source, idx) => {
              const isExpanded = expandedSource === idx;
              return (
                <div
                  key={idx}
                  className="rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition overflow-hidden"
                >
                  <div
                    onClick={() => setExpandedSource(isExpanded ? null : idx)}
                    className="p-3.5 flex items-center justify-between cursor-pointer gap-3 bg-slate-950/40"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                        <span className="font-mono text-xs font-bold text-indigo-400">{idx + 1}</span>
                      </div>
                      <div className="min-w-0">
                        <h5 className="text-sm font-semibold text-white truncate hover:text-indigo-300 transition">
                          {source.title || 'Referenced Web Document'}
                        </h5>
                        <p className="text-xs text-slate-400 truncate flex items-center gap-1.5 mt-0.5">
                          <span>{source.domain || (source.url ? new URL(source.url).hostname : 'Web')}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-300 border border-purple-500/30 font-semibold">
                        {source.matchPercentage}% match
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Source Details */}
                  {isExpanded && (
                    <div className="p-4 border-t border-slate-800 space-y-3 bg-slate-900/40">
                      {/* Side by side comparison if excerpts exist */}
                      {(source.studentExcerpt || source.matchedExcerpt) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 space-y-1">
                            <span className="font-semibold text-slate-400 text-[11px] uppercase tracking-wider">
                              Your Text:
                            </span>
                            <p className="text-slate-200 italic leading-relaxed">
                              "{source.studentExcerpt || 'Excerpt from document'}"
                            </p>
                          </div>
                          <div className="p-3 rounded-lg bg-purple-950/30 border border-purple-500/30 space-y-1">
                            <span className="font-semibold text-purple-400 text-[11px] uppercase tracking-wider">
                              Matched Source Quote:
                            </span>
                            <p className="text-purple-200 italic leading-relaxed">
                              "{source.matchedExcerpt || 'Online repository match'}"
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
                        {source.url && (
                          <a
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 hover:underline"
                          >
                            <span>Open Source Webpage</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}

                        <button
                          onClick={() => handleOpenCitation(source)}
                          disabled={loadingCitation}
                          className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center gap-1.5 shadow transition ml-auto"
                        >
                          <Quote className="w-3.5 h-3.5" />
                          <span>Generate Academic Citation</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="p-8 text-center rounded-xl bg-slate-900/40 border border-slate-800">
          <ShieldCheck className="w-10 h-10 text-emerald-400 mx-auto mb-2 opacity-80" />
          <h4 className="text-sm font-semibold text-slate-200">Zero Plagiarism Detected</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            Our search-grounded index scanned web publications, Wikipedia, and indexed journals with 0% unauthorized similarity matches.
          </p>
        </div>
      )}

      {/* Flagged passages section if any */}
      {flaggedPassages.length > 0 && (
        <div className="mt-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2.5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Passages Needing Citation or Rewriting ({flaggedPassages.length})</span>
          </h4>
          <div className="space-y-2">
            {flaggedPassages.map((p, i) => (
              <div key={i} className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-300">
                    Recommendation: <span className="text-amber-300">{p.recommendation || 'Add attribution'}</span>
                  </span>
                  <span className="font-mono text-rose-400 font-bold">{p.similarity}% match</span>
                </div>
                <p className="text-slate-300 italic">"{p.passage}"</p>
                {p.matchedSourceTitle && (
                  <p className="text-[11px] text-slate-500">Source: {p.matchedSourceTitle}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Citation Generator Dialog */}
      {selectedCitation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-400" />
                <h3 className="text-base font-semibold text-white">Academic Citation Generator</h3>
              </div>
              <button
                onClick={() => setSelectedCitation(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Easily attribute this source in your bibliography to eliminate plagiarism risk:
            </p>

            <div className="space-y-3">
              {/* APA */}
              {selectedCitation.citations.apa && (
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-indigo-400">APA 7th Edition</span>
                    <button
                      onClick={() => copyToClipboard(selectedCitation.citations.apa!, 'apa')}
                      className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1"
                    >
                      {copiedFormat === 'apa' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedFormat === 'apa' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <p className="text-xs text-slate-200 font-mono leading-relaxed select-all">
                    {selectedCitation.citations.apa}
                  </p>
                </div>
              )}

              {/* MLA */}
              {selectedCitation.citations.mla && (
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-indigo-400">MLA 9th Edition</span>
                    <button
                      onClick={() => copyToClipboard(selectedCitation.citations.mla!, 'mla')}
                      className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1"
                    >
                      {copiedFormat === 'mla' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedFormat === 'mla' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <p className="text-xs text-slate-200 font-mono leading-relaxed select-all">
                    {selectedCitation.citations.mla}
                  </p>
                </div>
              )}

              {/* Chicago / Harvard */}
              {selectedCitation.citations.chicago && (
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-indigo-400">Chicago Manual of Style</span>
                    <button
                      onClick={() => copyToClipboard(selectedCitation.citations.chicago!, 'chicago')}
                      className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1"
                    >
                      {copiedFormat === 'chicago' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedFormat === 'chicago' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <p className="text-xs text-slate-200 font-mono leading-relaxed select-all">
                    {selectedCitation.citations.chicago}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedCitation(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
