import React, { useState } from 'react';
import { 
  RefreshCw, 
  Check, 
  Copy, 
  ArrowRight, 
  Download, 
  CheckCircle2
} from 'lucide-react';
import { FixerStyle, HumanizeResult } from '../types';
import { safeApiFetch } from '../utils/safeApiFetch';
import { runClientSideHumanize } from '../utils/clientForensicEngine';
import {
  PixelSparkle,
  PixelRobot,
  PixelCrown,
  PixelFire,
  PixelPencil,
  PixelShield
} from './PixelStickers';

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
  const [viewMode, setViewMode] = useState<'split' | 'output'>('split');
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
      <div className="p-6 rounded-3xl bg-zinc-950 border-2 border-black shadow-[6px_6px_0px_#000000] space-y-5 bg-pixel-dots">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-bold font-pixel text-white flex items-center gap-2">
              <PixelPencil size={20} />
              <span>Gemini 4 Argon Cadence Humanizer</span>
              <span className="text-xs font-pixel px-2 py-0.5 rounded bg-zinc-900 text-amber-300 border border-black hidden sm:inline">
                ★ Anti-AI Rewrite
              </span>
            </h3>
            <p className="text-xs text-zinc-400">
              Re-architects sentence cadence, swaps predictable n-grams, and removes robotic markers while preserving 100% of facts.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRunHumanizer}
              disabled={isProcessing || !originalText.trim()}
              className="pixel-btn px-5 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-pixel font-bold text-xs sm:text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Re-architecting...</span>
                </>
              ) : (
                <>
                  <PixelSparkle size={18} />
                  <span>Humanize &amp; Fix with Argon</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Style Persona Selectors */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-zinc-300 font-pixel uppercase tracking-wider flex items-center gap-1.5">
            <PixelCrown size={14} />
            <span>Select Writing Persona / Voice:</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {styleOptions.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setStyle(opt.id)}
                className={`p-3.5 rounded-2xl border-2 border-black text-left transition-all flex flex-col justify-between ${
                  style === opt.id
                    ? 'bg-indigo-950 text-white shadow-[3px_3px_0px_#000] translate-x-[-1px] translate-y-[-1px]'
                    : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-850 hover:text-zinc-200 shadow-[2px_2px_0px_#000]'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-base">{opt.icon}</span>
                    <span className="text-xs font-bold font-pixel text-white">{opt.title}</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-snug line-clamp-2">{opt.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Intensity Selector */}
        <div className="flex flex-wrap items-center gap-4 text-xs pt-1">
          <span className="font-bold text-zinc-400 font-pixel flex items-center gap-1.5">
            <PixelFire size={14} />
            <span>Cadence Variance Intensity:</span>
          </span>
          <div className="flex items-center gap-2">
            {(['light', 'moderate', 'aggressive'] as const).map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => setIntensity(lvl)}
                className={`px-3 py-1 rounded-lg capitalize transition text-xs font-pixel font-bold border-2 border-black ${
                  intensity === lvl
                    ? 'bg-zinc-800 text-amber-300 shadow-[2px_2px_0px_#000]'
                    : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200'
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
            <div className="p-4 rounded-2xl bg-zinc-950 border-2 border-black shadow-[3px_3px_0px_#000] space-y-1">
              <span className="text-[11px] font-pixel text-zinc-400 uppercase">AI Score Drop</span>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold font-pixel text-rose-400 line-through">
                  {humanizeResult.beforeAiScore}%
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-zinc-500" />
                <span className="text-2xl font-bold font-pixel text-emerald-400">
                  {humanizeResult.afterAiScore}%
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-950 border-2 border-black shadow-[3px_3px_0px_#000] space-y-1">
              <span className="text-[11px] font-pixel text-zinc-400 uppercase">Burstiness Gain</span>
              <div className="text-2xl font-bold font-pixel text-purple-400">
                +{humanizeResult.burstinessDelta}%
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-950 border-2 border-black shadow-[3px_3px_0px_#000] space-y-1">
              <span className="text-[11px] font-pixel text-zinc-400 uppercase">Tropes Stripped</span>
              <div className="text-2xl font-bold font-pixel text-indigo-400">
                {humanizeResult.clichesRemoved} Tropes
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-950 border-2 border-black shadow-[3px_3px_0px_#000] space-y-1">
              <span className="text-[11px] font-pixel text-zinc-400 uppercase">Authenticity Gain</span>
              <div className="text-2xl font-bold font-pixel text-emerald-400">
                +{humanizeResult.perplexityGain}%
              </div>
            </div>
          </div>

          {/* Action Bar for Humanized Output */}
          <div className="p-4 rounded-2xl bg-zinc-950 border-2 border-black shadow-[4px_4px_0px_#000] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-zinc-300 font-pixel">View Layout:</span>
              <div className="flex items-center bg-zinc-900 p-1 rounded-xl border-2 border-black shadow-[1px_1px_0px_#000] text-xs font-pixel">
                <button
                  onClick={() => setViewMode('split')}
                  className={`px-2.5 py-1 rounded-lg transition font-bold ${viewMode === 'split' ? 'bg-indigo-600 text-white border border-black' : 'text-zinc-400'}`}
                >
                  Side-by-Side
                </button>
                <button
                  onClick={() => setViewMode('output')}
                  className={`px-2.5 py-1 rounded-lg transition font-bold ${viewMode === 'output' ? 'bg-indigo-600 text-white border border-black' : 'text-zinc-400'}`}
                >
                  Output Only
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="pixel-btn px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 text-xs font-pixel font-bold flex items-center gap-1.5 transition border-2 border-black shadow-[2px_2px_0px_#000]"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy Text'}</span>
              </button>
              <button
                onClick={handleDownload}
                className="pixel-btn px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 text-xs font-pixel font-bold flex items-center gap-1.5 transition border-2 border-black shadow-[2px_2px_0px_#000]"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export .txt</span>
              </button>
              <button
                onClick={handleApplyToEditor}
                className="pixel-btn px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-pixel font-bold flex items-center gap-1.5 shadow-[3px_3px_0px_#000] transition"
              >
                {isApplied ? <CheckCircle2 className="w-4 h-4" /> : <PixelSparkle size={16} />}
                <span>{isApplied ? 'Applied & Rescanned!' : 'Apply to Editor'}</span>
              </button>
            </div>
          </div>

          {/* Text Comparison Viewport */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {viewMode === 'split' && (
              <div className="rounded-2xl bg-zinc-950 border-2 border-black shadow-[3px_3px_0px_#000] p-5 space-y-2">
                <div className="flex items-center justify-between text-xs text-zinc-400 font-pixel pb-2 border-b-2 border-zinc-800">
                  <span>Original Document</span>
                  <span className="text-rose-400 font-bold">{humanizeResult.beforeAiScore}% AI Risk</span>
                </div>
                <div className="text-xs text-zinc-300 leading-relaxed max-h-[360px] overflow-y-auto whitespace-pre-wrap font-sans">
                  {originalText}
                </div>
              </div>
            )}

            <div className={`rounded-2xl bg-zinc-950 border-2 border-black shadow-[3px_3px_0px_#000] p-5 space-y-2 ${viewMode === 'output' ? 'lg:col-span-2' : ''}`}>
              <div className="flex items-center justify-between text-xs text-zinc-400 font-pixel pb-2 border-b-2 border-zinc-800">
                <span className="text-emerald-300 font-bold flex items-center gap-1.5">
                  <PixelSparkle size={14} />
                  Argon Humanized Output ({style.toUpperCase()})
                </span>
                <span className="text-emerald-400 font-bold">{humanizeResult.afterAiScore}% AI (Verified)</span>
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
