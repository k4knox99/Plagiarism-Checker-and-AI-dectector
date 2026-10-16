import React from 'react';
import { 
  ShieldCheck, 
  Sparkles, 
  FileSearch, 
  Wand2, 
  History, 
  BookOpen, 
  Layers,
  FileDown,
  Binary,
  Fingerprint,
  Home,
  LayoutDashboard,
  FileCheck2
} from 'lucide-react';
import { ScannerMode } from '../types';
import { SAMPLE_TEXTS, SampleText } from '../data/samples';
import { useAuth } from '../context/AuthContext';
import { getCurrentUser } from '../utils/authStorage';
import { 
  PixelRobot, 
  PixelDoc, 
  PixelHeart, 
  PixelSparkle, 
  PixelSearch, 
  PixelBandAid, 
  PixelShield 
} from './PixelStickers';

interface HeaderProps {
  currentMode: ScannerMode;
  onSelectMode: (mode: ScannerMode) => void;
  onSelectSample: (sample: SampleText) => void;
  onOpenHistory: () => void;
  onOpenCertificate: () => void;
  onOpenLinguistics: () => void;
  onExportPDF: () => void;
  onOpenAuth: () => void;
  hasActiveReport: boolean;
  historyCount: number;
  is3DCoreVisible: boolean;
  onToggle3DCore: () => void;
  activeView?: 'landing' | 'workspace';
  onToggleView?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentMode,
  onSelectMode,
  onSelectSample,
  onOpenHistory,
  onOpenCertificate,
  onOpenLinguistics,
  onExportPDF,
  onOpenAuth,
  hasActiveReport,
  historyCount,
  is3DCoreVisible,
  onToggle3DCore,
  activeView = 'workspace',
  onToggleView
}) => {
  const { session, isAuthenticated } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800 bg-zinc-950/85 backdrop-blur-xl transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Logo & Branding */}
          <div className="flex items-center gap-3">
            <div 
              onClick={onToggleView}
              className="cursor-pointer relative flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-600 border-2 border-black shadow-[3px_3px_0px_#000000] shrink-0 hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_#000000] transition"
              title="Click to toggle 3D Landing Page"
            >
              <PixelShield size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span 
                  onClick={onToggleView}
                  className="font-extrabold text-lg tracking-tight text-white font-pixel cursor-pointer flex items-center gap-1"
                >
                  Veritas<span className="text-indigo-400">AI</span>
                </span>
                <span className="text-[10px] font-pixel px-2 py-0.5 bg-zinc-900 text-amber-300 border-2 border-black shadow-[2px_2px_0px_#000000] font-bold uppercase tracking-wider hidden sm:inline-block">
                  ★ PixelPop Core
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 hidden xl:block font-mono">
                Retro Stylometry &amp; Format-Preserving Document Surgeon
              </p>
            </div>
          </div>

          {/* Mode Navigation Pills with Cute Pixel Icons */}
          <nav className="hidden lg:flex items-center gap-1.5 bg-zinc-900/90 p-1.5 rounded-xl border-2 border-black shadow-[3px_3px_0px_#000000]">
            <button
              onClick={() => onSelectMode('comprehensive')}
              className={`px-3 py-1.5 rounded-lg text-xs font-pixel font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                currentMode === 'comprehensive'
                  ? 'bg-indigo-600 text-white border-2 border-black shadow-[2px_2px_0px_#000000]'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80'
              }`}
            >
              <PixelShield size={16} />
              <span>Deep Scan</span>
            </button>
            <button
              onClick={() => onSelectMode('ai')}
              className={`px-3 py-1.5 rounded-lg text-xs font-pixel font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                currentMode === 'ai'
                  ? 'bg-purple-600 text-white border-2 border-black shadow-[2px_2px_0px_#000000]'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80'
              }`}
            >
              <PixelRobot size={16} />
              <span>AI Detector</span>
            </button>
            <button
              onClick={() => onSelectMode('plagiarism')}
              className={`px-3 py-1.5 rounded-lg text-xs font-pixel font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                currentMode === 'plagiarism'
                  ? 'bg-rose-600 text-white border-2 border-black shadow-[2px_2px_0px_#000000]'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80'
              }`}
            >
              <PixelSearch size={16} />
              <span>Plagiarism</span>
            </button>
            <button
              onClick={() => onSelectMode('fixer')}
              className={`px-3 py-1.5 rounded-lg text-xs font-pixel font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                currentMode === 'fixer'
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-2 border-black shadow-[2px_2px_0px_#000000]'
                  : 'text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10'
              }`}
            >
              <PixelSparkle size={16} />
              <span>Humanizer</span>
            </button>
            <button
              onClick={() => onSelectMode('surgeon')}
              className={`px-3 py-1.5 rounded-lg text-xs font-pixel font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                currentMode === 'surgeon'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-2 border-black shadow-[2px_2px_0px_#000000]'
                  : 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10'
              }`}
              title="Format-Preserving Word (.docx) & PDF (.pdf) Auto-Surgeon"
            >
              <PixelBandAid size={16} />
              <span>Doc Surgeon (.docx / .pdf)</span>
              <span className="px-1.5 py-0.2 rounded text-[9px] bg-black text-emerald-300 font-pixel font-bold border border-emerald-400/50">NEW</span>
            </button>
          </nav>

          {/* Right Header Actions & Technical Controls */}
          <div className="flex items-center gap-2">
            {/* View Switcher: 3D Landing Page vs Workspace */}
            {onToggleView && (
              <button
                onClick={onToggleView}
                className="pixel-btn px-2.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-indigo-300 border-2 border-black shadow-[2px_2px_0px_#000] text-xs font-pixel font-bold flex items-center gap-1.5 transition"
                title={activeView === 'landing' ? 'Open Workspace' : 'View 3D Hero Landing'}
              >
                {activeView === 'landing' ? (
                  <>
                    <LayoutDashboard className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="hidden sm:inline">Workspace</span>
                  </>
                ) : (
                  <>
                    <Home className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="hidden sm:inline">3D Hero</span>
                  </>
                )}
              </button>
            )}

            {/* 3D Core View Toggle in Workspace */}
            <button
              onClick={onToggle3DCore}
              className={`pixel-btn px-2.5 py-1.5 rounded-xl border-2 border-black shadow-[2px_2px_0px_#000] text-xs font-pixel font-bold flex items-center gap-1.5 transition ${
                is3DCoreVisible
                  ? 'bg-indigo-950 text-indigo-300'
                  : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200'
              }`}
              title="Toggle 3D AI Core & Laser Scanner"
            >
              <span>3D Core</span>
            </button>

            {/* NLP Metrics Modal Trigger */}
            <button
              onClick={onOpenLinguistics}
              className="pixel-btn px-2.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border-2 border-black shadow-[2px_2px_0px_#000] text-xs font-pixel font-bold flex items-center gap-1.5 transition"
              title="Statistical Linguistics & Shingles"
            >
              <Binary className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">NLP</span>
            </button>

            {/* Quick Sample Text Picker */}
            <div className="relative group hidden sm:block">
              <button
                className="pixel-btn px-2.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-pixel font-bold border-2 border-black shadow-[2px_2px_0px_#000] flex items-center gap-1.5 transition"
              >
                <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden md:inline">Samples</span>
              </button>
              <div className="absolute right-0 top-full mt-1.5 w-64 p-2 bg-zinc-950 border-2 border-black shadow-[4px_4px_0px_#000] rounded-2xl opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all z-50 space-y-1">
                <span className="text-[10px] uppercase font-bold text-amber-400 px-2 py-1 block font-pixel">
                  ★ Corpus Benchmark Samples
                </span>
                {SAMPLE_TEXTS.map((sample) => (
                  <button
                    key={sample.id}
                    onClick={() => onSelectSample(sample)}
                    className="w-full text-left p-2 rounded-xl hover:bg-zinc-900 transition text-xs space-y-0.5 border border-transparent hover:border-black"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white">{sample.title}</span>
                      <span className="text-[10px] font-pixel text-indigo-400">{sample.badge}</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 line-clamp-1">{sample.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Export PDF Button */}
            {hasActiveReport && (
              <button
                onClick={onExportPDF}
                className="pixel-btn px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-pixel font-bold flex items-center gap-1.5 transition border-2 border-black shadow-[2px_2px_0px_#000]"
                title="Export Forensic Audit PDF Report"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Export PDF</span>
              </button>
            )}

            {/* Audit History Trigger */}
            <button
              onClick={onOpenHistory}
              className="pixel-btn p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs border-2 border-black shadow-[2px_2px_0px_#000] relative transition shrink-0"
              title="Audit History"
            >
              <History className="w-4 h-4" />
              {historyCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center font-pixel border border-black">
                  {historyCount}
                </span>
              )}
            </button>

            {/* Confidential Session Pill */}
            <button
              onClick={onOpenAuth}
              className={`pixel-btn px-3 py-1.5 rounded-xl border-2 border-black shadow-[2px_2px_0px_#000] text-xs font-pixel font-bold flex items-center gap-1.5 transition ${
                isAuthenticated
                  ? 'bg-zinc-900 text-zinc-200 hover:bg-zinc-850'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-black'
              }`}
              title="Sign in or start 7-Day Free Trial"
            >
              <Fingerprint className="w-3.5 h-3.5" />
              <span className="text-[11px] font-pixel hidden sm:inline">
                {(() => {
                  const user = getCurrentUser();
                  if (!user) return 'Sign In';
                  if (user.role === 'admin') return 'Admin Portal';
                  return `${user.name.split(' ')[0]} (${user.plan === 'trial' ? 'Free Trial' : user.plan})`;
                })()}
              </span>
            </button>
          </div>
        </div>

        {/* Mobile Subnav for Modes */}
        <div className="flex lg:hidden items-center justify-around py-2 border-t border-zinc-800/80 overflow-x-auto gap-1">
          <button
            onClick={() => onSelectMode('comprehensive')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap ${
              currentMode === 'comprehensive' ? 'bg-indigo-600 text-white' : 'text-zinc-400'
            }`}
          >
            Deep Scan
          </button>
          <button
            onClick={() => onSelectMode('ai')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap ${
              currentMode === 'ai' ? 'bg-indigo-600 text-white' : 'text-zinc-400'
            }`}
          >
            AI Detector
          </button>
          <button
            onClick={() => onSelectMode('plagiarism')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap ${
              currentMode === 'plagiarism' ? 'bg-indigo-600 text-white' : 'text-zinc-400'
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
          <button
            onClick={() => onSelectMode('surgeon')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap ${
              currentMode === 'surgeon' ? 'bg-emerald-600 text-white font-semibold' : 'text-emerald-400'
            }`}
          >
            Doc Surgeon
          </button>
        </div>
      </div>
    </header>
  );
};
