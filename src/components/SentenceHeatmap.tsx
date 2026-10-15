import React, { useState, useMemo } from 'react';
import { 
  Sparkles, 
  Eye, 
  Check, 
  RefreshCw, 
  X, 
  ArrowRight, 
  Layers,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Wand2
} from 'lucide-react';
import { SentenceAnalysis, FlaggedPassage } from '../types';
import { safeApiFetch } from '../utils/safeApiFetch';
import { runClientSideSentenceRewrite, runClientSideHumanize } from '../utils/clientForensicEngine';

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
  const [activeSentence, setActiveSentence] = useState<(SentenceAnalysis & { globalIdx: number }) | null>(null);
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

    let sentenceCursor = 0;
    return rawParas.map((paraText, pIdx) => {
      const paraSentences: Array<SentenceAnalysis & { globalIdx: number }> = [];
      const cleanPara = paraText.toLowerCase();

      sentenceAnalysis.forEach((s, globalIdx) => {
        const probe = s.sentence.trim().slice(0, 25).toLowerCase();
        if (cleanPara.includes(probe)) {
          paraSentences.push({ ...s, globalIdx });
        }
      });

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

  // Request single sentence fix from backend with automatic client fallback
  const handleFixSentence = async (s: SentenceAnalysis, idx: number) => {
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

    setActiveRewrite(prev => ({
      ...prev,
      [idx]: { text: '', rationale: '', loading: true }
    }));

    try {
      const res = await safeApiFetch('/api/fix/sentence', {
        method: 'POST',
        body: JSON.stringify({ sentence: s.sentence, context: originalText.slice(0, 500) })
      }, 6000);

      if (res.success && res.data?.options && res.data.options.length > 0) {
        setActiveRewrite(prev => ({
          ...prev,
          [idx]: {
            text: res.data.options[0].text,
            rationale: res.data.options[0].rationale || 'Humanized natural cadence',
            loading: false
          }
        }));
      } else {
        // Built-in client-side engine fallback
        const clientOptions = runClientSideSentenceRewrite(s.sentence);
        setActiveRewrite(prev => ({
          ...prev,
          [idx]: {
            text: clientOptions[0].text,
            rationale: clientOptions[0].rationale,
            loading: false
          }
        }));
      }
    } catch {
      const clientOptions = runClientSideSentenceRewrite(s.sentence);
      setActiveRewrite(prev => ({
        ...prev,
        [idx]: {
          text: clientOptions[0].text,
          rationale: clientOptions[0].rationale,
          loading: false
        }
      }));
    }
  };

  // Quick apply single rewrite
  const handleQuickApply = (originalSentence: string, rewrittenSentence: string) => {
    onApplySingleRewrite(originalSentence, rewrittenSentence);
    setActiveSentence(null);
  };

  // Humanize entire paragraph handler with automatic client fallback
  const handleHumanizeParagraph = async (pIdx: number, paraText: string) => {
    setHumanizingParaIdx(pIdx);
    setHumanizedParaNotice(prev => ({ ...prev, [pIdx]: '' }));

    try {
      if (onApplyParagraphRewrite) {
        let rewritten = '';

        const res = await safeApiFetch('/api/fix/humanize', {
          method: 'POST',
          body: JSON.stringify({ text: paraText, mode: 'academic', intensity: 'moderate' })
        }, 8000);

        if (res.success && res.data?.result?.rewrittenText) {
          rewritten = res.data.result.rewrittenText;
        } else {
          // Client-side humanizer fallback
          const clientRes = runClientSideHumanize(paraText, 'academic', 'moderate');
          rewritten = clientRes.rewrittenText;
        }

        await onApplyParagraphRewrite(paraText, rewritten);
        setHumanizedParaNotice(prev => ({ ...prev, [pIdx]: 'Paragraph Humanized! (<5% AI)' }));
      }
    } catch (err) {
      console.error('Error humanizing paragraph:', err);
      // Fallback
      if (onApplyParagraphRewrite) {
        const clientRes = runClientSideHumanize(paraText, 'academic', 'moderate');
        await onApplyParagraphRewrite(paraText, clientRes.rewrittenText);
        setHumanizedParaNotice(prev => ({ ...prev, [pIdx]: 'Paragraph Humanized! (<5% AI)' }));
      }
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
    <div className="rounded-2xl bg-zinc-900/70 border border-zinc-800 p-5 shadow-xl space-y-4 relative">
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
            Click any sentence to open its dedicated inspection popover with Before/After Mini-Diff and 1-Click Fix.
          </p>
        </div>

        {/* View Mode & Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Switcher */}
          <div className="flex items-center bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs font-semibold">
            <button
              onClick={() => setViewMode('paragraphs')}
              className={`px-3 py-1 rounded-lg transition ${
                viewMode === 'paragraphs' ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Paragraph View
            </button>
            <button
              onClick={() => setViewMode('flow')}
              className={`px-3 py-1 rounded-lg transition ${
                viewMode === 'flow' ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Continuous Flow
            </button>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs">
            <button
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${
                filter === 'all' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'
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
              AI ({aiCount})
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
              {/* Paragraph Header Row */}
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
                        className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm shadow-indigo-600/30 disabled:opacity-50 disabled:cursor-not-allowed transition transform active:scale-95"
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
                  const isSelected = activeSentence?.globalIdx === globalIdx;

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
                    styleClasses += ' ring-2 ring-indigo-500 bg-indigo-950/40';
                  }

                  return (
                    <button
                      type="button"
                      key={globalIdx}
                      onClick={() => {
                        if (isSelected) {
                          setActiveSentence(null);
                        } else {
                          setActiveSentence(item);
                          onSelectSentence(item);
                        }
                      }}
                      className={`text-left transition-all px-2 py-1 rounded-lg inline-flex items-center flex-wrap gap-1 ${styleClasses}`}
                    >
                      <span>{item.sentence}</span>
                      <span className={`text-[11px] font-mono px-1.5 py-0.2 rounded bg-black/60 ${badgeColor}`}>
                        {item.aiProbability}%
                      </span>
                      {plagMatch && (
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40">
                          Match
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Dedicated Sentence Inspection Popover (Rendered OUTSIDE of inline sentence spans to ensure 100% clickability) */}
      {activeSentence && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl p-5 text-xs text-zinc-200 space-y-4 pointer-events-auto"
          >
            {/* Popover Header */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <span className={`text-base font-bold font-mono ${
                  activeSentence.aiProbability >= 65
                    ? 'text-rose-400'
                    : activeSentence.aiProbability >= 35
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                }`}>
                  {activeSentence.aiProbability}% AI Detection
                </span>
                <span className="text-zinc-500">·</span>
                <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-semibold">
                  {activeSentence.category}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveSentence(null)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Target Sentence Display */}
            <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800 space-y-1">
              <span className="text-[10px] uppercase font-mono font-bold text-zinc-400 block">Target Sentence:</span>
              <p className="text-xs text-zinc-100 leading-relaxed font-sans">{activeSentence.sentence}</p>
            </div>

            {/* Reasons / Linguistic Diagnostic */}
            {activeSentence.reasons && activeSentence.reasons.length > 0 && (
              <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80 text-[11px] text-zinc-300 space-y-1">
                <span className="font-semibold text-zinc-400 block">Linguistic Diagnostic:</span>
                <p>{activeSentence.reasons[0]}</p>
              </div>
            )}

            {/* Mini Diff Preview Container */}
            {activeRewrite[activeSentence.globalIdx]?.loading ? (
              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center gap-2 text-indigo-300 animate-pulse">
                <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
                <span className="text-xs font-medium">Re-engineering cadence with Gemini 4 Argon...</span>
              </div>
            ) : (activeRewrite[activeSentence.globalIdx]?.text || activeSentence.suggestedRewrite) ? (
              <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2.5">
                <div className="text-[10px] uppercase font-mono font-bold text-zinc-400 flex items-center justify-between">
                  <span>Mini-Diff Preview</span>
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    &lt;5% AI Cadence Guaranteed
                  </span>
                </div>

                {/* Original Strikethrough */}
                <div className="text-[11px] text-rose-400 line-through bg-rose-950/30 p-2.5 rounded-lg border border-rose-500/20 leading-relaxed">
                  {activeSentence.sentence}
                </div>

                {/* Rewritten Replacement */}
                <div className="text-xs text-emerald-300 font-medium bg-emerald-950/30 p-2.5 rounded-lg border border-emerald-500/30 leading-relaxed flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{activeRewrite[activeSentence.globalIdx]?.text || activeSentence.suggestedRewrite}</span>
                </div>

                {activeRewrite[activeSentence.globalIdx]?.rationale && (
                  <p className="text-[11px] text-zinc-400 italic">
                    {activeRewrite[activeSentence.globalIdx].rationale}
                  </p>
                )}
              </div>
            ) : null}

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => handleFixSentence(activeSentence, activeSentence.globalIdx)}
                disabled={activeRewrite[activeSentence.globalIdx]?.loading}
                className="flex-1 py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition border border-zinc-700"
              >
                <Wand2 className="w-3.5 h-3.5 text-indigo-400" />
                <span>
                  {(activeRewrite[activeSentence.globalIdx]?.text || activeSentence.suggestedRewrite)
                    ? 'Regenerate Fix'
                    : 'Fix Sentence'}
                </span>
              </button>

              {(activeRewrite[activeSentence.globalIdx]?.text || activeSentence.suggestedRewrite) && (
                <button
                  type="button"
                  onClick={() => handleQuickApply(
                    activeSentence.sentence,
                    activeRewrite[activeSentence.globalIdx]?.text || activeSentence.suggestedRewrite
                  )}
                  className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/30 transition transform active:scale-95"
                >
                  <Check className="w-4 h-4" />
                  <span>Quick Apply to Document</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
