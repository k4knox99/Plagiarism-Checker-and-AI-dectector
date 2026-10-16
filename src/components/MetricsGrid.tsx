import React from 'react';
import { HelpCircle } from 'lucide-react';
import { MetricData } from '../types';
import { PixelPotion, PixelFire, PixelDoc, PixelSparkle } from './PixelStickers';

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
    if (val < 35) return { label: 'Predictable (AI)', bg: 'bg-rose-950/80', color: 'text-rose-300' };
    if (val < 65) return { label: 'Moderate Entropy', bg: 'bg-amber-950/80', color: 'text-amber-300' };
    return { label: 'High Entropy (Human)', bg: 'bg-emerald-950/80', color: 'text-emerald-300' };
  };

  const getBurstinessStatus = (val: number) => {
    if (val < 35) return { label: 'Uniform Cadence (AI)', bg: 'bg-rose-950/80', color: 'text-rose-300' };
    if (val < 65) return { label: 'Balanced Variance', bg: 'bg-amber-950/80', color: 'text-amber-300' };
    return { label: 'High Burstiness (Human)', bg: 'bg-emerald-950/80', color: 'text-emerald-300' };
  };

  const perpStatus = getPerplexityStatus(metrics.perplexityScore);
  const burstStatus = getBurstinessStatus(metrics.burstinessScore);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
      {/* Metric 1: Perplexity */}
      <div className="group relative p-4 rounded-xl bg-zinc-950 border-2 border-black shadow-[3px_3px_0px_#000000] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_#000000] transition-all flex flex-col justify-between gap-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-zinc-200 font-pixel font-bold text-xs">
            <PixelPotion size={16} />
            <span>Perplexity Entropy</span>
          </div>
          <div className="relative">
            <HelpCircle className="w-3.5 h-3.5 text-zinc-500 hover:text-zinc-300 cursor-help" />
            <div className="absolute bottom-full right-0 mb-2 w-56 p-2 bg-zinc-900 border-2 border-black shadow-[3px_3px_0px_#000] text-[11px] text-zinc-300 rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-30 font-sans">
              Measures how predictable words are. Large Language Models tend to select statistically predictable tokens, resulting in lower perplexity.
            </div>
          </div>
        </div>

        <div>
          <span className="text-2xl font-bold font-pixel text-white block tracking-tight">
            {metrics.perplexityScore}<span className="text-xs text-zinc-500 font-normal">/100</span>
          </span>
        </div>

        <div>
          <span className={`inline-flex self-start px-2 py-0.5 rounded-md text-[10px] font-pixel font-bold border-2 border-black shadow-[1px_1px_0px_#000] ${perpStatus.bg} ${perpStatus.color}`}>
            {perpStatus.label}
          </span>
        </div>

        <div className="w-full bg-zinc-900 h-2 rounded-none pixel-meter overflow-hidden mt-1">
          <div
            className="h-full bg-indigo-500 transition-all duration-700"
            style={{ width: `${Math.max(5, Math.min(100, metrics.perplexityScore))}%` }}
          />
        </div>
      </div>

      {/* Metric 2: Burstiness */}
      <div className="group relative p-4 rounded-xl bg-zinc-950 border-2 border-black shadow-[3px_3px_0px_#000000] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_#000000] transition-all flex flex-col justify-between gap-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-zinc-200 font-pixel font-bold text-xs">
            <PixelFire size={16} />
            <span>Burstiness Variance</span>
          </div>
          <div className="relative">
            <HelpCircle className="w-3.5 h-3.5 text-zinc-500 hover:text-zinc-300 cursor-help" />
            <div className="absolute bottom-full right-0 mb-2 w-56 p-2 bg-zinc-900 border-2 border-black shadow-[3px_3px_0px_#000] text-[11px] text-zinc-300 rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-30 font-sans">
              Measures sentence length & structure variation. Humans alternate between short punches and long descriptive clauses. AI models produce uniform lengths.
            </div>
          </div>
        </div>

        <div>
          <span className="text-2xl font-bold font-pixel text-white block tracking-tight">
            {metrics.burstinessScore}<span className="text-xs text-zinc-500 font-normal">/100</span>
          </span>
        </div>

        <div>
          <span className={`inline-flex self-start px-2 py-0.5 rounded-md text-[10px] font-pixel font-bold border-2 border-black shadow-[1px_1px_0px_#000] ${burstStatus.bg} ${burstStatus.color}`}>
            {burstStatus.label}
          </span>
        </div>

        <div className="w-full bg-zinc-900 h-2 rounded-none pixel-meter overflow-hidden mt-1">
          <div
            className="h-full bg-purple-500 transition-all duration-700"
            style={{ width: `${Math.max(5, Math.min(100, metrics.burstinessScore))}%` }}
          />
        </div>
      </div>

      {/* Metric 3: Syntactic Uniformity */}
      <div className="group relative p-4 rounded-xl bg-zinc-950 border-2 border-black shadow-[3px_3px_0px_#000000] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_#000000] transition-all flex flex-col justify-between gap-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-zinc-200 font-pixel font-bold text-xs">
            <PixelDoc size={16} />
            <span>Syntax Uniformity</span>
          </div>
          <div className="relative">
            <HelpCircle className="w-3.5 h-3.5 text-zinc-500 hover:text-zinc-300 cursor-help" />
            <div className="absolute bottom-full right-0 mb-2 w-56 p-2 bg-zinc-900 border-2 border-black shadow-[3px_3px_0px_#000] text-[11px] text-zinc-300 rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-30 font-sans">
              High uniformity indicates mechanical balance across clauses and predictable grammatical subordination, common in synthetic writing.
            </div>
          </div>
        </div>

        <div>
          <span className="text-2xl font-bold font-pixel text-white block tracking-tight">
            {metrics.syntacticUniformity}%
          </span>
        </div>

        <div>
          <span className={`inline-flex self-start px-2 py-0.5 rounded-md text-[10px] font-pixel font-bold border-2 border-black shadow-[1px_1px_0px_#000] ${
            metrics.syntacticUniformity > 60
              ? 'bg-rose-950/80 text-rose-300'
              : 'bg-emerald-950/80 text-emerald-300'
          }`}>
            {metrics.syntacticUniformity > 60 ? 'Mechanical Balance' : 'Organic Cadence'}
          </span>
        </div>

        <div className="w-full bg-zinc-900 h-2 rounded-none pixel-meter overflow-hidden mt-1">
          <div
            className="h-full bg-amber-500 transition-all duration-700"
            style={{ width: `${Math.max(5, Math.min(100, metrics.syntacticUniformity))}%` }}
          />
        </div>
      </div>

      {/* Metric 4: AI Tropes & Clichés */}
      <div className="group relative p-4 rounded-xl bg-zinc-950 border-2 border-black shadow-[3px_3px_0px_#000000] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_#000000] transition-all flex flex-col justify-between gap-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-zinc-200 font-pixel font-bold text-xs">
            <PixelSparkle size={16} />
            <span>AI Clichés</span>
          </div>
          <div className="relative">
            <HelpCircle className="w-3.5 h-3.5 text-zinc-500 hover:text-zinc-300 cursor-help" />
            <div className="absolute bottom-full right-0 mb-2 w-56 p-2 bg-zinc-900 border-2 border-black shadow-[3px_3px_0px_#000] text-[11px] text-zinc-300 rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-30 font-sans">
              Overused hallmark AI words: 'delve', 'testament to', 'crucial role', 'tapestry', 'foster', 'moreover'.
            </div>
          </div>
        </div>

        <div>
          <span className="text-2xl font-bold font-pixel text-white block tracking-tight">
            {metrics.clicheCount}
          </span>
        </div>

        <div>
          <span className={`inline-flex self-start px-2 py-0.5 rounded-md text-[10px] font-pixel font-bold border-2 border-black shadow-[1px_1px_0px_#000] ${
            metrics.clicheCount === 0
              ? 'bg-emerald-950/80 text-emerald-300'
              : 'bg-rose-950/80 text-rose-300'
          }`}>
            {metrics.clicheCount === 0 ? 'Zero AI Tropes' : `${metrics.clicheCount} Flagged Tropes`}
          </span>
        </div>

        <div className="flex items-center justify-between text-[11px] font-pixel text-zinc-400 pt-1 border-t border-zinc-800">
          <span>Avg: {avgSentenceLength ? `${avgSentenceLength}w` : '15w'}</span>
          <span>Lexical: {lexicalDiversity ? `${Math.round(lexicalDiversity * 100)}%` : '62%'}</span>
        </div>
      </div>
    </div>
  );
};
