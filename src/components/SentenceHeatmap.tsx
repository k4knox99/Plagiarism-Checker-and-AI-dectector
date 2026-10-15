import React, { useState } from 'react';
import { Sparkles, AlertTriangle, CheckCircle, ExternalLink, Wand2, Eye } from 'lucide-react';
import { SentenceAnalysis, FlaggedPassage } from '../types';

interface SentenceHeatmapProps {
  sentenceAnalysis: SentenceAnalysis[];
  flaggedPassages?: FlaggedPassage[];
  onSelectSentence: (sentence: SentenceAnalysis) => void;
  onApplySingleRewrite: (original: string, replacement: string) => void;
}

export const SentenceHeatmap: React.FC<SentenceHeatmapProps> = ({
  sentenceAnalysis,
  flaggedPassages = [],
  onSelectSentence,
  onApplySingleRewrite
}) => {
  const [filter, setFilter] = useState<'all' | 'ai' | 'mixed' | 'plagiarism' | 'human'>('all');
  const [activeTooltip, setActiveTooltip] = useState<number | null>(null);

  // Helper to check if a sentence matches a flagged plagiarism passage
  const getPlagiarismMatch = (sentenceText: string) => {
    return flaggedPassages.find(p => 
      sentenceText.toLowerCase().includes(p.passage.toLowerCase().slice(0, 30)) ||
      p.passage.toLowerCase().includes(sentenceText.toLowerCase().slice(0, 30))
    );
  };

  const filteredSentences = sentenceAnalysis.filter(item => {
    if (filter === 'all') return true;
    if (filter === 'ai') return item.aiProbability >= 65;
    if (filter === 'mixed') return item.aiProbability >= 35 && item.aiProbability < 65;
    if (filter === 'human') return item.aiProbability < 35;
    if (filter === 'plagiarism') return Boolean(getPlagiarismMatch(item.sentence));
    return true;
  });

  const aiCount = sentenceAnalysis.filter(s => s.aiProbability >= 65).length;
  const mixedCount = sentenceAnalysis.filter(s => s.aiProbability >= 35 && s.aiProbability < 65).length;
  const humanCount = sentenceAnalysis.filter(s => s.aiProbability < 35).length;
  const plagCount = flaggedPassages.length;

  return (
    <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-5 shadow-xl">
      {/* Header & Filter Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <Eye className="w-4 h-4 text-indigo-400" />
            <span>Interactive Sentence-by-Sentence Heatmap</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Click on any flagged sentence to view linguistic forensics or apply instant 1-click humanization.
          </p>
        </div>

        {/* Filter pills */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setFilter('all')}
            className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all ${
              filter === 'all'
                ? 'bg-slate-700 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            All ({sentenceAnalysis.length})
          </button>
          <button
            onClick={() => setFilter('ai')}
            className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all ${
              filter === 'ai'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                : 'text-rose-400/80 hover:text-rose-300 hover:bg-rose-500/10'
            }`}
          >
            High AI ({aiCount})
          </button>
          <button
            onClick={() => setFilter('mixed')}
            className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all ${
              filter === 'mixed'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-amber-400/80 hover:text-amber-300 hover:bg-amber-500/10'
            }`}
          >
            Paraphrased ({mixedCount})
          </button>
          {plagCount > 0 && (
            <button
              onClick={() => setFilter('plagiarism')}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all ${
                filter === 'plagiarism'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
                : 'text-purple-400/80 hover:text-purple-300 hover:bg-purple-500/10'
              }`}
            >
              Similarity Match ({plagCount})
            </button>
          )}
          <button
            onClick={() => setFilter('human')}
            className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all ${
              filter === 'human'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-emerald-400/80 hover:text-emerald-300 hover:bg-emerald-500/10'
            }`}
          >
            Human ({humanCount})
          </button>
        </div>
      </div>

      {/* Heatmap reading surface */}
      <div className="mt-4 p-5 rounded-xl bg-slate-950/60 border border-slate-800/80 leading-relaxed text-slate-200 text-sm md:text-base space-y-2.5 max-h-[480px] overflow-y-auto custom-scrollbar">
        {filteredSentences.length === 0 ? (
          <div className="text-center py-10 text-slate-500 text-sm">
            No sentences matching this filter criteria.
          </div>
        ) : (
          <div className="flex flex-wrap gap-x-1.5 gap-y-2">
            {filteredSentences.map((item, idx) => {
              const plagMatch = getPlagiarismMatch(item.sentence);
              const isHighAi = item.aiProbability >= 65;
              const isMixed = item.aiProbability >= 35 && item.aiProbability < 65;
              const isHuman = item.aiProbability < 35;

              let styleClasses = 'bg-slate-900/40 hover:bg-slate-800/70 border border-transparent';
              let badgeColor = 'text-slate-400';

              if (isHighAi) {
                styleClasses = 'bg-rose-950/40 hover:bg-rose-900/50 border border-rose-500/30 text-rose-100 shadow-sm shadow-rose-950/40';
                badgeColor = 'text-rose-400 font-semibold';
              } else if (isMixed) {
                styleClasses = 'bg-amber-950/40 hover:bg-amber-900/50 border border-amber-500/30 text-amber-100';
                badgeColor = 'text-amber-400 font-semibold';
              } else if (isHuman) {
                styleClasses = 'bg-emerald-950/20 hover:bg-emerald-900/30 border border-emerald-500/20 text-slate-200';
                badgeColor = 'text-emerald-400';
              }

              if (plagMatch) {
                styleClasses += ' underline decoration-wavy decoration-purple-400/60 decoration-2 underline-offset-4';
              }

              return (
                <span
                  key={idx}
                  onClick={() => onSelectSentence(item)}
                  onMouseEnter={() => setActiveTooltip(idx)}
                  onMouseLeave={() => setActiveTooltip(null)}
                  className={`relative cursor-pointer transition-all px-2 py-1 rounded-lg inline-block group ${styleClasses}`}
                >
                  <span>{item.sentence}</span>

                  {/* Micro badge indicator on sentence */}
                  <span className={`ml-1.5 text-[11px] font-mono px-1.5 py-0.2 rounded bg-black/40 ${badgeColor}`}>
                    {item.aiProbability}% AI
                  </span>

                  {plagMatch && (
                    <span className="ml-1 text-[10px] font-mono px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40">
                      Plag Match
                    </span>
                  )}

                  {/* Quick hovering preview popup */}
                  {activeTooltip === idx && (
                    <div className="absolute bottom-full left-0 mb-2 w-72 p-3 bg-slate-900 text-xs text-slate-300 rounded-xl shadow-2xl border border-slate-700 z-30 pointer-events-auto">
                      <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-800">
                        <span className={`font-semibold ${badgeColor}`}>
                          {item.aiProbability}% AI Probability
                        </span>
                        <span className="text-[10px] text-slate-400 uppercase">
                          {item.category}
                        </span>
                      </div>

                      {item.reasons && item.reasons.length > 0 && (
                        <p className="text-[11px] text-slate-400 mb-2">
                          {item.reasons[0]}
                        </p>
                      )}

                      {plagMatch && (
                        <div className="mb-2 p-1.5 rounded bg-purple-950/50 border border-purple-500/30 text-[11px] text-purple-200">
                          Matched with: <strong className="text-purple-300">{plagMatch.matchedSourceTitle || 'Web Article'}</strong>
                        </div>
                      )}

                      <div className="flex items-center gap-2 pt-1 border-t border-slate-800">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectSentence(item);
                          }}
                          className="flex-1 py-1 px-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-medium flex items-center justify-center gap-1 shadow"
                        >
                          <Wand2 className="w-3 h-3" />
                          Fix Sentence
                        </button>
                        {item.suggestedRewrite && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onApplySingleRewrite(item.sentence, item.suggestedRewrite);
                            }}
                            className="py-1 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] border border-slate-700"
                            title="Quick 1-Click Replace"
                          >
                            Quick Apply
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* Legend at bottom */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 pt-2 border-t border-slate-800/80">
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
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-0.5 bg-purple-400 underline decoration-wavy" />
            <span>Plagiarism Similarity Match</span>
          </div>
        </div>
        <span className="text-slate-500">Tip: Click on sentences to view alternatives</span>
      </div>
    </div>
  );
};
