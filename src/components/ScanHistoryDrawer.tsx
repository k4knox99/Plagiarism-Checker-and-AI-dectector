import React from 'react';
import { X, Trash2, ArrowRight } from 'lucide-react';
import { ComprehensiveReport } from '../types';
import { PixelDoc, PixelShield } from './PixelStickers';

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
    <div className="fixed inset-0 z-50 flex justify-end bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md bg-zinc-950 border-l-2 border-black h-full flex flex-col shadow-[-8px_0px_0px_#000] animate-in slide-in-from-right duration-200 bg-pixel-dots">
        {/* Header */}
        <div className="p-4 border-b-2 border-zinc-800 flex items-center justify-between bg-zinc-900/90">
          <div className="flex items-center gap-2.5">
            <PixelDoc size={20} />
            <h3 className="text-sm font-bold font-pixel text-white">Scan History ({history.length})</h3>
          </div>
          <div className="flex items-center gap-2">
            {history.length > 0 && (
              <button
                onClick={onClearHistory}
                className="pixel-btn p-1.5 rounded-lg bg-zinc-950 border border-black text-zinc-400 hover:text-rose-400 transition text-xs flex items-center gap-1"
                title="Clear all history"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="text-[10px] font-pixel">Clear</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-zinc-950 border border-black text-zinc-400 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="p-4 flex-1 overflow-y-auto space-y-3 custom-scrollbar">
          {history.length === 0 ? (
            <div className="py-20 text-center space-y-2 text-zinc-500">
              <PixelDoc size={36} className="mx-auto opacity-40" />
              <p className="text-xs font-pixel">No previous scans found yet.</p>
              <p className="text-[11px] text-zinc-600 font-pixel">Your audit reports will be cached locally.</p>
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
                  className="p-3.5 rounded-2xl bg-zinc-900 border-2 border-black shadow-[3px_3px_0px_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_#000] cursor-pointer transition space-y-2 group"
                >
                  <div className="flex items-center justify-between text-xs font-pixel">
                    <span className="text-zinc-400 text-[10px]">{item.scannedAt}</span>
                    <span className="font-bold text-[10px] px-2 py-0.5 rounded-lg bg-zinc-950 text-indigo-300 border border-black shadow-[1px_1px_0px_#000] flex items-center gap-1">
                      <PixelShield size={10} />
                      {item.compositeAuthenticity}% Authentic
                    </span>
                  </div>

                  <p className="text-xs text-zinc-200 line-clamp-2 leading-relaxed font-sans">
                    "{previewText}"
                  </p>

                  <div className="flex items-center justify-between text-[11px] pt-2 border-t border-zinc-800 text-zinc-400 font-pixel">
                    <div className="flex items-center gap-2 text-[10px]">
                      <span className={item.aiAnalysis.overallAiScore > 50 ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                        {item.aiAnalysis.overallAiScore}% AI
                      </span>
                      <span>·</span>
                      <span className={item.plagiarismAnalysis.similarityScore > 20 ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                        {item.plagiarismAnalysis.similarityScore}% Plag
                      </span>
                    </div>

                    <span className="text-indigo-400 group-hover:translate-x-1 transition-transform flex items-center gap-0.5 text-[10px] font-bold">
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
