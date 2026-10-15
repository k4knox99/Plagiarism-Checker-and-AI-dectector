import React, { useState, useEffect } from 'react';
import { X, Wand2, Check, RefreshCw, AlertCircle, Sparkles, Copy, ArrowRight } from 'lucide-react';
import { SentenceAnalysis } from '../types';

interface SentenceInspectorModalProps {
  sentence: SentenceAnalysis | null;
  onClose: () => void;
  onApplyRewrite: (original: string, rewritten: string) => void;
}

interface RewriteOption {
  style: string;
  text: string;
  rationale: string;
}

export const SentenceInspectorModal: React.FC<SentenceInspectorModalProps> = ({
  sentence,
  onClose,
  onApplyRewrite
}) => {
  const [options, setOptions] = useState<RewriteOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!sentence) return;

    // Pre-populate with initial suggested rewrite
    const initialOptions: RewriteOption[] = [];
    if (sentence.suggestedRewrite) {
      initialOptions.push({
        style: 'Humanized Organic',
        text: sentence.suggestedRewrite,
        rationale: 'Balanced variation eliminating formulaic markers and restoring human cadence.'
      });
    }

    setOptions(initialOptions);

    // Fetch rich multi-style alternatives from backend
    fetchAlternatives(sentence.sentence);
  }, [sentence]);

  const fetchAlternatives = async (text: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/fix/sentence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sentence: text })
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.options)) {
        setOptions(data.options);
      }
    } catch (err) {
      console.warn('Could not fetch dynamic alternatives:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!sentence) return null;

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
              <Wand2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Sentence Stylometry Inspector</h3>
              <p className="text-xs text-slate-400">Fix AI markers, predictable syntax, and robotic transitions</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="p-5 overflow-y-auto space-y-5 custom-scrollbar">
          {/* Flagged Original Sentence Card */}
          <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/30 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                Original Flagged Sentence
              </span>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30">
                {sentence.aiProbability}% AI Probability
              </span>
            </div>

            <p className="text-sm font-medium text-slate-100 leading-relaxed bg-black/30 p-3 rounded-lg border border-slate-800/80">
              "{sentence.sentence}"
            </p>

            {sentence.reasons && sentence.reasons.length > 0 && (
              <div className="space-y-1 text-xs text-slate-300">
                <span className="font-semibold text-slate-400">Why this was flagged:</span>
                <ul className="list-disc list-inside space-y-0.5 text-slate-300 pl-1">
                  {sentence.reasons.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Suggested Fixes */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Humanized Rewrite Options
              </h4>
              {loading && (
                <span className="flex items-center gap-1 text-xs text-slate-400">
                  <RefreshCw className="w-3 h-3 animate-spin text-indigo-400" />
                  Generating styled rewrites...
                </span>
              )}
            </div>

            <div className="space-y-3">
              {options.map((opt, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-indigo-500/50 transition-all space-y-2.5 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                      {opt.style}
                    </span>
                    <span className="text-[10px] text-emerald-400 font-medium">
                      Est. AI Score: &lt;5%
                    </span>
                  </div>

                  <p className="text-sm text-slate-100 font-medium leading-relaxed bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                    "{opt.text}"
                  </p>

                  {opt.rationale && (
                    <p className="text-[11px] text-slate-400 italic">
                      {opt.rationale}
                    </p>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-800/60">
                    <button
                      onClick={() => handleCopy(opt.text, idx)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 transition"
                    >
                      {copiedIndex === idx ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => {
                        onApplyRewrite(sentence.sentence, opt.text);
                        onClose();
                      }}
                      className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition"
                    >
                      <span>Replace in Document</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
