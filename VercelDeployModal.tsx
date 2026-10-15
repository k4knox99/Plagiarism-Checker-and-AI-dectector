import React, { useState } from 'react';
import { 
  X, 
  Check, 
  Copy, 
  ExternalLink, 
  Terminal, 
  Key, 
  Cpu, 
  Layers, 
  ShieldCheck, 
  FileCode2, 
  ArrowRight,
  Sparkles,
  Server
} from 'lucide-react';

interface VercelDeployModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VercelDeployModal: React.FC<VercelDeployModalProps> = ({ isOpen, onClose }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(label);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const vercelJsonExample = `{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api" },
    { "source": "/((?!api/).*)", "destination": "/index.html" }
  ]
}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-black border border-slate-700 flex items-center justify-center shadow-inner">
              <svg 
                viewBox="0 0 1155 1000" 
                className="w-4 h-4 fill-white" 
                aria-hidden="true"
              >
                <path d="m577.3 0 577.4 1000H0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Deploy VeritasAI to Vercel
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Ready
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Full-stack Vite SPA with Vercel Serverless Functions
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar text-sm text-slate-300">
          {/* Status banner */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-950/60 via-slate-900 to-purple-950/40 border border-indigo-500/30 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-semibold text-white">Vercel Configuration Verified</p>
              <p className="text-slate-300 leading-relaxed">
                The repository is fully configured with <code className="text-indigo-300 font-mono bg-indigo-950/80 px-1 py-0.5 rounded">vercel.json</code>, 
                serverless entrypoints in <code className="text-indigo-300 font-mono bg-indigo-950/80 px-1 py-0.5 rounded">/api</code>, 
                and fallback stylometric engines for zero-downtime execution.
              </p>
            </div>
          </div>

          {/* Quick Deploy Options */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase tracking-wider font-bold text-slate-400 font-mono flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              Deployment Methods
            </h4>

            {/* Option 1: GitHub / Git Import */}
            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white text-xs flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-600/30 border border-indigo-500/50 text-indigo-300 flex items-center justify-center text-[10px] font-mono">1</span>
                  Import via Vercel Dashboard (Recommended)
                </span>
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 font-mono">
                  Zero Config
                </span>
              </div>
              <ol className="text-xs text-slate-400 space-y-1.5 list-decimal list-inside pl-1 leading-relaxed">
                <li>Push this repository to <span className="text-slate-200">GitHub</span> or <span className="text-slate-200">GitLab</span>.</li>
                <li>Go to <span className="text-slate-200 font-mono">vercel.com/new</span> and select your repository.</li>
                <li>Vercel automatically detects <strong className="text-indigo-300">Vite</strong> as the framework with output directory <code className="text-indigo-200">dist</code>.</li>
                <li>Add the environment variable <code className="text-indigo-200 font-mono">GEMINI_API_KEY</code>.</li>
                <li>Click <strong className="text-white">Deploy</strong>.</li>
              </ol>
            </div>

            {/* Option 2: Vercel CLI */}
            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white text-xs flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-600/30 border border-indigo-500/50 text-indigo-300 flex items-center justify-center text-[10px] font-mono">2</span>
                  Deploy via Vercel CLI
                </span>
                <button
                  onClick={() => handleCopy('npx vercel --prod', 'cli')}
                  className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white transition"
                >
                  {copiedKey === 'cli' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'cli' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <div className="p-2.5 rounded-lg bg-black/60 font-mono text-xs text-emerald-400 flex items-center justify-between border border-slate-800">
                <code>npx vercel --prod</code>
              </div>
            </div>
          </div>

          {/* Environment Variables Required */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase tracking-wider font-bold text-slate-400 font-mono flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-amber-400" />
              Environment Variables Required
            </h4>
            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-mono text-xs text-amber-300 font-semibold block">GEMINI_API_KEY</span>
                  <span className="text-[11px] text-slate-400">Used by Gemini 3.8 Flash for forensic detection and humanizer rewriting</span>
                </div>
                <button
                  onClick={() => handleCopy('GEMINI_API_KEY', 'envvar')}
                  className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white transition px-2 py-1 rounded bg-slate-800 hover:bg-slate-700"
                >
                  {copiedKey === 'envvar' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === 'envvar' ? 'Copied' : 'Copy Name'}</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-400 border-t border-slate-700/50 pt-2">
                Tip: If no key is set yet, VeritasAI will smoothly fallback to its built-in local stylometric heuristic engine, preventing any 500 runtime errors!
              </p>
            </div>
          </div>

          {/* Architecture overview */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase tracking-wider font-bold text-slate-400 font-mono flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-indigo-400" />
              Vercel Deployment Architecture
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-800/30 border border-slate-700/40 space-y-1">
                <span className="text-[11px] font-semibold text-white flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-400" />
                  Frontend (Vite SPA)
                </span>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Static assets built to <code className="font-mono text-slate-300">dist/</code> and cached worldwide on Vercel's Edge CDN.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/30 border border-slate-700/40 space-y-1">
                <span className="text-[11px] font-semibold text-white flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-purple-400" />
                  Backend (Serverless)
                </span>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Serverless Functions in <code className="font-mono text-slate-300">api/index.ts</code> running Express on Vercel Node runtime.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-900/90">
          <span className="text-xs text-slate-400">
            Configuration: <span className="font-mono text-slate-200">vercel.json</span> included
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition"
            >
              Close
            </button>
            <a
              href="https://vercel.com/new"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-black text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
            >
              <span>Go to Vercel</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
