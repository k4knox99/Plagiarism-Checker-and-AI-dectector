import React from 'react';
import { HelpCircle, Activity, Sparkles, Shuffle, Repeat, Layers } from 'lucide-react';
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
    if (val < 35) return { label: 'Predictable (AI-like)', color: 'text-rose-400' };
    if (val < 65) return { label: 'Moderate Entropy', color: 'text-amber-400' };
    return { label: 'High Entropy (Human-like)', color: 'text-emerald-400' };
  };

  const getBurstinessStatus = (val: number) => {
    if (val < 35) return { label: 'Uniform Cadence (AI-like)', color: 'text-rose-400' };
    if (val < 65) return { label: 'Balanced Variance', color: 'text-amber-400' };
    return { label: 'High Burstiness (Human-like)', color: 'text-emerald-400' };
  };

  const perpStatus = getPerplexityStatus(metrics.perplexityScore);
  const burstStatus = getBurstinessStatus(metrics.burstinessScore);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
      {/* Metric 1: Perplexity */}
      <div className="group relative p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-indigo-500/40 transition-all">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-slate-300 font-medium text-xs">
            <Activity className="w-4 h-4 text-indigo-400" />
            <span>Perplexity Score</span>
          </div>
          <div className="relative">
            <HelpCircle className="w-3.5 h-3.5 text-slate-500 hover:text-slate-300 cursor-help" />
            <div className="absolute bottom-full right-0 mb-2 w-56 p-2 bg-slate-800 text-[11px] text-slate-300 rounded shadow-xl border border-slate-700 opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-20">
              Measures how predictable words are. Large Language Models tend to select statistically predictable tokens, resulting in lower perplexity.
            </div>
          </div>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-2xl font-bold font-mono text-white">{metrics.perplexityScore}/100</span>
          <span className={`text-xs font-medium ${perpStatus.color}`}>{perpStatus.label}</span>
        </div>
        <div className="mt-2 w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-500 rounded-full transition-all duration-700"
            style={{ width: `${metrics.perplexityScore}%` }}
          />
        </div>
      </div>

      {/* Metric 2: Burstiness */}
      <div className="group relative p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-purple-500/40 transition-all">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-slate-300 font-medium text-xs">
            <Shuffle className="w-4 h-4 text-purple-400" />
            <span>Burstiness Variance</span>
          </div>
          <div className="relative">
            <HelpCircle className="w-3.5 h-3.5 text-slate-500 hover:text-slate-300 cursor-help" />
            <div className="absolute bottom-full right-0 mb-2 w-56 p-2 bg-slate-800 text-[11px] text-slate-300 rounded shadow-xl border border-slate-700 opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-20">
              Measures sentence length & structure variation. Humans alternate between short punches and long descriptive clauses. AI models tend to produce uniform sentence lengths.
            </div>
          </div>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-2xl font-bold font-mono text-white">{metrics.burstinessScore}/100</span>
          <span className={`text-xs font-medium ${burstStatus.color}`}>{burstStatus.label}</span>
        </div>
        <div className="mt-2 w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
          <div
            className="h-full bg-purple-500 rounded-full transition-all duration-700"
            style={{ width: `${metrics.burstinessScore}%` }}
          />
        </div>
      </div>

      {/* Metric 3: Syntactic Uniformity */}
      <div className="group relative p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-amber-500/40 transition-all">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-slate-300 font-medium text-xs">
            <Layers className="w-4 h-4 text-amber-400" />
            <span>Syntactic Uniformity</span>
          </div>
          <div className="relative">
            <HelpCircle className="w-3.5 h-3.5 text-slate-500 hover:text-slate-300 cursor-help" />
            <div className="absolute bottom-full right-0 mb-2 w-56 p-2 bg-slate-800 text-[11px] text-slate-300 rounded shadow-xl border border-slate-700 opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-20">
              High uniformity indicates mechanical balance across clauses and predictable grammatical subordination, common in synthetic writing.
            </div>
          </div>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-2xl font-bold font-mono text-white">{metrics.syntacticUniformity}%</span>
          <span className="text-xs text-slate-400">
            {metrics.syntacticUniformity > 60 ? 'Mechanical Balance' : 'Organic Structure'}
          </span>
        </div>
        <div className="mt-2 w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
          <div
            className="h-full bg-amber-500 rounded-full transition-all duration-700"
            style={{ width: `${metrics.syntacticUniformity}%` }}
          />
        </div>
      </div>

      {/* Metric 4: AI Tropes & Clichés */}
      <div className="group relative p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-rose-500/40 transition-all">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-slate-300 font-medium text-xs">
            <Sparkles className="w-4 h-4 text-rose-400" />
            <span>AI Clichés Detected</span>
          </div>
          <div className="relative">
            <HelpCircle className="w-3.5 h-3.5 text-slate-500 hover:text-slate-300 cursor-help" />
            <div className="absolute bottom-full right-0 mb-2 w-56 p-2 bg-slate-800 text-[11px] text-slate-300 rounded shadow-xl border border-slate-700 opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-20">
              Overused hallmark AI words: 'delve', 'testament to', 'crucial role', 'tapestry', 'foster', 'moreover'.
            </div>
          </div>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-2xl font-bold font-mono text-white">{metrics.clicheCount}</span>
          <span className="text-xs text-slate-400">
            {metrics.clicheCount === 0 ? 'Zero AI Tropes' : `${metrics.clicheCount} Flagged Terms`}
          </span>
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
          <span>Avg Length: {avgSentenceLength ? `${avgSentenceLength} words` : 'N/A'}</span>
          <span>Lexical: {lexicalDiversity ? `${Math.round(lexicalDiversity * 100)}%` : 'N/A'}</span>
        </div>
      </div>
    </div>
  );
};
