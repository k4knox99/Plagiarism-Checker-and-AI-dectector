import { User, DBSBankSettings, PaymentSubmission, SubscriptionPlanId, UserAccountStatus } from '../types';
import { validateEmailAddress } from './tempMailValidator';

const USERS_STORAGE_KEY = 'veritas_saas_users';
const CURRENT_USER_KEY = 'veritas_current_user';
const DBS_SETTINGS_KEY = 'veritas_dbs_settings';
const PAYMENTS_STORAGE_KEY = 'veritas_payment_submissions';

// Standard 7-Day Trial Duration
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;
const ONE_EIGHTY_DAYS_MS = 180 * 24 * 60 * 60 * 1000;
const THREE_SIXTY_FIVE_DAYS_MS = 365 * 24 * 60 * 60 * 1000;

// High-fidelity SVG QR Code Data URL for DBS PayNow
const DEFAULT_PAYNOW_QR_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" width="240" height="240"><rect width="240" height="240" fill="%237b0032" rx="20"/><rect x="15" y="15" width="210" height="210" fill="white" rx="12"/><text x="120" y="38" font-family="Arial,sans-serif" font-size="14" font-weight="bold" fill="%237b0032" text-anchor="middle">SGQR · PAYNOW DBS</text><rect x="30" y="50" width="50" height="50" fill="%23111"/><rect x="40" y="60" width="30" height="30" fill="white"/><rect x="47" y="67" width="16" height="16" fill="%23111"/><rect x="160" y="50" width="50" height="50" fill="%23111"/><rect x="170" y="60" width="30" height="30" fill="white"/><rect x="177" y="67" width="16" height="16" fill="%23111"/><rect x="30" y="140" width="50" height="50" fill="%23111"/><rect x="40" y="150" width="30" height="30" fill="white"/><rect x="47" y="157" width="16" height="16" fill="%23111"/><rect x="95" y="60" width="12" height="12" fill="%23111"/><rect x="115" y="60" width="12" height="12" fill="%237b0032"/><rect x="135" y="60" width="12" height="12" fill="%23111"/><rect x="95" y="80" width="32" height="12" fill="%23111"/><rect x="95" y="100" width="50" height="40" fill="%237b0032" rx="6"/><text x="120" y="125" font-family="Arial,sans-serif" font-size="11" font-weight="bold" fill="white" text-anchor="middle">PayNow</text><rect x="95" y="150" width="15" height="15" fill="%23111"/><rect x="120" y="150" width="20" height="20" fill="%23111"/><rect x="150" y="120" width="20" height="30" fill="%23111"/><rect x="180" y="120" width="15" height="40" fill="%237b0032"/><rect x="150" y="160" width="35" height="20" fill="%23111"/><text x="120" y="215" font-family="Arial,sans-serif" font-size="10" font-weight="bold" fill="%23555" text-anchor="middle">UEN: 202419283K · VERITAS AI</text></svg>`;

// Default DBS Bank Settings
export const DEFAULT_DBS_SETTINGS: DBSBankSettings = {
  accountHolderName: 'VERITAS AI (SINGAPORE) PTE. LTD.',
  bankName: 'DBS Bank (Singapore) / POSB',
  accountNumber: '072-903482-1',
  payNowNumber: '202419283K (UEN) / +65 8912 3456',
  qrCodeUrl: DEFAULT_PAYNOW_QR_SVG,
  prices: {
    '3_months': 39,
    '6_months': 69,
    '1_year': 119
  },
  instructions: 'Transfer the exact plan amount via DBS PayLah!, PayNow QR, or direct FAST bank transfer. Once completed, enter your Transaction Reference Number and upload a screenshot of your transfer receipt for immediate verification.'
};

