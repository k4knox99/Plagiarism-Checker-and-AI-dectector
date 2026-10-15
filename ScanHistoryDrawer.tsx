import React from 'react';
import { X, History, Trash2, ArrowRight, ShieldCheck, AlertCircle, FileText } from 'lucide-react';
import { ComprehensiveReport } from '../types';

interface ScanHistoryDrawerProps {
  history: ComprehensiveReport[];
  isOpen: boolean;
  onClose: () => void;
  onSelectHistoryItem: (report: ComprehensiveReport) => void;
  onClearHistory: () => void;
}

export const ScanHistoryDrawer: React.FC<ScanHistoryDrawerProps> = ({
  history,
  isOpen,
  onClose,
  onSelectHistoryItem,
  onClearHistory
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-400" />
            <h3 className="text-sm font-bold text-white">Scan History ({history.length})</h3>
          </div>
          <div className="flex items-center gap-2">
            {history.length > 0 && (
              <button
                onClick={onClearHistory}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition text-xs flex items-center gap-1"
                title="Clear all history"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="text-[11px]">Clear</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="p-4 flex-1 overflow-y-auto space-y-3 custom-scrollbar">
          {history.length === 0 ? (
            <div className="py-20 text-center space-y-2 text-slate-500">
              <History className="w-8 h-8 mx-auto opacity-40" />
              <p className="text-xs">No previous scans found yet.</p>
              <p className="text-[11px] text-slate-600">Your audit reports will be cached locally.</p>
            </div>
          ) : (
            history.map((item, idx) => {
              const previewText = item.originalText.slice(0, 90).trim() + '...';
              return (
                <div
                  key={idx}
                  onClick={() => {
                    onSelectHistoryItem(item);
                    onClose();
                  }}
                  className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-indigo-500/50 cursor-pointer transition space-y-2 group"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-mono text-[11px]">{item.scannedAt}</span>
                    <span className="font-mono font-bold text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                      {item.compositeAuthenticity}% Authentic
                    </span>
                  </div>

                  <p className="text-xs text-slate-200 line-clamp-2 leading-relaxed">
                    "{previewText}"
                  </p>

                  <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-slate-900 text-slate-400">
                    <div className="flex items-center gap-3 font-mono">
                      <span className={item.aiAnalysis.overallAiScore > 50 ? 'text-rose-400' : 'text-emerald-400'}>
                        {item.aiAnalysis.overallAiScore}% AI
                      </span>
                      <span>·</span>
                      <span className={item.plagiarismAnalysis.similarityScore > 20 ? 'text-rose-400' : 'text-emerald-400'}>
                        {item.plagiarismAnalysis.similarityScore}% Plag
                      </span>
                    </div>

                    <span className="text-indigo-400 group-hover:translate-x-1 transition-transform flex items-center gap-0.5 text-xs">
                      <span>Restore</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
