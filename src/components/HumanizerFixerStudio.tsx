import React, { useState } from 'react';
import { Wand2, RefreshCw, Check, Copy, ArrowRight, Download, Sparkles, ShieldCheck, Zap, Sliders, Split, Eye } from 'lucide-react';
import { FixerStyle, HumanizeResult } from '../types';

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
      desc: 'Engineered specifically to bypass Turnitin, GPTZero & Copyleaks',
      icon: '🛡️'
    }
  ];

  const handleRunHumanizer = async () => {
    if (!originalText || originalText.trim().length < 10) return;

    setIsProcessing(true);
    try {
      const res = await fetch('/api/fix/humanize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: originalText,
          mode: style,
          intensity
        })
      });

      const data = await res.json();
      if (data.success && data.result) {
        setHumanizeResult(data.result);
      }
    } catch (err) {
      console.error('Humanizer error:', err);
    } finally {
      setIsProcessing(false);
    }
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
    <div className="space-y-6">
      {/* Configuration Bar */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-indigo-400" />
              <span>Smart AI Humanizer & Fixer Engine</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Re-architects cadence, swaps predictable n-grams, and removes robotic markers while preserving 100% of facts.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRunHumanizer}
              disabled={isProcessing || !originalText.trim()}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-sm flex items-center gap-2 shadow-lg shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition transform active:scale-95"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Humanizing & Re-engineering...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Humanize & Fix All</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Style Persona Selectors */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <span>Select Target Human Voice Persona:</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
            {styleOptions.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setStyle(opt.id)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  style === opt.id
                    ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md shadow-indigo-500/10'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2 font-semibold text-xs text-white">
                  <span>{opt.icon}</span>
                  <span>{opt.title}</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {opt.desc}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Intensity Selector */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Sliders className="w-3.5 h-3.5" />
              <span>Rewrite Intensity:</span>
            </span>
            <div className="inline-flex rounded-lg bg-slate-950 p-1 border border-slate-800">
              {(['light', 'moderate', 'aggressive'] as const).map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setIntensity(lvl)}
                  className={`px-3 py-1 rounded-md text-xs font-medium capitalize transition ${
                    intensity === lvl
                      ? 'bg-slate-800 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          <span className="text-xs text-slate-500">
            Target AI Output: <strong className="text-emerald-400 font-mono">&lt;5% AI</strong>
          </span>
        </div>
      </div>

      {/* Results & Comparison View */}
      {humanizeResult ? (
        <div className="space-y-4 animate-in fade-in duration-300">
          {/* Prediction Impact Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/50 via-slate-900 to-indigo-950/50 border border-emerald-500/40 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">
                  Humanization Complete & Verified
                </h4>
                <p className="text-xs text-slate-300 mt-0.5">
                  {humanizeResult.summaryOfImprovements || 'Syntactic cadence randomized, AI transitional tropes eliminated.'}
                </p>
              </div>
            </div>

            {/* Score Drop Indicator */}
            <div className="flex items-center gap-4 bg-black/40 px-4 py-2 rounded-xl border border-slate-800">
              <div className="text-center">
                <span className="text-[10px] text-slate-400 uppercase block">Before</span>
                <span className="font-mono text-sm font-bold text-rose-400">{initialAiScore}% AI</span>
              </div>
              <ArrowRight className="w-4 h-4 text-emerald-400" />
              <div className="text-center">
                <span className="text-[10px] text-slate-400 uppercase block">After</span>
                <span className="font-mono text-sm font-bold text-emerald-400">
                  {humanizeResult.predictedAiScore}% AI
                </span>
              </div>
            </div>
          </div>

          {/* View Mode Tabs & Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex rounded-xl bg-slate-900 p-1 border border-slate-800">
              <button
                onClick={() => setViewMode('split')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                  viewMode === 'split' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Split className="w-3.5 h-3.5" />
                <span>Side-by-Side</span>
              </button>
              <button
                onClick={() => setViewMode('output')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                  viewMode === 'output' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Clean Fixed Text</span>
              </button>
              {humanizeResult.changes?.length > 0 && (
                <button
                  onClick={() => setViewMode('diff')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                    viewMode === 'diff' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Transformations ({humanizeResult.changes.length})</span>
                </button>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 border border-slate-700 transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
              <button
                onClick={handleDownload}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 border border-slate-700 transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export .TXT</span>
              </button>
              <button
                onClick={() => onRequestReScan(humanizeResult.rewrittenText)}
                className="px-3.5 py-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Verify with Live Scanner</span>
              </button>
              <button
                onClick={() => onApplyFixedTextToMain(humanizeResult.rewrittenText)}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Apply to Document</span>
              </button>
            </div>
          </div>

          {/* View Content */}
          {viewMode === 'split' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Original */}
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="text-xs font-semibold uppercase text-slate-400">Original Document</span>
                  <span className="text-xs font-mono text-rose-400 font-semibold">{initialAiScore}% AI Risk</span>
                </div>
                <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto custom-scrollbar p-2">
                  {originalText}
                </div>
              </div>

              {/* Humanized */}
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-emerald-500/30 shadow-lg space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="text-xs font-semibold uppercase text-emerald-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Humanized & Fixed
                  </span>
                  <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                    {humanizeResult.predictedAiScore}% AI
                  </span>
                </div>
                <div className="text-slate-100 text-sm leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto custom-scrollbar p-2 font-medium">
                  {humanizeResult.rewrittenText}
                </div>
              </div>
            </div>
          )}

          {viewMode === 'output' && (
            <div className="p-5 rounded-2xl bg-slate-900 border border-emerald-500/30 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                  Full Clean Humanized Text
                </span>
                <span className="text-xs font-mono text-slate-400">
                  {humanizeResult.rewrittenText.split(/\s+/).filter(Boolean).length} words
                </span>
              </div>
              <div className="text-slate-100 text-base leading-relaxed whitespace-pre-wrap p-2 select-all">
                {humanizeResult.rewrittenText}
              </div>
            </div>
          )}

          {viewMode === 'diff' && (
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Linguistic Transformations & Replaced Clichés ({humanizeResult.changes.length})
              </h4>
              <div className="space-y-2.5 max-h-96 overflow-y-auto custom-scrollbar">
                {humanizeResult.changes.map((chg, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1.5">
                    <div className="flex items-center gap-2 text-slate-400">
                      <span className="text-[10px] uppercase font-bold text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded">Replaced</span>
                      <span className="line-through text-slate-400 italic">"{chg.originalSnippet}"</span>
                    </div>
                    <div className="flex items-center gap-2 text-emerald-300">
                      <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">With</span>
                      <span className="font-medium text-emerald-200">"{chg.rewrittenSnippet}"</span>
                    </div>
                    {chg.reason && (
                      <p className="text-[11px] text-slate-500 italic pl-1">
                        Rationale: {chg.reason}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Empty state / Prompt to run */
        <div className="p-10 text-center rounded-2xl bg-slate-900/40 border border-dashed border-slate-800 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
            <Wand2 className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-semibold text-slate-200">Ready to Humanize Your Document</h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Choose your desired voice persona above and click "Humanize & Fix All" to eliminate AI markers and lower plagiarism probability with authentic cadence.
          </p>
        </div>
      )}
    </div>
  );
};