// Sample Receipt Data URL for pre-seeded pending payment
const SAMPLE_RECEIPT_IMAGE = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" width="400" height="500"><rect width="400" height="500" fill="%23ffffff"/><rect x="20" y="20" width="360" height="460" rx="16" fill="%23f8fafc" stroke="%23cbd5e1" stroke-width="2"/><circle cx="200" cy="75" r="28" fill="%2316a34a"/><path d="M190 75 l7 7 l15 -15" stroke="white" stroke-width="4" fill="none" stroke-linecap="round"/><text x="200" y="130" font-family="Arial,sans-serif" font-size="18" font-weight="bold" fill="%230f172a" text-anchor="middle">Payment Successful</text><text x="200" y="155" font-family="Arial,sans-serif" font-size="28" font-weight="bold" fill="%230f172a" text-anchor="middle">SGD $69.00</text><line x1="50" y1="180" x2="350" y2="180" stroke="%23e2e8f0" stroke-dasharray="4 4"/><text x="50" y="215" font-family="Arial,sans-serif" font-size="12" fill="%2364748b">Recipient</text><text x="350" y="215" font-family="Arial,sans-serif" font-size="12" font-weight="bold" fill="%230f172a" text-anchor="end">VERITAS AI PTE. LTD.</text><text x="50" y="250" font-family="Arial,sans-serif" font-size="12" fill="%2364748b">Bank</text><text x="350" y="250" font-family="Arial,sans-serif" font-size="12" font-weight="bold" fill="%230f172a" text-anchor="end">DBS Bank (Singapore)</text><text x="50" y="285" font-family="Arial,sans-serif" font-size="12" fill="%2364748b">Account No.</text><text x="350" y="285" font-family="Arial,sans-serif" font-size="12" font-mono font-weight="bold" fill="%230f172a" text-anchor="end">072-903482-1</text><text x="50" y="320" font-family="Arial,sans-serif" font-size="12" fill="%2364748b">Transaction Ref</text><text x="350" y="320" font-family="Arial,sans-serif" font-size="12" font-mono font-weight="bold" fill="%234338ca" text-anchor="end">DBS-20261014-98421</text><text x="50" y="355" font-family="Arial,sans-serif" font-size="12" fill="%2364748b">Plan</text><text x="350" y="355" font-family="Arial,sans-serif" font-size="12" font-weight="bold" fill="%230f172a" text-anchor="end">6 Months Pro Plan</text><text x="50" y="390" font-family="Arial,sans-serif" font-size="12" fill="%2364748b">Date &amp; Time</text><text x="350" y="390" font-family="Arial,sans-serif" font-size="12" fill="%230f172a" text-anchor="end">14 Oct 2026, 14:32 SGT</text><rect x="50" y="420" width="300" height="40" rx="8" fill="%23e0e7ff"/><text x="200" y="445" font-family="Arial,sans-serif" font-size="12" font-weight="bold" fill="%233730a3" text-anchor="middle">DBS PayLah! Verified Fast Transfer</text></svg>`;

// Pre-seeded Users
const INITIAL_USERS: User[] = [
  {
    id: 'user-admin',
    email: 'Admin@kmh',
    name: 'Administrator',
    role: 'admin',
    plan: 'lifetime',
    status: 'active',
    registeredAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    subscriptionExpiresAt: new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'user-sarah',
    email: 'sarah.chen@gmail.com',
    name: 'Sarah Chen',
    role: 'user',
    plan: 'trial',
    status: 'active',
    registeredAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    subscriptionExpiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString() // 5 days left in trial
  },
  {
    id: 'user-marcus',
    email: 'marcus.wong@nus.edu.sg',
    name: 'Marcus Wong',
    role: 'user',
    plan: '3_months',
    status: 'active',
    registeredAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
    subscriptionExpiresAt: new Date(Date.now() + 72 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'user-jordan',
    email: 'jordan.lee@outlook.com',
    name: 'Jordan Lee',
    role: 'user',
    plan: 'expired',
    status: 'active',
    registeredAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    subscriptionExpiresAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() // Expired 3 days ago
  },
  {
    id: 'user-alex',
    email: 'alex.tan@techcorp.com.sg',
    name: 'Alex Tan',
    role: 'user',
    plan: 'expired',
    status: 'pending_payment',
    pendingPaymentPlan: '6_months',
    registeredAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    subscriptionExpiresAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  }
];

// Pre-seeded Submissions
const INITIAL_SUBMISSIONS: PaymentSubmission[] = [
  {
    id: 'sub-20261014-01',
    userId: 'user-alex',
    userEmail: 'alex.tan@techcorp.com.sg',
    planId: '6_months',
    planName: '6 Months Pro Plan',
    amountSGD: 69,
    transactionRef: 'DBS-20261014-98421',
    receiptImageUrl: SAMPLE_RECEIPT_IMAGE,
    submittedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    status: 'pending'
  }
];

// Helper: Read or Initialize Users
export function getUsers(): User[] {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(INITIAL_USERS));
      return INITIAL_USERS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to read users from localStorage:', e);
    return INITIAL_USERS;
  }
}

