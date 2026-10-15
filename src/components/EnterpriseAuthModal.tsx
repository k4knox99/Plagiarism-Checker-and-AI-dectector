import React, { useState } from 'react';
import { 
  X, 
  Lock, 
  Mail, 
  Key, 
  ShieldCheck, 
  Building2, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  LogOut,
  Fingerprint
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface EnterpriseAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EnterpriseAuthModal: React.FC<EnterpriseAuthModalProps> = ({
  isOpen,
  onClose
}) => {
  const { session, isAuthenticated, signIn, signInWithBearerToken, signOut } = useAuth();
  const [tab, setTab] = useState<'credentials' | 'token'>('credentials');

  // Clean, unpopulated input states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [bearerToken, setBearerToken] = useState('');
  const [organization, setOrganization] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await signIn(email, password);
      setIsLoading(false);
      if (res.success) {
        onClose();
      } else {
        setError(res.error || 'Authentication failed. Please verify your credentials.');
      }
    } catch {
      setIsLoading(false);
      setError('An error occurred during authentication.');
    }
  };

  const handleBearerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await signInWithBearerToken(bearerToken, organization);
      setIsLoading(false);
      if (res.success) {
        onClose();
      } else {
        setError(res.error || 'Invalid bearer token.');
      }
    } catch {
      setIsLoading(false);
      setError('Failed to validate bearer token.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/80 bg-zinc-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-zinc-800 border border-zinc-700/80 flex items-center justify-center shadow-inner">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-100 font-mono tracking-tight">
                Veritas<span className="text-indigo-400">AI</span> Session
              </h3>
              <p className="text-[11px] text-zinc-400">
                Confidential Enterprise Authentication
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Active Session Status */}
          {isAuthenticated ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400 font-mono">Active Tier</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold font-mono text-[10px]">
                    {session.tier}
                  </span>
                </div>
                {session.email && (
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Principal</span>
                    <span className="font-mono text-zinc-200">{session.email}</span>
                  </div>
                )}
                {session.organization && (
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Organization</span>
                    <span className="font-semibold text-zinc-200">{session.organization}</span>
                  </div>
                )}
                <div className="flex items-center justify-between border-t border-zinc-800/60 pt-2">
                  <span className="text-zinc-400">Masked Token</span>
                  <span className="font-mono text-[11px] text-zinc-300">{session.maskedToken}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Daily Quota</span>
                  <span className="font-mono text-indigo-400">
                    {session.dailyQuotaUsed} / {session.dailyQuotaTotal} scans used
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  signOut();
                  onClose();
                }}
                className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-rose-950/40 text-zinc-300 hover:text-rose-300 border border-zinc-700/80 text-xs font-semibold flex items-center justify-center gap-2 transition"
              >
                <LogOut className="w-4 h-4 text-rose-400" />
                <span>Revoke Current Session</span>
              </button>
            </div>
          ) : (
            <>
              {/* Anonymous Session Notice */}
              <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-zinc-400">
                  <Fingerprint className="w-4 h-4 text-zinc-500" />
                  <span className="text-[11px]">Anonymous Session Active</span>
                </div>
                <span className="font-mono text-[10px] text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                  50 Scans Available
                </span>
              </div>

              {/* Tab Selector */}
              <div className="grid grid-cols-2 p-1 bg-zinc-950 rounded-xl border border-zinc-800 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => { setTab('credentials'); setError(null); }}
                  className={`py-1.5 rounded-lg transition-all ${
                    tab === 'credentials'
                      ? 'bg-zinc-800 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  User Sign In
                </button>
                <button
                  type="button"
                  onClick={() => { setTab('token'); setError(null); }}
                  className={`py-1.5 rounded-lg transition-all ${
                    tab === 'token'
                      ? 'bg-zinc-800 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Bearer Token
                </button>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {tab === 'credentials' ? (
                /* Standard Credentials Form with empty, unpopulated inputs */
                <form onSubmit={handleCredentialsSubmit} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">
                      Account Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="researcher@institution.edu"
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-zinc-950 border border-zinc-700/80 text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500 transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-zinc-950 border border-zinc-700/80 text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500 transition"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full mt-2 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20"
                  >
                    <span>{isLoading ? 'Authenticating...' : 'Sign In'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </form>
              ) : (
                /* Enterprise Bearer Token Form with empty, unpopulated inputs */
                <form onSubmit={handleBearerSubmit} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">
                      Organization / Node Label (Optional)
                    </label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                      <input
                        type="text"
                        value={organization}
                        onChange={(e) => setOrganization(e.target.value)}
                        placeholder="e.g. Stanford AI Safety Lab"
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-zinc-950 border border-zinc-700/80 text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500 transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">
                      Enterprise Bearer Token
                    </label>
                    <div className="relative">
                      <Key className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                      <input
                        type="password"
                        required
                        value={bearerToken}
                        onChange={(e) => setBearerToken(e.target.value)}
                        placeholder="sec_live_..."
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-zinc-950 border border-zinc-700/80 text-white font-mono placeholder-zinc-600 focus:outline-none focus:border-indigo-500 transition"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full mt-2 py-2.5 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs transition flex items-center justify-center gap-2 shadow-md"
                  >
                    <span>{isLoading ? 'Validating Token...' : 'Attach Bearer Token'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
