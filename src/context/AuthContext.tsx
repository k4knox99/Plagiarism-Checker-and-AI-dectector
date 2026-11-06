import React, { createContext, useContext } from "react";
// Retired components cannot mint account sessions or enterprise access in a browser.
export interface AuthSession {
  sessionId: string;
  sessionType: "anonymous" | "authenticated" | "enterprise_bearer";
  maskedToken: string;
  email?: string;
  organization?: string;
  tier: "Enterprise Forensic" | "Professional Research" | "Anonymous Sandbox";
  dailyQuotaTotal: number;
  dailyQuotaUsed: number;
  authenticatedAt: string;
}
const value = {
  session: {
    sessionId: "guest",
    sessionType: "anonymous",
    maskedToken: "",
    tier: "Anonymous Sandbox",
    dailyQuotaTotal: 0,
    dailyQuotaUsed: 0,
    authenticatedAt: "",
  } as AuthSession,
  isAuthenticated: false,
  signIn: async (_email: string, _password: string) => ({
    success: false,
    error: "Use the server sign-in dialog.",
  }),
  signInWithBearerToken: async (_token: string, _organization?: string) => ({
    success: false,
    error: "Enterprise bearer sign-in is disabled.",
  }),
  signOut: () => {},
  incrementQuotaUsage: () => {},
};
const AuthContext = createContext(value);
export const AuthProvider = ({ children }: { children: React.ReactNode }) => (
  <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
);
export function useAuth() {
  return useContext(AuthContext);
}
