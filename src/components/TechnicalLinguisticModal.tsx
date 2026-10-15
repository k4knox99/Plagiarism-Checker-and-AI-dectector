import React, { useState } from 'react';
import { 
  X, 
  Binary, 
  BarChart3, 
  Cpu, 
  Fingerprint, 
  Hash, 
  FileDown, 
  Layers, 
  Sliders, 
  ShieldCheck, 
  Sparkles,
  Info
} from 'lucide-react';
import { LinguisticMetrics, ShingleMatch } from '../utils/linguisticAnalyzer';
import { ComprehensiveReport } from '../types';
import { exportForensicReportPDF } from '../utils/pdfExport';

interface TechnicalLinguisticModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: ComprehensiveReport;
  linguistics: LinguisticMetrics;
  shingles: ShingleMatch[];
  sourceText: string;
}

export const TechnicalLinguisticModal: React.FC<TechnicalLinguisticModalProps> = ({
  isOpen,
  onClose,
  report,
  linguistics,
  shingles,
  sourceText
}) => {
  const [activeTab, setActiveTab] = useState<'linguistics' | 'shingles'>('linguistics');
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const handleExportPDF = () => {
    setIsExporting(true);
    setTimeout(() => {
      exportForensicReportPDF({
        report,
        linguistics,
        documentTitle: sourceText.slice(0, 50).trim() || 'VeritasAI Forensic Inspection'
      });
      setIsExporting(false);
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-zinc-800 border border-zinc-700/80 flex items-center justify-center shadow-inner">
              <Binary className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-100 font-mono tracking-tight flex items-center gap-2">
                Statistical Linguistics &amp; Shingle Fingerprinting
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-semibold">
                  NLP Diagnostics
                </span>
              </h3>
              <p className="text-[11px] text-zinc-400">
                Mathematical entropy, burstiness variance, and 5-gram Rabin-Karp hashing
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportPDF}
              disabled={isExporting}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow shadow-indigo-600/20"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>{isExporting ? 'Generating PDF...' : 'Export Audit PDF'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-zinc-800 bg-zinc-950/40 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('linguistics')}
            className={`px-4 py-2 rounded-t-xl flex items-center gap-1.5 transition-all ${
              activeTab === 'linguistics'
                ? 'bg-zinc-900 text-white border-t-2 border-indigo-500'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-indigo-400" />
            <span>Statistical Linguistics ({linguistics.totalWords} words)</span>
          </button>
          <button
            onClick={() => setActiveTab('shingles')}
            className={`px-4 py-2 rounded-t-xl flex items-center gap-1.5 transition-all ${
              activeTab === 'shingles'
                ? 'bg-zinc-900 text-white border-t-2 border-purple-500'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Fingerprint className="w-3.5 h-3.5 text-purple-400" />
            <span>5-Gram Shingle Fingerprints ({shingles.length})</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar text-xs text-zinc-300">
          {activeTab === 'linguistics' ? (
            <div className="space-y-6">
              {/* 4 Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {/* Perplexity Proxy */}
                <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1.5">
                  <span className="text-[10px] uppercase font-mono text-zinc-400 block">
                    Perplexity Proxy
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-bold font-mono text-indigo-400">
                      {linguistics.perplexityProxy}
                    </span>
                    <span className="text-[10px] text-zinc-500">/ 100</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-tight">
                    Lexical cross-entropy and predictability across corpus.
                  </p>
                </div>

                {/* Burstiness Variance */}
                <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1.5">
                  <span className="text-[10px] uppercase font-mono text-zinc-400 block">
                    Burstiness Index
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-bold font-mono text-emerald-400">
                      {linguistics.burstinessCoefficient}
                    </span>
                    <span className="text-[10px] text-zinc-500">CV: {linguistics.coefficientOfVariation}</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-tight">
                    Sentence length variance: σ={linguistics.sentenceLengthStdDev}, μ={linguistics.avgSentenceLength}.
                  </p>
                </div>

                {/* Type-Token Ratio (TTR) */}
                <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1.5">
                  <span className="text-[10px] uppercase font-mono text-zinc-400 block">
                    Type-Token Ratio
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-bold font-mono text-amber-400">
                      {linguistics.typeTokenRatio}
                    </span>
                    <span className="text-[10px] text-zinc-500">R: {linguistics.rootTypeTokenRatio}</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-tight">
                    Vocabulary richness: {linguistics.uniqueWords} unique / {linguistics.totalWords} tokens.
                  </p>
                </div>

                {/* Syntactic Uniformity */}
                <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1.5">
                  <span className="text-[10px] uppercase font-mono text-zinc-400 block">
                    Syntactic Uniformity
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-bold font-mono text-purple-400">
                      {linguistics.syntacticUniformityScore}%
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-tight">
                    Parallel clause recurrence and formulaic transition cadence.
                  </p>
                </div>
              </div>

              {/* Explanatory Deep Dive Banner */}
              <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-2">
                <div className="flex items-center gap-2 text-zinc-200 font-semibold font-mono text-xs">
                  <Info className="w-4 h-4 text-indigo-400" />
                  <span>How VeritasAI Calculates Statistical AI Likelihood</span>
                </div>
                <p className="text-zinc-400 leading-relaxed text-[11px]">
                  Large Language Models generate text by choosing statistically probable next tokens, resulting in unnaturally uniform sentence lengths (low burstiness) and predictable transitional collocations. Human authors naturally modulate between short assertions and complex subordinate clauses. VeritasAI cross-evaluates lexical variance (CV = σ/μ), Guiraud's root vocabulary ratio, and N-gram shingle distribution to determine originality.
                </p>
              </div>
            </div>
          ) : (
            /* Shingles Tab */
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-zinc-300">
                    Fingerprint Checksum: <strong className="text-indigo-400 font-mono">0x{linguistics.fingerprintHash}</strong>
                  </span>
                  <span>·</span>
                  <span className="text-zinc-400">
                    Unique Shingle Ratio: <strong className="text-emerald-400">{(linguistics.uniqueShingleRatio * 100).toFixed(1)}%</strong>
                  </span>
                </div>
                <span className="text-[10px] text-zinc-500 font-mono">
                  Algorithm: 32-bit FNV-1a Sliding Window (k=5)
                </span>
              </div>

              {shingles.length === 0 ? (
                <div className="p-8 text-center text-zinc-500 rounded-xl bg-zinc-950 border border-zinc-800">
                  Document has fewer than 5 words. Minimum 5 tokens required for shingling.
                </div>
              ) : (
                <div className="rounded-xl border border-zinc-800 overflow-hidden bg-zinc-950">
                  <div className="max-h-96 overflow-y-auto divide-y divide-zinc-850 custom-scrollbar">
                    {shingles.slice(0, 30).map((shingle, idx) => (
                      <div key={idx} className="p-3 hover:bg-zinc-900/60 transition flex items-center justify-between gap-4">
                        <div className="space-y-0.5 truncate">
                          <span className="font-mono text-[11px] text-zinc-200 block truncate">
                            "{shingle.shingleText}"
                          </span>
                          <span className="text-[10px] text-zinc-500 font-mono">
                            Offset token positions: {shingle.positions.slice(0, 5).join(', ')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="px-2 py-0.5 rounded font-mono text-[10px] bg-zinc-800 text-zinc-300 border border-zinc-700">
                            hash: 0x{shingle.hash}
                          </span>
                          {shingle.occurrences > 1 && (
                            <span className="px-1.5 py-0.5 rounded font-mono text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              {shingle.occurrences}x Duplicate
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
