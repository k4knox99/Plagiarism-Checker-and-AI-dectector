import React, { useState, useEffect } from 'react';
import { 
  X, 
  Lock, 
  Mail, 
  User as UserIcon, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldCheck, 
  ArrowRight,
  ShieldAlert,
  KeyRound,
  RotateCcw,
  Check
} from 'lucide-react';
import { loginUser, registerUser } from '../utils/authStorage';
import { validateEmailAddress } from '../utils/tempMailValidator';
import { User } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: User) => void;
  initialMode?: 'signin' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  initialMode = 'signin'
}) => {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [step, setStep] = useState<'form' | 'verify-email'>('form');
  
  // Sign In state
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  
  // Sign Up state
  const [signUpName, setSignUpName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');

  // 2-Step Verification state
  const [verificationCode, setVerificationCode] = useState('');
  const [expectedCode, setExpectedCode] = useState('');
  const [simulatedEmailBanner, setSimulatedEmailBanner] = useState<string | null>(null);
  
  // Feedback state
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [emailDomainWarning, setEmailDomainWarning] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Sync mode if initialMode changes
  useEffect(() => {
    setMode(initialMode);
    setStep('form');
    setErrorMessage(null);
  }, [initialMode, isOpen]);

  if (!isOpen) return null;

  // Realtime email validation for sign up
  const handleSignUpEmailChange = (val: string) => {
    setSignUpEmail(val);
    setErrorMessage(null);

    if (val.includes('@') && val.split('@')[1]?.includes('.')) {
      const res = validateEmailAddress(val);
      if (!res.isValid) {
        setEmailDomainWarning(res.error || 'Temporary or disposable email addresses are strictly prohibited.');
      } else {
        setEmailDomainWarning(null);
      }
    } else {
      setEmailDomainWarning(null);
    }
  };

  const handleSignInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    setTimeout(() => {
      const result = loginUser(signInEmail, signInPassword);
      setIsLoading(false);
      if (result.success && result.user) {
        onAuthSuccess(result.user);
        onClose();
      } else {
        setErrorMessage(result.error || 'Invalid credentials. Please verify your email and password.');
      }
    }, 300);
  };

  // Step 1: Pre-flight check & trigger 2-Step Email Verification code dispatch
  const handleSignUpInitiate = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const validation = validateEmailAddress(signUpEmail);
    if (!validation.isValid) {
      setErrorMessage(validation.error || 'Temporary or disposable email addresses are strictly prohibited.');
      return;
    }

    if (signUpPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    // Generate 6-digit confirmation code
    const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
    setExpectedCode(generatedCode);

    setTimeout(() => {
      setIsLoading(false);
      setStep('verify-email');
      setVerificationCode('');
      setSimulatedEmailBanner(`Verification code dispatched to ${signUpEmail}: ${generatedCode}`);
    }, 400);
  };

  // Step 2: Confirm 6-Digit Email Code and Activate 7-Day Free Trial
  const handleVerifyCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanInputCode = verificationCode.trim();
    if (cleanInputCode !== expectedCode) {
      setErrorMessage('Incorrect 6-digit verification code. Please check the simulated email notification banner above.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const result = registerUser(signUpName, signUpEmail, signUpPassword);
      setIsLoading(false);
      if (result.success && result.user) {
        onAuthSuccess(result.user);
        onClose();
      } else {
        setErrorMessage(result.error || 'Registration failed.');
      }
    }, 400);
  };

  const handleResendCode = () => {
    const freshCode = Math.floor(100000 + Math.random() * 900000).toString();
    setExpectedCode(freshCode);
    setVerificationCode('');
    setErrorMessage(null);
    setSimulatedEmailBanner(`New verification code dispatched to ${signUpEmail}: ${freshCode}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-md">
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white font-mono">
                Veritas<span className="text-indigo-400">AI</span> Access
              </h3>
              <p className="text-[11px] text-slate-400">
                {step === 'verify-email' 
                  ? 'Step 2: Confirm Your Email'
                  : mode === 'signin' 
                  ? 'Sign in to confidential session' 
                  : 'Step 1: 7-Day Free Trial Registration'}
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

        {/* Tab Switcher (Only visible in form step) */}
        {step === 'form' && (
          <div className="grid grid-cols-2 p-1.5 mx-6 mt-4 bg-slate-950 rounded-xl border border-slate-800 text-xs font-semibold">
            <button
              type="button"
              onClick={() => { setMode('signin'); setErrorMessage(null); }}
              className={`py-2 rounded-lg transition-all ${
                mode === 'signin'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('signup'); setErrorMessage(null); }}
              className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                mode === 'signup'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>7-Day Free Trial</span>
            </button>
          </div>
        )}

        {/* Error Notification */}
        {errorMessage && (
          <div className="mx-6 mt-3 p-3 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <p className="leading-relaxed">{errorMessage}</p>
          </div>
        )}

        {/* Disposable Mail Warning Banner */}
        {mode === 'signup' && emailDomainWarning && step === 'form' && (
          <div className="mx-6 mt-3 p-3 rounded-xl bg-amber-950/60 border border-amber-500/50 text-amber-200 text-xs flex items-start gap-2.5 animate-in fade-in">
            <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-semibold block">Disposable Email Detected</span>
              <p className="text-[11px] text-amber-300/90 leading-relaxed">
                {emailDomainWarning}
              </p>
            </div>
          </div>
        )}

        {/* Simulated Email Toast / Banner for instant code retrieval */}
        {step === 'verify-email' && simulatedEmailBanner && (
          <div className="mx-6 mt-4 p-3.5 rounded-xl bg-indigo-950/70 border border-indigo-500/40 text-indigo-200 text-xs flex flex-col gap-2 animate-in fade-in">
            <div className="flex items-center justify-between">
              <span className="font-semibold flex items-center gap-1.5 text-indigo-300">
                <Mail className="w-4 h-4 text-indigo-400" />
                <span>Simulated Mail Server Delivery</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Inbox
              </span>
            </div>
            <p className="text-[11px] text-indigo-200 leading-relaxed font-mono">
              Verification Code: <strong className="text-white text-sm tracking-widest">{expectedCode}</strong>
            </p>
            <button
              type="button"
              onClick={() => { setVerificationCode(expectedCode); setErrorMessage(null); }}
              className="self-start text-[11px] font-semibold text-indigo-300 hover:text-white bg-indigo-800/50 hover:bg-indigo-700/60 px-2.5 py-1 rounded-lg border border-indigo-500/40 transition flex items-center gap-1"
            >
              <Check className="w-3 h-3 text-emerald-400" />
              <span>Autofill Code ({expectedCode})</span>
            </button>
          </div>
        )}

        {/* Body Content */}
        <div className="p-6">
          {step === 'verify-email' ? (
            /* 2-Step Email Verification Form */
            <form onSubmit={handleVerifyCodeSubmit} className="space-y-4">
              <div className="text-center space-y-1">
                <h4 className="text-sm font-bold text-white">Enter 6-Digit Code</h4>
                <p className="text-xs text-slate-400">
                  We've sent a 6-digit confirmation code to <span className="text-indigo-300 font-mono">{signUpEmail}</span>.
                </p>
              </div>

              <div>
                <input
                  type="text"
                  maxLength={6}
                  required
                  autoFocus
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="• • • • • •"
                  className="w-full text-center tracking-[0.5em] text-xl font-bold font-mono py-3 rounded-xl bg-slate-950 border border-indigo-500/50 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || verificationCode.length < 6}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-95 text-white font-semibold text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>{isLoading ? 'Verifying...' : 'Confirm Code & Activate Free Trial'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setStep('form')}
                  className="hover:text-white transition"
                >
                  ← Edit details
                </button>
                <button
                  type="button"
                  onClick={handleResendCode}
                  className="text-indigo-400 hover:text-indigo-300 transition flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Resend Code</span>
                </button>
              </div>
            </form>
          ) : mode === 'signin' ? (
            /* Sign In Form */
            <form onSubmit={handleSignInSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={signInEmail}
                    onChange={(e) => setSignInEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="password"
                    required
                    value={signInPassword}
                    onChange={(e) => setSignInPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition flex items-center justify-center gap-2 shadow-md shadow-indigo-600/30 disabled:opacity-50"
              >
                <span>{isLoading ? 'Authenticating...' : 'Sign In to Workspace'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          ) : (
            /* Sign Up Step 1 Form */
            <form onSubmit={handleSignUpInitiate} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={signUpName}
                    onChange={(e) => setSignUpName(e.target.value)}
                    placeholder="Dr. Sarah Chen"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Work or Academic Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={signUpEmail}
                    onChange={(e) => handleSignUpEmailChange(e.target.value)}
                    placeholder="user@university.edu or @company.com"
                    className={`w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-950 border text-white placeholder-slate-500 focus:outline-none transition ${
                      emailDomainWarning ? 'border-amber-500' : 'border-slate-700 focus:border-indigo-500'
                    }`}
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Disposable / 10-minute temporary email addresses are strictly blocked.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Password (min 6 characters)
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={signUpPassword}
                    onChange={(e) => setSignUpPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>
              </div>

              {/* 7-Day Free Trial Perk Callout */}
              <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-950/40 to-teal-950/30 border border-emerald-500/20 text-[11px] text-emerald-300 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <p>
                  <strong>Immediate 7-Day Free Trial:</strong> Full access to AI Detection, Web Plagiarism Check, and Gemini Humanizer Fixer. No credit card required.
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading || Boolean(emailDomainWarning)}
                className={`w-full py-2.5 rounded-xl font-semibold text-xs transition flex items-center justify-center gap-2 shadow-md ${
                  emailDomainWarning
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:opacity-95 text-white shadow-indigo-600/30'
                }`}
              >
                <span>{isLoading ? 'Sending Code...' : 'Continue to Email Verification'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