export function saveUsers(users: User[]): void {
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  } catch (e) {
    console.error('Failed to save users:', e);
  }
}

// Helper: Get Logged In User
export function getCurrentUser(): User | null {
  try {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    if (!raw) {
      // Default to Sarah Chen (an active trial user) so new visitors experience the full SaaS app immediately
      const defaultUser = getUsers().find(u => u.email === 'sarah.chen@gmail.com') || null;
      if (defaultUser) {
        setCurrentUser(defaultUser);
        return defaultUser;
      }
      return null;
    }
    const stored = JSON.parse(raw);
    // Sync with master list to get fresh plan & status updates
    const fresh = getUsers().find(u => u.id === stored.id || u.email.toLowerCase() === stored.email.toLowerCase());
    return fresh || stored;
  } catch {
    return null;
  }
}

export function setCurrentUser(user: User | null): void {
  try {
    if (!user) {
      localStorage.removeItem(CURRENT_USER_KEY);
    } else {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    }
  } catch (e) {
    console.error('Failed to set current user:', e);
  }
}

// Authentication Service
export function loginUser(emailInput: string, passwordInput: string): { success: boolean; user?: User; error?: string } {
  const trimmedEmail = emailInput.trim();
  const lowerEmail = trimmedEmail.toLowerCase();

  // 1. Check Hardcoded Admin Account
  if (trimmedEmail === 'Admin@kmh' || lowerEmail === 'admin@kmh') {
    if (passwordInput === '1March99.') {
      const users = getUsers();
      let admin = users.find(u => u.email.toLowerCase() === 'admin@kmh');
      if (!admin) {
        admin = INITIAL_USERS[0];
        saveUsers([admin, ...users]);
      }
      setCurrentUser(admin);
      return { success: true, user: admin };
    } else {
      return { success: false, error: 'Invalid password for Admin account.' };
    }
  }

  // 2. Normal User Lookup
  const users = getUsers();
  const existing = users.find(u => u.email.toLowerCase() === lowerEmail);

  if (!existing) {
    return { success: false, error: 'No account found with this email. Please sign up for a 7-day free trial.' };
  }

  if (existing.status === 'blocked') {
    return { success: false, error: 'This account has been suspended by the administrator.' };
  }

  // Check password if set (or allow demo accounts without passwords)
  if (existing.password && existing.password !== passwordInput) {
    return { success: false, error: 'Incorrect password.' };
  }

  setCurrentUser(existing);
  return { success: true, user: existing };
}

