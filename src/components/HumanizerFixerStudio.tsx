import React, { useState } from 'react';
import { 
  Wand2, 
  RefreshCw, 
  Check, 
  Copy, 
  ArrowRight, 
  Download, 
  Sparkles, 
  ShieldCheck, 
  Zap, 
  CheckCircle2, 
  ArrowUpRight,
  Split, 
  Eye 
} from 'lucide-react';
import { FixerStyle, HumanizeResult } from '../types';
import { safeApiFetch } from '../utils/safeApiFetch';
import { runClientSideHumanize } from '../utils/clientForensicEngine';

interface HumanizerFixerStudioProps {
  originalText: string;
  initialAiScore?: number;
  onApplyFixedTextToMain: (text: string) => void;
  onRequestReScan: (text: string) => void;
}

export const HumanizerFixerStudio: React.FC<HumanizerFixerStudioProps> = ({
  originalText,
  initialAiScore = 85,
  onApplyFixedTextToMain,
  onRequestReScan
}) => {
  const [style, setStyle] = useState<FixerStyle>('academic');
  const [intensity, setIntensity] = useState<'light' | 'moderate' | 'aggressive'>('moderate');
  const [isProcessing, setIsProcessing] = useState(false);
  const [humanizeResult, setHumanizeResult] = useState<HumanizeResult | null>(null);
  const [viewMode, setViewMode] = useState<'split' | 'output' | 'diff'>('split');
  const [copied, setCopied] = useState(false);
  const [isApplied, setIsApplied] = useState(false);

  const styleOptions: Array<{ id: FixerStyle; title: string; desc: string; icon: string }> = [
    {
      id: 'academic',
      title: 'Academic Scholar',
      desc: 'Eliminates formulaic transitions, enhances scholarly nuance & sentence variety',
      icon: '🎓'
    },
    {
      id: 'conversational',
      title: 'Conversational Voice',
      desc: 'Punchy cadence, natural idiom, active verbs, and personal perspective',
      icon: '💬'
    },
    {
      id: 'professional',
      title: 'Executive & Business',
      desc: 'Cuts AI corporate fluff, makes points decisive, clear, and actionable',
      icon: '💼'
    },
    {
      id: 'creative',
      title: 'Creative Voice',
      desc: 'High burstiness, dynamic metaphors, authentic rhythm',
      icon: '✨'
    },
    {
      id: 'stealth',
      title: 'Anti-AI Stealth',
      desc: 'Engineered specifically to bypass Turnitin, GPTZero & Copyleaks (<5% AI)',
      icon: '🛡️'
    }
  ];

  const handleRunHumanizer = async () => {
    if (!originalText || originalText.trim().length < 10) return;

    setIsProcessing(true);
    setIsApplied(false);

    try {
      const res = await safeApiFetch('/api/fix/humanize', {
        method: 'POST',
        body: JSON.stringify({
          text: originalText,
          mode: style,
          intensity
        })
      }, 9000);

      if (res.success && res.data?.result) {
        setHumanizeResult(res.data.result);
      } else {
        // Deterministic Client-Side Gemini 4 Argon Humanizer
        const fallbackResult = runClientSideHumanize(originalText, style, intensity);
        setHumanizeResult(fallbackResult);
      }
    } catch {
      const fallbackResult = runClientSideHumanize(originalText, style, intensity);
      setHumanizeResult(fallbackResult);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApplyToEditor = () => {
    if (!humanizeResult?.rewrittenText) return;
    onApplyFixedTextToMain(humanizeResult.rewrittenText);
    onRequestReScan(humanizeResult.rewrittenText);
    setIsApplied(true);
    setTimeout(() => setIsApplied(false), 3500);
  };

  const handleCopy = () => {
    if (!humanizeResult?.rewrittenText) return;
    navigator.clipboard.writeText(humanizeResult.rewrittenText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!humanizeResult?.rewrittenText) return;
    const blob = new Blob([humanizeResult.rewrittenText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `humanized-text-${style}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Configuration Bar */}
      <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-4 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-indigo-400" />
              <span>Gemini 4 Argon Humanizer &amp; Cadence Re-Architect</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Re-architects cadence, swaps predictable n-grams, and removes robotic markers while preserving 100% of factual context.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRunHumanizer}
              disabled={isProcessing || !originalText.trim()}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition transform active:scale-95"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Humanizing &amp; Re-engineering...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>✨ Humanize &amp; Fix with Argon</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Style Persona Selectors */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5 font-mono">
            <span>Select Writing Persona / Voice:</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
            {styleOptions.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setStyle(opt.id)}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  style === opt.id
                    ? 'bg-indigo-950/40 border-indigo-500 text-white shadow-md shadow-indigo-500/10'
                    : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-base">{opt.icon}</span>
                    <span className="text-xs font-bold">{opt.title}</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-snug line-clamp-2">{opt.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Intensity Selector */}
        <div className="flex items-center gap-4 text-xs pt-1">
          <span className="font-semibold text-zinc-400 font-mono">Cadence Variance Intensity:</span>
          <div className="flex items-center gap-2">
            {(['light', 'moderate', 'aggressive'] as const).map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => setIntensity(lvl)}
                className={`px-3 py-1 rounded-lg capitalize transition text-xs font-medium ${
                  intensity === lvl
                    ? 'bg-zinc-800 text-indigo-300 border border-indigo-500/40 font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Humanized Results Panel */}
      {humanizeResult && (
        <div className="space-y-4">
          {/* Telemetry Delta Highlights */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-1">
              <span className="text-[11px] font-mono text-zinc-400 uppercase">AI Score Drop</span>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold font-mono text-rose-400 line-through">
                  {humanizeResult.beforeAiScore}%
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-zinc-500" />
                <span className="text-2xl font-bold font-mono text-emerald-400">
                  {humanizeResult.afterAiScore}%
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-1">
              <span className="text-[11px] font-mono text-zinc-400 uppercase">Burstiness Gain</span>
              <div className="text-2xl font-bold font-mono text-purple-400">
                +{humanizeResult.burstinessDelta}%
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-1">
              <span className="text-[11px] font-mono text-zinc-400 uppercase">Clichés Stripped</span>
              <div className="text-2xl font-bold font-mono text-indigo-400">
                {humanizeResult.clichesRemoved} Tropes
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-1">
              <span className="text-[11px] font-mono text-zinc-400 uppercase">Authenticity Gain</span>
              <div className="text-2xl font-bold font-mono text-emerald-400">
                +{humanizeResult.perplexityGain}%
              </div>
            </div>
          </div>

          {/* Action Bar for Humanized Output */}
          <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-zinc-300 font-mono">View Layout:</span>
              <div className="flex items-center bg-zinc-950 p-1 rounded-lg border border-zinc-800 text-xs">
                <button
                  onClick={() => setViewMode('split')}
                  className={`px-2.5 py-1 rounded transition ${viewMode === 'split' ? 'bg-indigo-600 text-white' : 'text-zinc-400'}`}
                >
                  Side-by-Side
                </button>
                <button
                  onClick={() => setViewMode('output')}
                  className={`px-2.5 py-1 rounded transition ${viewMode === 'output' ? 'bg-indigo-600 text-white' : 'text-zinc-400'}`}
                >
                  Output Only
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium flex items-center gap-1.5 transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy Text'}</span>
              </button>
              <button
                onClick={handleDownload}
                className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium flex items-center gap-1.5 transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export .txt</span>
              </button>
              <button
                onClick={handleApplyToEditor}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-600/30 transition transform active:scale-95"
              >
                {isApplied ? <CheckCircle2 className="w-4 h-4 text-white" /> : <Sparkles className="w-4 h-4 text-white" />}
                <span>{isApplied ? 'Applied & Rescanned!' : 'Apply Humanized Text to Editor'}</span>
              </button>
            </div>
          </div>

          {/* Text Comparison Viewport */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {viewMode === 'split' && (
              <div className="rounded-xl bg-zinc-950/70 border border-zinc-800 p-4 space-y-2">
                <div className="flex items-center justify-between text-xs text-zinc-400 font-mono pb-2 border-b border-zinc-800">
                  <span>Original Document</span>
                  <span className="text-rose-400 font-bold">{humanizeResult.beforeAiScore}% AI Risk</span>
                </div>
                <div className="text-xs text-zinc-300 leading-relaxed max-h-[360px] overflow-y-auto whitespace-pre-wrap font-sans">
                  {originalText}
                </div>
              </div>
            )}

            <div className={`rounded-xl bg-emerald-950/10 border border-emerald-500/30 p-4 space-y-2 ${viewMode === 'output' ? 'lg:col-span-2' : ''}`}>
              <div className="flex items-center justify-between text-xs text-zinc-400 font-mono pb-2 border-b border-emerald-500/20">
                <span className="text-emerald-300 font-bold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  Argon Humanized Output ({style.toUpperCase()})
                </span>
                <span className="text-emerald-400 font-bold">{humanizeResult.afterAiScore}% AI (Passing)</span>
              </div>
              <div className="text-xs text-zinc-100 leading-relaxed max-h-[360px] overflow-y-auto whitespace-pre-wrap font-sans">
                {humanizeResult.rewrittenText}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
