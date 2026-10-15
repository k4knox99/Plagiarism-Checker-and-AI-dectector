import React, { createContext, useContext, useState, useEffect } from 'react';

export interface AuthSession {
  sessionId: string;
  sessionType: 'anonymous' | 'authenticated' | 'enterprise_bearer';
  maskedToken: string;
  email?: string;
  organization?: string;
  tier: 'Enterprise Forensic' | 'Professional Research' | 'Anonymous Sandbox';
  dailyQuotaTotal: number;
  dailyQuotaUsed: number;
  authenticatedAt: string;
}

interface AuthContextType {
  session: AuthSession;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signInWithBearerToken: (token: string, orgName?: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => void;
  incrementQuotaUsage: () => void;
}

const STORAGE_SESSION_KEY = 'veritas_secure_session';

function generateMaskedToken(secret: string): string {
  if (!secret || secret.length < 6) return 'sec_••••••••';
  const prefix = secret.slice(0, 7);
  const suffix = secret.slice(-4);
  return `${prefix}••••••••${suffix}`;
}

function createAnonymousSession(): AuthSession {
  const randomBytes = Array.from(crypto.getRandomValues(new Uint8Array(8)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  const sessionId = `anon_${randomBytes}`;
  return {
    sessionId,
    sessionType: 'anonymous',
    maskedToken: `sec_anon_••••${randomBytes.slice(-4)}`,
    tier: 'Anonymous Sandbox',
    dailyQuotaTotal: 50,
    dailyQuotaUsed: 0,
    authenticatedAt: new Date().toISOString()
  };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<AuthSession>(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_SESSION_KEY) || localStorage.getItem(STORAGE_SESSION_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // Fallback to anonymous
    }
    return createAnonymousSession();
  });

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(session));
    } catch {
      // Ignore quota errors
    }
  }, [session]);

  const signIn = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      return { success: false, error: 'Email and password are required.' };
    }
    if (password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters.' };
    }

    // Masked confidential session token
    const tokenSeed = `tok_${btoa(cleanEmail).slice(0, 12)}_${Date.now()}`;
    const newSession: AuthSession = {
      sessionId: `usr_${Date.now().toString(36)}`,
      sessionType: 'authenticated',
      maskedToken: generateMaskedToken(tokenSeed),
      email: cleanEmail,
      organization: cleanEmail.split('@')[1] || 'Independent Research',
      tier: 'Professional Research',
      dailyQuotaTotal: 500,
      dailyQuotaUsed: 0,
      authenticatedAt: new Date().toISOString()
    };

    setSession(newSession);
    return { success: true };
  };

  const signInWithBearerToken = async (token: string, orgName?: string): Promise<{ success: boolean; error?: string }> => {
    const cleanToken = token.trim();
    if (!cleanToken || cleanToken.length < 10) {
      return { success: false, error: 'Invalid API bearer token format.' };
    }

    const newSession: AuthSession = {
      sessionId: `ent_${Date.now().toString(36)}`,
      sessionType: 'enterprise_bearer',
      maskedToken: generateMaskedToken(cleanToken),
      organization: orgName?.trim() || 'Enterprise Node',
      tier: 'Enterprise Forensic',
      dailyQuotaTotal: 10000,
      dailyQuotaUsed: 0,
      authenticatedAt: new Date().toISOString()
    };

    setSession(newSession);
    return { success: true };
  };

  const signOut = () => {
    try {
      sessionStorage.removeItem(STORAGE_SESSION_KEY);
      localStorage.removeItem(STORAGE_SESSION_KEY);
    } catch {
      // Ignore
    }
    setSession(createAnonymousSession());
  };

  const incrementQuotaUsage = () => {
    setSession(prev => ({
      ...prev,
      dailyQuotaUsed: Math.min(prev.dailyQuotaTotal, prev.dailyQuotaUsed + 1)
    }));
  };

  const isAuthenticated = session.sessionType !== 'anonymous';

  return (
    <AuthContext.Provider
      value={{
        session,
        isAuthenticated,
        signIn,
        signInWithBearerToken,
        signOut,
        incrementQuotaUsage
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
