import React from 'react';
import { HelpCircle, Activity, Sparkles, Shuffle, Layers } from 'lucide-react';
import { MetricData } from '../types';

interface MetricsGridProps {
  metrics: MetricData;
  avgSentenceLength?: number;
  lexicalDiversity?: number;
}

export const MetricsGrid: React.FC<MetricsGridProps> = ({
  metrics,
  avgSentenceLength,
  lexicalDiversity
}) => {
  // Helper to get descriptive status for metrics
  const getPerplexityStatus = (val: number) => {
    if (val < 35) return { label: 'Predictable (AI-like)', bg: 'bg-rose-500/15', color: 'text-rose-400', border: 'border-rose-500/30' };
    if (val < 65) return { label: 'Moderate Entropy', bg: 'bg-amber-500/15', color: 'text-amber-400', border: 'border-amber-500/30' };
    return { label: 'High Entropy (Human-like)', bg: 'bg-emerald-500/15', color: 'text-emerald-400', border: 'border-emerald-500/30' };
  };

  const getBurstinessStatus = (val: number) => {
    if (val < 35) return { label: 'Uniform Cadence (AI-like)', bg: 'bg-rose-500/15', color: 'text-rose-400', border: 'border-rose-500/30' };
    if (val < 65) return { label: 'Balanced Variance', bg: 'bg-amber-500/15', color: 'text-amber-400', border: 'border-amber-500/30' };
    return { label: 'High Burstiness (Human-like)', bg: 'bg-emerald-500/15', color: 'text-emerald-400', border: 'border-emerald-500/30' };
  };

  const perpStatus = getPerplexityStatus(metrics.perplexityScore);
  const burstStatus = getBurstinessStatus(metrics.burstinessScore);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
      {/* Metric 1: Perplexity */}
      <div className="group relative p-4 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-indigo-500/40 transition-all flex flex-col justify-between gap-2.5">
        {/* Row 1: Icon + Metric Label + Help Tooltip */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-300 font-semibold text-xs">
            <Activity className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>Perplexity Score</span>
          </div>
          <div className="relative">
            <HelpCircle className="w-3.5 h-3.5 text-slate-500 hover:text-slate-300 cursor-help" />
            <div className="absolute bottom-full right-0 mb-2 w-56 p-2 bg-slate-800 text-[11px] text-slate-300 rounded shadow-xl border border-slate-700 opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-30">
              Measures how predictable words are. Large Language Models tend to select statistically predictable tokens, resulting in lower perplexity.
            </div>
          </div>
        </div>

        {/* Row 2: Large monospace number on its own line */}
        <div>
          <span className="text-2xl font-bold font-mono text-white block tracking-tight">
            {metrics.perplexityScore}/100
          </span>
        </div>

        {/* Row 3: Status badge cleanly below number */}
        <div>
          <span className={`inline-flex self-start px-2 py-0.5 rounded-md text-[11px] font-medium border ${perpStatus.bg} ${perpStatus.color} ${perpStatus.border}`}>
            {perpStatus.label}
          </span>
        </div>

        {/* Row 4: Full-width progress bar */}
        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
          <div
            className="h-full bg-indigo-500 rounded-full transition-all duration-700"
            style={{ width: `${Math.max(5, Math.min(100, metrics.perplexityScore))}%` }}
          />
        </div>
      </div>

      {/* Metric 2: Burstiness */}
      <div className="group relative p-4 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-purple-500/40 transition-all flex flex-col justify-between gap-2.5">
        {/* Row 1: Icon + Metric Label + Help Tooltip */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-300 font-semibold text-xs">
            <Shuffle className="w-4 h-4 text-purple-400 shrink-0" />
            <span>Burstiness Variance</span>
          </div>
          <div className="relative">
            <HelpCircle className="w-3.5 h-3.5 text-slate-500 hover:text-slate-300 cursor-help" />
            <div className="absolute bottom-full right-0 mb-2 w-56 p-2 bg-slate-800 text-[11px] text-slate-300 rounded shadow-xl border border-slate-700 opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-30">
              Measures sentence length & structure variation. Humans alternate between short punches and long descriptive clauses. AI models tend to produce uniform sentence lengths.
            </div>
          </div>
        </div>

        {/* Row 2: Large monospace number on its own line */}
        <div>
          <span className="text-2xl font-bold font-mono text-white block tracking-tight">
            {metrics.burstinessScore}/100
          </span>
        </div>

        {/* Row 3: Status badge cleanly below number */}
        <div>
          <span className={`inline-flex self-start px-2 py-0.5 rounded-md text-[11px] font-medium border ${burstStatus.bg} ${burstStatus.color} ${burstStatus.border}`}>
            {burstStatus.label}
          </span>
        </div>

        {/* Row 4: Full-width progress bar */}
        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
          <div
            className="h-full bg-purple-500 rounded-full transition-all duration-700"
            style={{ width: `${Math.max(5, Math.min(100, metrics.burstinessScore))}%` }}
          />
        </div>
      </div>

      {/* Metric 3: Syntactic Uniformity */}
      <div className="group relative p-4 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-amber-500/40 transition-all flex flex-col justify-between gap-2.5">
        {/* Row 1: Icon + Metric Label + Help Tooltip */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-300 font-semibold text-xs">
            <Layers className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Syntactic Uniformity</span>
          </div>
          <div className="relative">
            <HelpCircle className="w-3.5 h-3.5 text-slate-500 hover:text-slate-300 cursor-help" />
            <div className="absolute bottom-full right-0 mb-2 w-56 p-2 bg-slate-800 text-[11px] text-slate-300 rounded shadow-xl border border-slate-700 opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-30">
              High uniformity indicates mechanical balance across clauses and predictable grammatical subordination, common in synthetic writing.
            </div>
          </div>
        </div>

        {/* Row 2: Large monospace number on its own line */}
        <div>
          <span className="text-2xl font-bold font-mono text-white block tracking-tight">
            {metrics.syntacticUniformity}%
          </span>
        </div>

        {/* Row 3: Status badge cleanly below number */}
        <div>
          <span className={`inline-flex self-start px-2 py-0.5 rounded-md text-[11px] font-medium border ${
            metrics.syntacticUniformity > 60
              ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
              : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
          }`}>
            {metrics.syntacticUniformity > 60 ? 'Mechanical Balance' : 'Organic Structure'}
          </span>
        </div>

        {/* Row 4: Full-width progress bar */}
        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
          <div
            className="h-full bg-amber-500 rounded-full transition-all duration-700"
            style={{ width: `${Math.max(5, Math.min(100, metrics.syntacticUniformity))}%` }}
          />
        </div>
      </div>

      {/* Metric 4: AI Tropes & Clichés */}
      <div className="group relative p-4 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-rose-500/40 transition-all flex flex-col justify-between gap-2.5">
        {/* Row 1: Icon + Metric Label + Help Tooltip */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-300 font-semibold text-xs">
            <Sparkles className="w-4 h-4 text-rose-400 shrink-0" />
            <span>AI Clichés Detected</span>
          </div>
          <div className="relative">
            <HelpCircle className="w-3.5 h-3.5 text-slate-500 hover:text-slate-300 cursor-help" />
            <div className="absolute bottom-full right-0 mb-2 w-56 p-2 bg-slate-800 text-[11px] text-slate-300 rounded shadow-xl border border-slate-700 opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-30">
              Overused hallmark AI words: 'delve', 'testament to', 'crucial role', 'tapestry', 'foster', 'moreover'.
            </div>
          </div>
        </div>

        {/* Row 2: Large monospace number on its own line */}
        <div>
          <span className="text-2xl font-bold font-mono text-white block tracking-tight">
            {metrics.clicheCount}
          </span>
        </div>

        {/* Row 3: Status badge cleanly below number */}
        <div>
          <span className={`inline-flex self-start px-2 py-0.5 rounded-md text-[11px] font-medium border ${
            metrics.clicheCount === 0
              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
              : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
          }`}>
            {metrics.clicheCount === 0 ? 'Zero AI Tropes' : `${metrics.clicheCount} Flagged Terms`}
          </span>
        </div>

        {/* Row 4: Secondary stats row */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
          <span>Avg: {avgSentenceLength ? `${avgSentenceLength}w` : '15w'}</span>
          <span>Lexical: {lexicalDiversity ? `${Math.round(lexicalDiversity * 100)}%` : '62%'}</span>
        </div>
      </div>
    </div>
  );
};
