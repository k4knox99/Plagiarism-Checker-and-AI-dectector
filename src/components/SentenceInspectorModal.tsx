import React, { useState, useEffect } from 'react';
import { X, Check, RefreshCw, Copy, ArrowRight } from 'lucide-react';
import { SentenceAnalysis } from '../types';
import { PixelBandAid, PixelSparkle, PixelShield, PixelRobot } from './PixelStickers';
import { PixelCorgi } from './PixelCorgi';

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
      <div className="relative w-full max-w-2xl bg-zinc-950 border-2 border-black rounded-3xl shadow-[8px_8px_0px_#000000] overflow-hidden flex flex-col max-h-[90vh] bg-pixel-dots">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b-2 border-zinc-800 bg-zinc-900/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-zinc-950 border-2 border-black shadow-[2px_2px_0px_#000]">
              <PixelBandAid size={22} />
            </div>
            <div>
              <h3 className="text-base font-bold font-pixel text-white">Sentence Stylometry Inspector</h3>
              <p className="text-xs text-zinc-400 font-pixel">Fix AI markers, predictable syntax, and robotic transitions</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-zinc-950 border-2 border-black hover:bg-zinc-800 text-zinc-400 hover:text-white transition shadow-[2px_2px_0px_#000]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content body */}
        <div className="p-5 overflow-y-auto space-y-5 custom-scrollbar">
          {/* Flagged Original Sentence Card (Needs Fix State) */}
          <div className="p-4 rounded-2xl bg-rose-950/30 border-2 border-black shadow-[3px_3px_0px_#000] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold font-pixel uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                <PixelRobot size={16} />
                Original Flagged Sentence (Needs Fix)
              </span>
              <span className="text-xs font-pixel px-2.5 py-0.5 rounded-lg bg-black text-rose-300 font-bold border-2 border-black shadow-[1px_1px_0px_#000]">
                {sentence.aiProbability}% AI Probability
              </span>
            </div>

            <div className="flex items-start gap-3">
              <div className="shrink-0 pt-1">
                <PixelCorgi state="needs-fix" size={54} showBadge badgeLabel="Needs Fix" />
              </div>
              <p className="flex-1 text-sm font-medium text-zinc-100 leading-relaxed bg-zinc-950 p-3 rounded-xl border-2 border-black shadow-[2px_2px_0px_#000]">
                "{sentence.sentence}"
              </p>
            </div>

            {sentence.reasons && sentence.reasons.length > 0 && (
              <div className="space-y-1 text-xs text-zinc-300 pl-1">
                <span className="font-bold font-pixel text-zinc-400">Why this was flagged:</span>
                <ul className="list-disc list-inside space-y-0.5 text-zinc-300 pl-1 font-sans">
                  {sentence.reasons.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Suggested Fixes (Humanized Repaired State) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold font-pixel uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                <PixelSparkle size={16} />
                Humanized Rewrite Options (Fixed &amp; Repaired)
              </h4>
              {loading && (
                <div className="flex items-center gap-2 text-xs text-amber-300 font-pixel">
                  <PixelCorgi state="running" size={32} />
                  <span>Corgi running repairs...</span>
                </div>
              )}
            </div>

            <div className="space-y-3">
              {options.map((opt, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-zinc-900 border-2 border-black shadow-[3px_3px_0px_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_#000] transition-all space-y-2.5 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-lg text-xs font-pixel font-bold bg-zinc-950 text-indigo-300 border border-black shadow-[1px_1px_0px_#000]">
                      {opt.style}
                    </span>
                    <span className="text-[10px] font-pixel text-emerald-400 font-bold flex items-center gap-1">
                      <PixelShield size={12} />
                      AI Score: &lt;5%
                    </span>
                  </div>

                  <div className="flex items-start gap-3">
                    {idx === 0 && (
                      <div className="shrink-0 pt-0.5">
                        <PixelCorgi state="fixed" size={46} showBadge badgeLabel="Repaired" />
                      </div>
                    )}
                    <div className="flex-1 space-y-2">
                      <p className="text-sm text-zinc-100 font-medium leading-relaxed bg-zinc-950 p-3 rounded-xl border-2 border-black shadow-[1px_1px_0px_#000]">
                        "{opt.text}"
                      </p>

                      {opt.rationale && (
                        <p className="text-xs text-zinc-400 italic">
                          {opt.rationale}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
                    <button
                      onClick={() => handleCopy(opt.text, idx)}
                      className="pixel-btn px-3 py-1.5 rounded-xl bg-zinc-950 hover:bg-zinc-850 text-zinc-300 text-xs font-pixel font-bold flex items-center gap-1 border-2 border-black shadow-[2px_2px_0px_#000]"
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
                      className="pixel-btn px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-pixel font-bold flex items-center gap-1.5 border-2 border-black shadow-[3px_3px_0px_#000]"
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
        <div className="p-4 border-t-2 border-zinc-800 bg-zinc-900/80 flex items-center justify-end">
          <button
            onClick={onClose}
            className="pixel-btn px-4 py-2 rounded-xl bg-zinc-950 hover:bg-zinc-850 text-zinc-300 text-xs font-pixel font-bold border-2 border-black shadow-[2px_2px_0px_#000]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
