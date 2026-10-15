import React from 'react';
import { Lock, Sparkles, CreditCard, ShieldAlert, ArrowRight, Clock, CheckCircle } from 'lucide-react';
import { User } from '../types';

interface PaywallBannerProps {
  user: User | null;
  onOpenUpgrade: () => void;
  onOpenAuth: () => void;
}

export const PaywallBanner: React.FC<PaywallBannerProps> = ({
  user,
  onOpenUpgrade,
  onOpenAuth
}) => {
  if (!user) {
    return (
      <div className="p-8 rounded-3xl bg-gradient-to-b from-indigo-950/40 via-slate-900 to-slate-950 border border-indigo-500/30 text-center space-y-4 my-6 shadow-2xl">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
          <Sparkles className="w-7 h-7" />
        </div>
        <div className="space-y-1">
          <h3 className="text-xl font-bold text-white font-mono">
            Start Your 7-Day Free Trial
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Sign up in 10 seconds to unlock unlimited AI content detection, web plagiarism checks, and neural humanizer rewrites.
          </p>
        </div>
        <button
          onClick={onOpenAuth}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90 text-white font-semibold text-xs transition inline-flex items-center gap-2 shadow-lg shadow-indigo-600/25"
        >
          <span>Claim 7-Day Free Trial</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  if (user.status === 'blocked') {
    return (
      <div className="p-8 rounded-3xl bg-rose-950/40 border border-rose-500/40 text-center space-y-3 my-6">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-600/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-bold text-white">Account Access Suspended</h3>
        <p className="text-xs text-rose-300/80 max-w-md mx-auto">
          Your account has been placed on administrative hold. Please contact the administrator at <code className="text-white font-mono">Admin@kmh</code> for assistance.
        </p>
      </div>
    );
  }

  if (user.status === 'pending_payment') {
    return (
      <div className="p-8 rounded-3xl bg-amber-950/30 border border-amber-500/40 text-center space-y-4 my-6">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
          <Clock className="w-7 h-7 animate-pulse" />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-white">DBS Payment Verification Pending</h3>
          <p className="text-xs text-slate-300 max-w-lg mx-auto">
            We have received your payment proof submission for the <strong>{user.pendingPaymentPlan?.replace('_', ' ') || 'Pro'}</strong> plan.
            The administrator is verifying your transfer. Your account will automatically activate once confirmed.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono">
          <Clock className="w-3.5 h-3.5" />
          <span>Status: Admin Verification in Progress</span>
        </div>
      </div>
    );
  }

  // Expired state
  return (
    <div className="relative overflow-hidden p-8 rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-indigo-500/40 text-center space-y-5 my-6 shadow-2xl">
      <div className="absolute top-0 right-0 p-8 pointer-events-none opacity-10">
        <Lock className="w-32 h-32 text-indigo-400" />
      </div>

      <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shadow-md">
        <Lock className="w-7 h-7" />
      </div>

      <div className="space-y-1.5">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px] font-mono font-semibold uppercase">
          <span>7-Day Free Trial Expired</span>
        </div>
        <h3 className="text-xl font-bold text-white font-mono">
          Unlock Full VeritasAI Access with DBS Bank / PayNow
        </h3>
        <p className="text-xs text-slate-400 max-w-lg mx-auto leading-relaxed">
          Your free trial has concluded. Upgrade to a 3-Month, 6-Month, or 1-Year plan to restore unlimited document scanning, live plagiarism checks, and Gemini neural rewrites.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <button
          onClick={onOpenUpgrade}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:opacity-95 text-white font-bold text-xs transition flex items-center gap-2 shadow-lg shadow-indigo-600/30"
        >
          <CreditCard className="w-4 h-4" />
          <span>View Plans &amp; DBS Bank Transfer</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-center gap-6 text-[11px] text-slate-400">
        <span className="flex items-center gap-1.5">
          <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
          DBS PayLah! &amp; PayNow
        </span>
        <span className="flex items-center gap-1.5">
          <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
          Zero Auto-Renewal Traps
        </span>
        <span className="flex items-center gap-1.5">
          <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
          Instant Admin Verification
        </span>
      </div>
    </div>
  );
};
