import React from 'react';
import { 
  X, 
  Check, 
  Sparkles, 
  ShieldCheck, 
  Zap, 
  ArrowRight, 
  Crown, 
  Clock, 
  Building2,
  CheckCircle2
} from 'lucide-react';
import { DBSBankSettings } from '../types';

interface PricingUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPlan: (planId: '3_months' | '6_months' | '1_year') => void;
  settings: DBSBankSettings;
  isExpired?: boolean;
}

export const PricingUpgradeModal: React.FC<PricingUpgradeModalProps> = ({
  isOpen,
  onClose,
  onSelectPlan,
  settings,
  isExpired = false
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
              <Crown className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
                VeritasAI Pro Subscriptions
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                  DBS PayNow Accepted
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Unlock unrestricted AI detection, plagiarism audits, and Gemini humanizer rewrites
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

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar">
          {/* Expired Callout */}
          {isExpired && (
            <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-200 text-xs flex items-center gap-3">
              <Clock className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <span className="font-semibold block">7-Day Free Trial Has Ended</span>
                <span className="text-slate-300">
                  Select a subscription plan below to unlock your workspace and resume full forensics and AI humanizer tools.
                </span>
              </div>
            </div>
          )}

          {/* Pricing Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* 3 Months Plan */}
            <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/60 hover:border-slate-600 flex flex-col justify-between transition group">
              <div className="space-y-4">
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">
                    Quarterly
                  </span>
                  <h4 className="text-lg font-bold text-white mt-0.5">3 Months Plan</h4>
                  <p className="text-xs text-slate-400">Full standard access for individual researchers &amp; students.</p>
                </div>

                <div className="pt-1">
                  <div className="flex items-baseline gap-1">
                    <span className="text-xs text-slate-400 font-mono">SGD</span>
                    <span className="text-3xl font-extrabold text-white font-mono">
                      ${settings.prices['3_months']}
                    </span>
                    <span className="text-xs text-slate-500">/ 90 days</span>
                  </div>
                  <span className="text-[11px] text-indigo-400 font-medium">~$13/mo equivalent</span>
                </div>

                <ul className="space-y-2 text-xs text-slate-300 border-t border-slate-700/50 pt-4">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Unlimited AI Content Scans</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Web-Grounded Plagiarism Audit</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Smart Sentence Humanizer</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>PDF Audit Certificate Export</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={() => onSelectPlan('3_months')}
                className="w-full mt-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition flex items-center justify-center gap-1.5 border border-slate-700"
              >
                <span>Upgrade via DBS</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* 6 Months Plan (Featured) */}
            <div className="relative p-5 rounded-2xl bg-gradient-to-b from-indigo-950/60 to-slate-900 border-2 border-indigo-500 shadow-xl shadow-indigo-500/10 flex flex-col justify-between">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-[10px] font-bold uppercase tracking-wider font-mono shadow">
                Most Popular · Save 20%
              </div>

              <div className="space-y-4">
                <div>
                  <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider font-mono">
                    Semestral Pro
                  </span>
                  <h4 className="text-lg font-bold text-white mt-0.5 flex items-center gap-1.5">
                    <span>6 Months Plan</span>
                    <Sparkles className="w-4 h-4 text-amber-400" />
                  </h4>
                  <p className="text-xs text-slate-400">Optimal duration for college semesters and professionals.</p>
                </div>

                <div className="pt-1">
                  <div className="flex items-baseline gap-1">
                    <span className="text-xs text-slate-400 font-mono">SGD</span>
                    <span className="text-3xl font-extrabold text-white font-mono">
                      ${settings.prices['6_months']}
                    </span>
                    <span className="text-xs text-slate-500">/ 180 days</span>
                  </div>
                  <span className="text-[11px] text-emerald-400 font-medium">~$11.50/mo equivalent</span>
                </div>

                <ul className="space-y-2 text-xs text-slate-300 border-t border-slate-700/50 pt-4">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span><strong>Everything in 3 Months</strong></span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Gemini 3.8 Flash Neural Engine</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Stealth Anti-Detection Paraphraser</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>DOCX &amp; Multi-Page File Parsing</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={() => onSelectPlan('6_months')}
                className="w-full mt-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:opacity-95 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/30"
              >
                <span>Upgrade to 6 Months</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* 1 Year Plan */}
            <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/60 hover:border-slate-600 flex flex-col justify-between transition group">
              <div className="space-y-4">
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">
                    Annual Unlimited
                  </span>
                  <h4 className="text-lg font-bold text-white mt-0.5">1 Year Plan</h4>
                  <p className="text-xs text-slate-400">Complete year-round coverage for educators, labs &amp; authors.</p>
                </div>

                <div className="pt-1">
                  <div className="flex items-baseline gap-1">
                    <span className="text-xs text-slate-400 font-mono">SGD</span>
                    <span className="text-3xl font-extrabold text-white font-mono">
                      ${settings.prices['1_year']}
                    </span>
                    <span className="text-xs text-slate-500">/ 365 days</span>
                  </div>
                  <span className="text-[11px] text-indigo-400 font-medium">~$9.90/mo (Best Value)</span>
                </div>

                <ul className="space-y-2 text-xs text-slate-300 border-t border-slate-700/50 pt-4">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span><strong>365 Days Unrestricted Access</strong></span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>All 5 Humanizer Style Personas</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Multi-format Citations (APA, MLA)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>24/7 Priority Support &amp; Updates</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={() => onSelectPlan('1_year')}
                className="w-full mt-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition flex items-center justify-center gap-1.5 border border-slate-700"
              >
                <span>Upgrade to 1 Year</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* DBS Payment Info Footer */}
          <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-400" />
              <span>Direct Bank FAST Transfer &amp; DBS PayLah! QR supported</span>
            </div>
            <div className="flex items-center gap-4 text-[11px]">
              <span className="text-slate-300">Instant Verification</span>
              <span>·</span>
              <span className="text-slate-300">Zero Recurring Auto-Charges</span>
              <span>·</span>
              <span className="text-slate-300">Singapore DBS Verified</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
