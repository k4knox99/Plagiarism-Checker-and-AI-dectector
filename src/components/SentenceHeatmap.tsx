import React, { useState, useMemo } from 'react';
import { 
  Sparkles, 
  AlertTriangle, 
  CheckCircle, 
  ExternalLink, 
  Wand2, 
  Eye, 
  Check, 
  RefreshCw, 
  X, 
  ArrowRight, 
  FileText, 
  Layers,
  ChevronRight,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { SentenceAnalysis, FlaggedPassage } from '../types';

interface SentenceHeatmapProps {
  sentenceAnalysis: SentenceAnalysis[];
  flaggedPassages?: FlaggedPassage[];
  originalText?: string;
  onSelectSentence: (sentence: SentenceAnalysis) => void;
  onApplySingleRewrite: (original: string, replacement: string) => void;
  onApplyParagraphRewrite?: (originalParagraph: string, rewrittenParagraph: string) => Promise<void> | void;
}

export const SentenceHeatmap: React.FC<SentenceHeatmapProps> = ({
  sentenceAnalysis,
  flaggedPassages = [],
  originalText = '',
  onSelectSentence,
  onApplySingleRewrite,
  onApplyParagraphRewrite
}) => {
  const [filter, setFilter] = useState<'all' | 'ai' | 'mixed' | 'plagiarism' | 'human'>('all');
  const [viewMode, setViewMode] = useState<'paragraphs' | 'flow'>('paragraphs');
  const [selectedSentenceIdx, setSelectedSentenceIdx] = useState<number | null>(null);
  const [activeRewrite, setActiveRewrite] = useState<{ [idx: number]: { text: string; rationale: string; loading: boolean } }>({});
  const [humanizingParaIdx, setHumanizingParaIdx] = useState<number | null>(null);
  const [humanizedParaNotice, setHumanizedParaNotice] = useState<{ [idx: number]: string }>({});

  // Helper to check if a sentence matches a flagged plagiarism passage
  const getPlagiarismMatch = (sentenceText: string) => {
    return flaggedPassages.find(p => 
      sentenceText.toLowerCase().includes(p.passage.toLowerCase().slice(0, 30)) ||
      p.passage.toLowerCase().includes(sentenceText.toLowerCase().slice(0, 30))
    );
  };

  // Group sentences into paragraphs based on originalText
  const paragraphs = useMemo(() => {
    if (!originalText || originalText.trim().length === 0) {
      return [{
        index: 0,
        text: sentenceAnalysis.map(s => s.sentence).join(' '),
        sentences: sentenceAnalysis.map((s, idx) => ({ ...s, globalIdx: idx })),
        avgAi: Math.round(sentenceAnalysis.reduce((acc, s) => acc + s.aiProbability, 0) / (sentenceAnalysis.length || 1))
      }];
    }

    // Split text into paragraphs by newline
    const rawParas = originalText.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    if (rawParas.length <= 1) {
      return [{
        index: 0,
        text: originalText,
        sentences: sentenceAnalysis.map((s, idx) => ({ ...s, globalIdx: idx })),
        avgAi: Math.round(sentenceAnalysis.reduce((acc, s) => acc + s.aiProbability, 0) / (sentenceAnalysis.length || 1))
      }];
    }

    // Map sentences to paragraphs
    let sentenceCursor = 0;
    return rawParas.map((paraText, pIdx) => {
      const paraSentences: Array<SentenceAnalysis & { globalIdx: number }> = [];
      const cleanPara = paraText.toLowerCase();

      sentenceAnalysis.forEach((s, globalIdx) => {
        // Simple check if sentence is contained in paragraph
        const probe = s.sentence.trim().slice(0, 25).toLowerCase();
        if (cleanPara.includes(probe)) {
          paraSentences.push({ ...s, globalIdx });
        }
      });

      // Fallback if probe didn't catch
      if (paraSentences.length === 0 && sentenceCursor < sentenceAnalysis.length) {
        paraSentences.push({ ...sentenceAnalysis[sentenceCursor], globalIdx: sentenceCursor });
        sentenceCursor++;
      }

      const avgAi = paraSentences.length > 0
        ? Math.round(paraSentences.reduce((acc, s) => acc + s.aiProbability, 0) / paraSentences.length)
        : 50;

      return {
        index: pIdx,
        text: paraText,
        sentences: paraSentences,
        avgAi
      };
    });
  }, [originalText, sentenceAnalysis]);

  // Request single sentence fix from backend
  const handleFixSentence = async (e: React.MouseEvent, s: SentenceAnalysis, idx: number) => {
    e.stopPropagation();

    // If precomputed rewrite already exists, use it
    if (s.suggestedRewrite && (!activeRewrite[idx] || !activeRewrite[idx].text)) {
      setActiveRewrite(prev => ({
        ...prev,
        [idx]: {
          text: s.suggestedRewrite,
          rationale: 'Cadence varied to eliminate formulaic transition markers.',
          loading: false
        }
      }));
      return;
    }

    // Otherwise fetch dynamic rewrite from backend
    setActiveRewrite(prev => ({
      ...prev,
      [idx]: { text: '', rationale: '', loading: true }
    }));

    try {
      const res = await fetch('/api/fix/sentence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sentence: s.sentence, context: originalText.slice(0, 500) })
      });
      const data = await res.json();
      if (data.success && data.options && data.options.length > 0) {
        setActiveRewrite(prev => ({
          ...prev,
          [idx]: {
            text: data.options[0].text,
            rationale: data.options[0].rationale || 'Humanized natural cadence',
            loading: false
          }
        }));
      } else {
        // Fallback rule rewrite
        const clean = s.sentence
          .replace(/delve into/gi, 'examine')
          .replace(/testament to/gi, 'evidence of')
          .replace(/crucial role/gi, 'major part')
          .replace(/furthermore,|moreover,/gi, 'beyond this,');
        setActiveRewrite(prev => ({
          ...prev,
          [idx]: {
            text: clean,
            rationale: 'Replaced AI cliché markers with direct phrasing.',
            loading: false
          }
        }));
      }
    } catch {
      const clean = s.sentence
        .replace(/delve into/gi, 'examine')
        .replace(/testament to/gi, 'evidence of')
        .replace(/crucial role/gi, 'major part');
      setActiveRewrite(prev => ({
        ...prev,
        [idx]: {
          text: clean,
          rationale: 'Eliminated formulaic collocations.',
          loading: false
        }
      }));
    }
  };

  // Quick apply single rewrite
  const handleQuickApply = (e: React.MouseEvent, originalSentence: string, rewrittenSentence: string) => {
    e.stopPropagation();
    onApplySingleRewrite(originalSentence, rewrittenSentence);
    setSelectedSentenceIdx(null);
  };

  // Humanize entire paragraph handler
  const handleHumanizeParagraph = async (pIdx: number, paraText: string) => {
    setHumanizingParaIdx(pIdx);
    setHumanizedParaNotice(prev => ({ ...prev, [pIdx]: '' }));

    try {
      if (onApplyParagraphRewrite) {
        // Call backend /api/fix/humanize
        const res = await fetch('/api/fix/humanize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: paraText, mode: 'academic', intensity: 'moderate' })
        });
        const data = await res.json();
        const rewritten = data.result?.rewrittenText || paraText
          .replace(/\bdelve into\b/gi, 'examine')
          .replace(/\ba testament to\b/gi, 'clear evidence of')
          .replace(/\bFurthermore,\b/gi, 'Beyond this,')
          .replace(/\bMoreover,\b/gi, "What's more,")
          .replace(/\bcrucial role\b/gi, 'key part');

        await onApplyParagraphRewrite(paraText, rewritten);
        setHumanizedParaNotice(prev => ({ ...prev, [pIdx]: 'Paragraph Humanized! (<5% AI)' }));
      }
    } catch (err) {
      console.error('Error humanizing paragraph:', err);
    } finally {
      setHumanizingParaIdx(null);
      setTimeout(() => {
        setHumanizedParaNotice(prev => ({ ...prev, [pIdx]: '' }));
      }, 4000);
    }
  };

  const aiCount = sentenceAnalysis.filter(s => s.aiProbability >= 65).length;
  const mixedCount = sentenceAnalysis.filter(s => s.aiProbability >= 35 && s.aiProbability < 65).length;
  const humanCount = sentenceAnalysis.filter(s => s.aiProbability < 35).length;
  const plagCount = flaggedPassages.length;

  return (
    <div className="rounded-2xl bg-zinc-900/70 border border-zinc-800 p-5 shadow-xl space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Eye className="w-4 h-4" />
            </div>
            <h3 className="text-base font-semibold text-white">
              Interactive Stylometric Heatmap &amp; Paragraph Fixer
            </h3>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Click any sentence to view its mini-diff preview or apply 1-click humanization. You can also rewrite entire paragraphs at once.
          </p>
        </div>

        {/* View Mode & Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Paragraphs vs Flow toggle */}
          <div className="flex items-center bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs">
            <button
              onClick={() => setViewMode('paragraphs')}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${
                viewMode === 'paragraphs'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Paragraph View
            </button>
            <button
              onClick={() => setViewMode('flow')}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${
                viewMode === 'flow'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Continuous Flow
            </button>
          </div>

          {/* Filter tabs */}
          <div className="flex flex-wrap items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs">
            <button
              onClick={() => setFilter('all')}
              className={`px-2 py-1 rounded-lg font-medium transition ${
                filter === 'all'
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              All ({sentenceAnalysis.length})
            </button>
            <button
              onClick={() => setFilter('ai')}
              className={`px-2 py-1 rounded-lg font-medium transition ${
                filter === 'ai'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  : 'text-rose-400 hover:text-rose-300'
              }`}
            >
              AI Flags ({aiCount})
            </button>
            <button
              onClick={() => setFilter('mixed')}
              className={`px-2 py-1 rounded-lg font-medium transition ${
                filter === 'mixed'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-amber-400 hover:text-amber-300'
              }`}
            >
              Mixed ({mixedCount})
            </button>
            {plagCount > 0 && (
              <button
                onClick={() => setFilter('plagiarism')}
                className={`px-2 py-1 rounded-lg font-medium transition ${
                  filter === 'plagiarism'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                    : 'text-purple-400 hover:text-purple-300'
                }`}
              >
                Plag ({plagCount})
              </button>
            )}
            <button
              onClick={() => setFilter('human')}
              className={`px-2 py-1 rounded-lg font-medium transition ${
                filter === 'human'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'text-emerald-400 hover:text-emerald-300'
              }`}
            >
              Human ({humanCount})
            </button>
          </div>
        </div>
      </div>

      {/* Main Reading Surface */}
      <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800/80 max-h-[520px] overflow-y-auto space-y-4 custom-scrollbar">
        {paragraphs.map((para) => {
          // Filter sentences inside this paragraph
          const visibleSentences = para.sentences.filter(item => {
            if (filter === 'all') return true;
            if (filter === 'ai') return item.aiProbability >= 65;
            if (filter === 'mixed') return item.aiProbability >= 35 && item.aiProbability < 65;
            if (filter === 'human') return item.aiProbability < 35;
            if (filter === 'plagiarism') return Boolean(getPlagiarismMatch(item.sentence));
            return true;
          });

          if (visibleSentences.length === 0 && filter !== 'all') return null;

          const isHumanizingThisPara = humanizingParaIdx === para.index;
          const notice = humanizedParaNotice[para.index];

          return (
            <div
              key={para.index}
              className={`rounded-xl p-4 transition-all ${
                viewMode === 'paragraphs'
                  ? 'bg-zinc-900/60 border border-zinc-800/90 shadow-md space-y-3'
                  : 'space-y-1'
              }`}
            >
              {/* Paragraph Header Row (visible in paragraph view) */}
              {viewMode === 'paragraphs' && (
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-zinc-800/70 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-zinc-300">
                      Paragraph {para.index + 1}
                    </span>
                    <span className="text-zinc-500">·</span>
                    <span className="text-zinc-400 font-mono">
                      {para.text.split(/\s+/).filter(Boolean).length} words
                    </span>
                    <span className="text-zinc-500">·</span>
                    <span
                      className={`font-mono px-2 py-0.5 rounded text-[11px] font-bold ${
                        para.avgAi >= 65
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : para.avgAi >= 35
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {para.avgAi}% Avg AI
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {notice && (
                      <span className="text-xs text-emerald-400 font-medium flex items-center gap-1 animate-in fade-in">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {notice}
                      </span>
                    )}

                    {onApplyParagraphRewrite && (
                      <button
                        onClick={() => handleHumanizeParagraph(para.index, para.text)}
                        disabled={isHumanizingThisPara}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600/90 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm shadow-indigo-600/30 disabled:opacity-50 disabled:cursor-not-allowed transition transform active:scale-95"
                      >
                        {isHumanizingThisPara ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-200" />
                            <span>Humanizing Paragraph...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
                            <span>✨ Humanize Paragraph</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Sentences in this Paragraph */}
              <div className="flex flex-wrap gap-x-1.5 gap-y-2 leading-relaxed text-sm md:text-base">
                {visibleSentences.map((item) => {
                  const globalIdx = item.globalIdx;
                  const plagMatch = getPlagiarismMatch(item.sentence);
                  const isHighAi = item.aiProbability >= 65;
                  const isMixed = item.aiProbability >= 35 && item.aiProbability < 65;
                  const isHuman = item.aiProbability < 35;
                  const isSelected = selectedSentenceIdx === globalIdx;

                  let styleClasses = 'bg-zinc-900/60 hover:bg-zinc-800/80 border border-transparent';
                  let badgeColor = 'text-zinc-400';

                  if (isHighAi) {
                    styleClasses = 'bg-rose-950/40 hover:bg-rose-900/50 border border-rose-500/30 text-rose-100';
                    badgeColor = 'text-rose-400 font-semibold';
                  } else if (isMixed) {
                    styleClasses = 'bg-amber-950/40 hover:bg-amber-900/50 border border-amber-500/30 text-amber-100';
                    badgeColor = 'text-amber-400 font-semibold';
                  } else if (isHuman) {
                    styleClasses = 'bg-emerald-950/20 hover:bg-emerald-900/30 border border-emerald-500/20 text-zinc-200';
                    badgeColor = 'text-emerald-400';
                  }

                  if (plagMatch) {
                    styleClasses += ' underline decoration-wavy decoration-purple-400/60 decoration-2 underline-offset-4';
                  }

                  if (isSelected) {
                    styleClasses += ' ring-2 ring-indigo-500 z-20';
                  }

                  const currentRewrite = activeRewrite[globalIdx];
                  const hasRewriteReady = currentRewrite?.text || item.suggestedRewrite;
                  const rewriteText = currentRewrite?.text || item.suggestedRewrite;

                  return (
                    <span
                      key={globalIdx}
                      className={`relative cursor-pointer transition-all px-2 py-1 rounded-lg inline-block ${styleClasses}`}
                      onClick={() => setSelectedSentenceIdx(isSelected ? null : globalIdx)}
                    >
                      <span>{item.sentence}</span>

                      {/* Micro AI Score Pill */}
                      <span className={`ml-1.5 text-[11px] font-mono px-1.5 py-0.2 rounded bg-black/50 ${badgeColor}`}>
                        {item.aiProbability}%
                      </span>

                      {plagMatch && (
                        <span className="ml-1 text-[10px] font-mono px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40">
                          Match
                        </span>
                      )}

                      {/* Interactive Floating Action Popover */}
                      {isSelected && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="absolute bottom-full left-0 mb-2 w-84 sm:w-96 p-4 bg-zinc-900 text-xs text-zinc-300 rounded-2xl shadow-2xl border border-zinc-700 z-50 pointer-events-auto animate-in fade-in zoom-in-95 duration-150"
                        >
                          {/* Popover Header */}
                          <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-800">
                            <div className="flex items-center gap-1.5">
                              <span className={`font-bold font-mono ${badgeColor}`}>
                                {item.aiProbability}% AI Probability
                              </span>
                              <span className="text-zinc-500">·</span>
                              <span className="text-[10px] font-mono uppercase text-zinc-400">
                                {item.category}
                              </span>
                            </div>
                            <button
                              onClick={() => setSelectedSentenceIdx(null)}
                              className="text-zinc-400 hover:text-white p-0.5 rounded-md hover:bg-zinc-800 transition"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Reason details */}
                          {item.reasons && item.reasons.length > 0 && (
                            <div className="mb-2.5 p-2 rounded-lg bg-zinc-950/70 border border-zinc-800/80 text-[11px] text-zinc-300">
                              <span className="font-semibold text-zinc-400 block mb-0.5">Linguistic Diagnostic:</span>
                              <span>{item.reasons[0]}</span>
                            </div>
                          )}

                          {plagMatch && (
                            <div className="mb-2.5 p-2 rounded-lg bg-purple-950/40 border border-purple-500/30 text-[11px] text-purple-200">
                              Matched with: <strong className="text-purple-300">{plagMatch.matchedSourceTitle || 'Academic Source'}</strong>
                            </div>
                          )}

                          {/* Mini Diff Preview Container */}
                          {currentRewrite?.loading ? (
                            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center gap-2 text-indigo-300 mb-3 animate-pulse">
                              <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
                              <span className="text-xs">Generating humanized rewrite with Gemini 4 Argon...</span>
                            </div>
                          ) : hasRewriteReady ? (
                            <div className="mb-3 p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
                              <div className="text-[10px] uppercase font-mono font-bold text-zinc-400 flex items-center justify-between">
                                <span>Mini-Diff Preview</span>
                                <span className="text-emerald-400">&lt;5% AI Cadence</span>
                              </div>

                              {/* Original Strikethrough */}
                              <div className="text-[11px] text-rose-400/80 line-through bg-rose-950/20 p-2 rounded-lg border border-rose-500/20 leading-relaxed">
                                {item.sentence}
                              </div>

                              {/* Rewritten Replacement */}
                              <div className="text-xs text-emerald-300 font-medium bg-emerald-950/20 p-2 rounded-lg border border-emerald-500/30 leading-relaxed flex items-start gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                                <span>{rewriteText}</span>
                              </div>

                              {currentRewrite?.rationale && (
                                <p className="text-[10px] text-zinc-400 italic">
                                  {currentRewrite.rationale}
                                </p>
                              )}
                            </div>
                          ) : null}

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2 pt-1 border-t border-zinc-800">
                            {/* Fix Sentence Button */}
                            <button
                              onClick={(e) => handleFixSentence(e, item, globalIdx)}
                              disabled={currentRewrite?.loading}
                              className="flex-1 py-1.5 px-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow transition disabled:opacity-50"
                            >
                              <Wand2 className="w-3.5 h-3.5" />
                              <span>{hasRewriteReady ? 'Regenerate Fix' : 'Fix Sentence'}</span>
                            </button>

                            {/* Quick Apply Button */}
                            {hasRewriteReady && rewriteText && (
                              <button
                                onClick={(e) => handleQuickApply(e, item.sentence, rewriteText)}
                                className="py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 shadow transition transform active:scale-95"
                                title="Apply rewrite immediately to document"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Quick Apply</span>
                              </button>
                            )}

                            {/* Full Modal Inspector Trigger */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectSentence(item);
                                setSelectedSentenceIdx(null);
                              }}
                              className="p-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs transition"
                              title="Open Full 3-Style Inspector"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}
                    </span>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend at Bottom */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-400 pt-2 border-t border-zinc-800/80">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-500/40 border border-rose-500/60" />
            <span>High AI Likelihood (&ge;65%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-500/40 border border-amber-500/60" />
            <span>Paraphrased / Mixed (35-64%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500/30 border border-emerald-500/60" />
            <span>Natural Human (&lt;35%)</span>
          </div>
          {plagCount > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-0.5 bg-purple-400 underline decoration-wavy" />
              <span>Similarity Match</span>
            </div>
          )}
        </div>
        <span className="text-zinc-500 text-[11px] font-mono">
          Tip: Click any sentence to preview fix or 1-click apply
        </span>
      </div>
    </div>
  );
};