export function registerUser(nameInput: string, emailInput: string, passwordInput: string): { success: boolean; user?: User; error?: string } {
  const name = nameInput.trim();
  const email = emailInput.trim();
  const lowerEmail = email.toLowerCase();

  if (!name) {
    return { success: false, error: 'Please enter your full name.' };
  }

  // Strict Anti-Temp Mail Validation
  const validation = validateEmailAddress(email);
  if (!validation.isValid) {
    return { success: false, error: validation.error || 'Temporary or disposable email addresses are strictly prohibited.' };
  }

  if (passwordInput.length < 6) {
    return { success: false, error: 'Password must be at least 6 characters long.' };
  }

  const users = getUsers();
  const existing = users.find(u => u.email.toLowerCase() === lowerEmail);
  if (existing) {
    return { success: false, error: 'An account with this email address already exists. Please sign in.' };
  }

  // Automatic 7-Day Free Trial Assignment
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SEVEN_DAYS_MS);

  const newUser: User = {
    id: `user-${Date.now()}`,
    name,
    email,
    password: passwordInput,
    role: 'user',
    plan: 'trial',
    status: 'active',
    registeredAt: now.toISOString(),
    subscriptionExpiresAt: expiresAt.toISOString()
  };

  const updatedUsers = [newUser, ...users];
  saveUsers(updatedUsers);
  setCurrentUser(newUser);

  return { success: true, user: newUser };
}

// Plan & Subscription Helpers
export function isSubscriptionActive(user: User | null): boolean {
  if (!user) return false;
  if (user.role === 'admin' || user.email.toLowerCase() === 'admin@kmh') return true;
  if (user.status === 'blocked') return false;

  const expiry = new Date(user.subscriptionExpiresAt).getTime();
  const now = Date.now();
  return now < expiry && user.plan !== 'expired';
}

export function getRemainingDays(user: User | null): number {
  if (!user) return 0;
  if (user.role === 'admin' || user.email.toLowerCase() === 'admin@kmh') return 9999;
  
  const expiry = new Date(user.subscriptionExpiresAt).getTime();
  const now = Date.now();
  const diff = expiry - now;
  if (diff <= 0) return 0;
  return Math.ceil(diff / (24 * 60 * 60 * 1000));
}

// Admin: Plan Management
export function updateUserPlan(userId: string, planId: SubscriptionPlanId, customDays?: number): void {
  const users = getUsers();
  const now = Date.now();
  let duration = SEVEN_DAYS_MS;

  if (customDays !== undefined) {
    duration = customDays * 24 * 60 * 60 * 1000;
  } else if (planId === 'trial') {
    duration = SEVEN_DAYS_MS;
  } else if (planId === '3_months') {
    duration = NINETY_DAYS_MS;
  } else if (planId === '6_months') {
    duration = ONE_EIGHTY_DAYS_MS;
  } else if (planId === '1_year') {
    duration = THREE_SIXTY_FIVE_DAYS_MS;
  } else if (planId === 'lifetime') {
    duration = 100 * THREE_SIXTY_FIVE_DAYS_MS;
  } else if (planId === 'expired') {
    duration = 0;
  }

  const updated = users.map(u => {
    if (u.id === userId) {
      return {
        ...u,
        plan: planId,
        status: (u.status === 'pending_payment' ? 'active' : u.status) as UserAccountStatus,
        subscriptionExpiresAt: new Date(now + duration).toISOString()
      };
    }
    return u;
  });

  saveUsers(updated);

  // Sync current user if it's the one modified
  const current = getCurrentUser();
  if (current && current.id === userId) {
    setCurrentUser(updated.find(u => u.id === userId) || null);
  }
}

export function updateUserStatus(userId: string, status: UserAccountStatus): void {
  const users = getUsers();
  const updated = users.map(u => u.id === userId ? { ...u, status } : u);
  saveUsers(updated);

  const current = getCurrentUser();
  if (current && current.id === userId) {
    setCurrentUser(updated.find(u => u.id === userId) || null);
  }
}

export function deleteUser(userId: string): void {
  const users = getUsers().filter(u => u.id !== userId);
  saveUsers(users);
}

