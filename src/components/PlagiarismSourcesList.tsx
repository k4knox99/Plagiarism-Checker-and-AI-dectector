import React, { useState } from 'react';
import { ExternalLink, Quote, Check, Copy, AlertTriangle, ShieldCheck, ChevronDown, ChevronUp } from 'lucide-react';
import { MatchedSource, FlaggedPassage, CitationFormat } from '../types';
import { PixelSearch, PixelDoc, PixelShield, PixelCrown } from './PixelStickers';

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
  flaggedPassages
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
      <div className={`p-5 rounded-3xl border-2 border-black shadow-[4px_4px_0px_#000] transition-all ${
        isOriginal
          ? 'bg-emerald-950/80 text-emerald-200'
          : similarityScore > 40
          ? 'bg-rose-950/80 text-rose-200'
          : 'bg-amber-950/80 text-amber-200'
      }`}>
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-2xl bg-zinc-950 border-2 border-black shadow-[2px_2px_0px_#000] shrink-0">
            {isOriginal ? (
              <PixelShield size={22} />
            ) : (
              <PixelSearch size={22} />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h4 className="font-pixel font-bold text-base text-white">{verdict}</h4>
              <span className="font-pixel text-xs px-2.5 py-0.5 rounded-lg bg-black text-amber-300 border-2 border-black shadow-[1px_1px_0px_#000] font-bold">
                {similarityScore}% Similarity
              </span>
            </div>
            <p className="text-xs text-zinc-300 mt-1 leading-relaxed">{summary}</p>
          </div>
        </div>
      </div>

      {/* Matched Web Sources Cards */}
      {matchedSources.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold font-pixel uppercase tracking-wider text-zinc-300 flex items-center gap-2">
              <PixelDoc size={16} />
              <span>Matched Online Sources &amp; Literature ({matchedSources.length})</span>
            </h4>
            <span className="text-[11px] font-pixel text-zinc-400">Live search grounded</span>
          </div>

          <div className="space-y-3">
            {matchedSources.map((source, idx) => {
              const isExpanded = expandedSource === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl bg-zinc-950 border-2 border-black shadow-[3px_3px_0px_#000] overflow-hidden"
                >
                  <div
                    onClick={() => setExpandedSource(isExpanded ? null : idx)}
                    className="p-3.5 flex items-center justify-between cursor-pointer gap-3 bg-zinc-900/90 hover:bg-zinc-850"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-zinc-950 border-2 border-black shadow-[1px_1px_0px_#000] flex items-center justify-center shrink-0">
                        <span className="font-pixel text-xs font-bold text-amber-300">{idx + 1}</span>
                      </div>
                      <div className="min-w-0">
                        <h5 className="text-sm font-bold font-pixel text-white truncate hover:text-indigo-300 transition">
                          {source.title || 'Referenced Web Document'}
                        </h5>
                        <p className="text-xs text-zinc-400 truncate flex items-center gap-1.5 mt-0.5">
                          <span>{source.domain || (source.url ? new URL(source.url).hostname : 'Web')}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <span className="font-pixel text-xs px-2.5 py-0.5 rounded-lg bg-rose-500 text-black border-2 border-black font-bold">
                        {source.matchPercentage}% match
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-zinc-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-zinc-400" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Source Details */}
                  {isExpanded && (
                    <div className="p-4 border-t-2 border-zinc-800 space-y-3 bg-zinc-950">
                      {/* Side by side comparison if excerpts exist */}
                      {(source.studentExcerpt || source.matchedExcerpt) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                          <div className="p-3.5 rounded-xl bg-zinc-900 border-2 border-black space-y-1">
                            <span className="font-bold text-zinc-400 font-pixel text-[11px] uppercase tracking-wider">
                              Your Text:
                            </span>
                            <p className="text-zinc-200 italic leading-relaxed font-serif">
                              "{source.studentExcerpt || 'Excerpt from document'}"
                            </p>
                          </div>
                          <div className="p-3.5 rounded-xl bg-purple-950/50 border-2 border-black space-y-1">
                            <span className="font-bold text-purple-300 font-pixel text-[11px] uppercase tracking-wider">
                              Matched Source Quote:
                            </span>
                            <p className="text-purple-200 italic leading-relaxed font-serif">
                              "{source.matchedExcerpt || 'Online repository match'}"
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t-2 border-zinc-800">
                        {source.url && (
                          <a
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 hover:underline font-pixel"
                          >
                            <span>Open Source Webpage</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}

                        <button
                          onClick={() => handleOpenCitation(source)}
                          disabled={loadingCitation}
                          className="pixel-btn px-3 py-1.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-pixel font-bold flex items-center gap-1.5 shadow-[2px_2px_0px_#000] transition ml-auto"
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
        <div className="p-8 text-center rounded-3xl bg-zinc-950 border-2 border-black shadow-[4px_4px_0px_#000]">
          <PixelShield size={36} className="mx-auto mb-2" />
          <h4 className="text-sm font-bold font-pixel text-white">Zero Plagiarism Detected</h4>
          <p className="text-xs text-zinc-400 mt-1 max-w-md mx-auto">
            Our search-grounded index scanned web publications, Wikipedia, and indexed journals with 0% unauthorized similarity matches.
          </p>
        </div>
      )}

      {/* Flagged passages section if any */}
      {flaggedPassages.length > 0 && (
        <div className="mt-4 p-5 rounded-3xl bg-zinc-950 border-2 border-black shadow-[4px_4px_0px_#000] space-y-3">
          <h4 className="text-xs font-bold font-pixel uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Passages Needing Citation or Rewriting ({flaggedPassages.length})</span>
          </h4>
          <div className="space-y-2">
            {flaggedPassages.map((p, i) => (
              <div key={i} className="p-3 rounded-2xl bg-zinc-900 border-2 border-black text-xs space-y-1 shadow-[2px_2px_0px_#000]">
                <div className="flex items-center justify-between font-pixel">
                  <span className="font-bold text-zinc-300">
                    Recommendation: <span className="text-amber-300">{p.recommendation || 'Add attribution'}</span>
                  </span>
                  <span className="text-rose-400 font-bold">{p.similarity}% match</span>
                </div>
                <p className="text-zinc-200 italic font-serif">"{p.passage}"</p>
                {p.matchedSourceTitle && (
                  <p className="text-[11px] text-zinc-400 font-pixel">Source: {p.matchedSourceTitle}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Citation Generator Dialog */}
      {selectedCitation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-zinc-950 border-2 border-black shadow-[6px_6px_0px_#000] rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b-2 border-zinc-800">
              <div className="flex items-center gap-2">
                <PixelCrown size={20} />
                <h3 className="text-base font-bold font-pixel text-white">Academic Citation Generator</h3>
              </div>
              <button
                onClick={() => setSelectedCitation(null)}
                className="text-zinc-400 hover:text-white font-pixel text-xs"
              >
                ✕ Close
              </button>
            </div>

            <p className="text-xs text-zinc-300 font-pixel">
              Easily attribute this source in your bibliography to eliminate plagiarism risk:
            </p>

            <div className="space-y-3">
              {/* APA */}
              {selectedCitation.citations.apa && (
                <div className="p-3.5 rounded-2xl bg-zinc-900 border-2 border-black shadow-[2px_2px_0px_#000] space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold font-pixel text-indigo-400">APA 7th Edition</span>
                    <button
                      onClick={() => copyToClipboard(selectedCitation.citations.apa!, 'apa')}
                      className="text-[11px] font-pixel text-zinc-400 hover:text-white flex items-center gap-1"
                    >
                      {copiedFormat === 'apa' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedFormat === 'apa' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <p className="text-xs text-zinc-200 font-mono leading-relaxed select-all">
                    {selectedCitation.citations.apa}
                  </p>
                </div>
              )}

              {/* MLA */}
              {selectedCitation.citations.mla && (
                <div className="p-3.5 rounded-2xl bg-zinc-900 border-2 border-black shadow-[2px_2px_0px_#000] space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold font-pixel text-indigo-400">MLA 9th Edition</span>
                    <button
                      onClick={() => copyToClipboard(selectedCitation.citations.mla!, 'mla')}
                      className="text-[11px] font-pixel text-zinc-400 hover:text-white flex items-center gap-1"
                    >
                      {copiedFormat === 'mla' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedFormat === 'mla' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <p className="text-xs text-zinc-200 font-mono leading-relaxed select-all">
                    {selectedCitation.citations.mla}
                  </p>
                </div>
              )}

              {/* Chicago / Harvard */}
              {selectedCitation.citations.chicago && (
                <div className="p-3.5 rounded-2xl bg-zinc-900 border-2 border-black shadow-[2px_2px_0px_#000] space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold font-pixel text-indigo-400">Chicago Manual of Style</span>
                    <button
                      onClick={() => copyToClipboard(selectedCitation.citations.chicago!, 'chicago')}
                      className="text-[11px] font-pixel text-zinc-400 hover:text-white flex items-center gap-1"
                    >
                      {copiedFormat === 'chicago' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedFormat === 'chicago' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <p className="text-xs text-zinc-200 font-mono leading-relaxed select-all">
                    {selectedCitation.citations.chicago}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedCitation(null)}
                className="pixel-btn px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-850 text-zinc-200 text-xs font-pixel font-bold border-2 border-black shadow-[2px_2px_0px_#000]"
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
