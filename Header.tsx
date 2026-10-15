import React from 'react';
import { ShieldCheck, Sparkles, FileSearch, Wand2, History, Award, BookOpen, Layers } from 'lucide-react';
import { ScannerMode } from '../types';
import { SAMPLE_TEXTS, SampleText } from '../data/samples';

interface HeaderProps {
  currentMode: ScannerMode;
  onSelectMode: (mode: ScannerMode) => void;
  onSelectSample: (sample: SampleText) => void;
  onOpenHistory: () => void;
  onOpenCertificate: () => void;
  onOpenDeploy?: () => void;
  hasActiveReport: boolean;
  historyCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentMode,
  onSelectMode,
  onSelectSample,
  onOpenHistory,
  onOpenCertificate,
  onOpenDeploy,
  hasActiveReport,
  historyCount
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Branding */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 shadow-md shadow-indigo-500/25">
              <ShieldCheck className="w-5 h-5 text-white" />
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse border-2 border-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight text-white font-mono">
                  Veritas<span className="text-indigo-400">AI</span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-semibold uppercase tracking-wider">
                  v3.8 Flash
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                AI Forensics & Web Plagiarism Checker with Smart Humanizer
              </p>
            </div>
          </div>

          {/* Mode Navigation Pills */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => onSelectMode('comprehensive')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                currentMode === 'comprehensive'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Deep Scan</span>
            </button>
            <button
              onClick={() => onSelectMode('ai')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                currentMode === 'ai'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Detector</span>
            </button>
            <button
              onClick={() => onSelectMode('plagiarism')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                currentMode === 'plagiarism'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <FileSearch className="w-3.5 h-3.5" />
              <span>Plagiarism</span>
            </button>
            <button
              onClick={() => onSelectMode('fixer')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                currentMode === 'fixer'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-sm'
                  : 'text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10'
              }`}
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>Humanizer Fixer</span>
            </button>
          </nav>

          {/* Quick Presets & Utility Actions */}
          <div className="flex items-center gap-2">
            {/* Quick Sample Text Picker */}
            <div className="relative group">
              <button
                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium border border-slate-800 flex items-center gap-1.5 transition"
              >
                <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden sm:inline">Load Sample</span>
              </button>
              <div className="absolute right-0 top-full mt-1.5 w-64 p-2 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all z-50 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 px-2 py-1 block">
                  Test With Ready-Made Samples
                </span>
                {SAMPLE_TEXTS.map((sample) => (
                  <button
                    key={sample.id}
                    onClick={() => onSelectSample(sample)}
                    className="w-full text-left p-2 rounded-xl hover:bg-slate-800 transition text-xs space-y-0.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white">{sample.title}</span>
                      <span className="text-[10px] font-mono text-indigo-400">{sample.badge}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-1">{sample.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Certificate Modal Trigger */}
            {hasActiveReport && (
              <button
                onClick={onOpenCertificate}
                className="px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 text-xs font-semibold flex items-center gap-1.5 transition shadow"
              >
                <Award className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Certificate</span>
              </button>
            )}

            {/* Vercel Deploy Trigger */}
            {onOpenDeploy && (
              <button
                onClick={onOpenDeploy}
                className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-medium border border-slate-800 flex items-center gap-1.5 transition shadow-sm"
                title="Vercel Deployment Guide"
              >
                <svg viewBox="0 0 1155 1000" className="w-3 h-3 fill-white" aria-hidden="true">
                  <path d="m577.3 0 577.4 1000H0z" />
                </svg>
                <span className="hidden lg:inline text-[11px] font-semibold">Deploy</span>
              </button>
            )}

            {/* History Drawer Trigger */}
            <button
              onClick={onOpenHistory}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs border border-slate-800 relative transition"
              title="Audit History"
            >
              <History className="w-4 h-4" />
              {historyCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center font-mono">
                  {historyCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Subnav for Modes */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-800/60 overflow-x-auto gap-1">
          <button
            onClick={() => onSelectMode('comprehensive')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap ${
              currentMode === 'comprehensive' ? 'bg-indigo-600 text-white' : 'text-slate-400'
            }`}
          >
            Deep Scan
          </button>
          <button
            onClick={() => onSelectMode('ai')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap ${
              currentMode === 'ai' ? 'bg-indigo-600 text-white' : 'text-slate-400'
            }`}
          >
            AI Detector
          </button>
          <button
            onClick={() => onSelectMode('plagiarism')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap ${
              currentMode === 'plagiarism' ? 'bg-indigo-600 text-white' : 'text-slate-400'
            }`}
          >
            Plagiarism
          </button>
          <button
            onClick={() => onSelectMode('fixer')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap ${
              currentMode === 'fixer' ? 'bg-indigo-600 text-white' : 'text-indigo-400'
            }`}
          >
            Fixer Studio
          </button>
        </div>
      </div>
    </header>
  );
};