// DBS Bank Settings Management
export function getDBSBankSettings(): DBSBankSettings {
  try {
    const raw = localStorage.getItem(DBS_SETTINGS_KEY);
    if (!raw) {
      localStorage.setItem(DBS_SETTINGS_KEY, JSON.stringify(DEFAULT_DBS_SETTINGS));
      return DEFAULT_DBS_SETTINGS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_DBS_SETTINGS;
  }
}

export function updateDBSBankSettings(newSettings: DBSBankSettings): void {
  try {
    localStorage.setItem(DBS_SETTINGS_KEY, JSON.stringify(newSettings));
  } catch (e) {
    console.error('Failed to update DBS bank settings:', e);
  }
}

// DBS Payment Submissions Management
export function getPaymentSubmissions(): PaymentSubmission[] {
  try {
    const raw = localStorage.getItem(PAYMENTS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(PAYMENTS_STORAGE_KEY, JSON.stringify(INITIAL_SUBMISSIONS));
      return INITIAL_SUBMISSIONS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_SUBMISSIONS;
  }
}

export function savePaymentSubmissions(subs: PaymentSubmission[]): void {
  try {
    localStorage.setItem(PAYMENTS_STORAGE_KEY, JSON.stringify(subs));
  } catch (e) {
    console.error('Failed to save payment submissions:', e);
  }
}

export function createPaymentSubmission(
  user: User, 
  planId: '3_months' | '6_months' | '1_year',
  transactionRef: string,
  receiptImageUrl: string
): PaymentSubmission {
  const settings = getDBSBankSettings();
  const planNames: Record<string, string> = {
    '3_months': '3 Months Plan',
    '6_months': '6 Months Plan',
    '1_year': '1 Year Plan'
  };

  const newSub: PaymentSubmission = {
    id: `sub-${Date.now()}`,
    userId: user.id,
    userEmail: user.email,
    planId,
    planName: planNames[planId] || 'VeritasAI Plan',
    amountSGD: settings.prices[planId] || 39,
    transactionRef: transactionRef.trim(),
    receiptImageUrl,
    submittedAt: new Date().toISOString(),
    status: 'pending'
  };

  const current = getPaymentSubmissions();
  savePaymentSubmissions([newSub, ...current]);

  // Update user status to pending_payment
  const users = getUsers();
  const updatedUsers = users.map(u => {
    if (u.id === user.id) {
      return {
        ...u,
        status: 'pending_payment' as UserAccountStatus,
        pendingPaymentPlan: planId
      };
    }
    return u;
  });
  saveUsers(updatedUsers);

  // Sync current user
  const freshUser = updatedUsers.find(u => u.id === user.id);
  if (freshUser) {
    setCurrentUser(freshUser);
  }

  return newSub;
}

export function approvePayment(submissionId: string): void {
  const subs = getPaymentSubmissions();
  const sub = subs.find(s => s.id === submissionId);
  if (!sub) return;

  const now = new Date();
  const updatedSubs = subs.map(s => {
    if (s.id === submissionId) {
      return {
        ...s,
        status: 'approved' as const,
        reviewedAt: now.toISOString()
      };
    }
    return s;
  });
  savePaymentSubmissions(updatedSubs);

  // Activate user plan
  updateUserPlan(sub.userId, sub.planId);
}

export function rejectPayment(submissionId: string, adminNote?: string): void {
  const subs = getPaymentSubmissions();
  const sub = subs.find(s => s.id === submissionId);
  if (!sub) return;

  const now = new Date();
  const updatedSubs = subs.map(s => {
    if (s.id === submissionId) {
      return {
        ...s,
        status: 'rejected' as const,
        adminNote: adminNote || 'Payment verification failed. Please check your transaction reference.',
        reviewedAt: now.toISOString()
      };
    }
    return s;
  });
  savePaymentSubmissions(updatedSubs);

  // Set user status back to active (or expired)
  const users = getUsers();
  const updatedUsers = users.map(u => {
    if (u.id === sub.userId) {
      return {
        ...u,
        status: 'active' as UserAccountStatus,
        pendingPaymentPlan: undefined
      };
    }
    return u;
  });
  saveUsers(updatedUsers);

  const current = getCurrentUser();
  if (current && current.id === sub.userId) {
    setCurrentUser(updatedUsers.find(u => u.id === sub.userId) || null);
  }
}
