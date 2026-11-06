import type {
  User,
  DBSBankSettings,
  PaymentSubmission,
  SubscriptionPlanId,
  UserAccountStatus,
} from "../types";
// Compatibility exports for retired UI components. Authorization and billing are never browser decisions.
const retired = (): never => {
  throw new Error(
    "This legacy operation is disabled. Use server account and document APIs.",
  );
};
export const DEFAULT_DBS_SETTINGS: DBSBankSettings = {
  accountHolderName: "",
  bankName: "",
  accountNumber: "",
  payNowNumber: "",
  qrCodeUrl: "",
  prices: { "3_months": 0, "6_months": 0, "1_year": 0 },
  instructions: "Payments are disabled.",
};
export function getUsers(): User[] {
  return [];
}
export function saveUsers(_users: User[]): void {
  retired();
}
export function getCurrentUser(): User | null {
  return null;
}
export function setCurrentUser(_user: User | null): void {
  retired();
}
export function loginUser(
  _email: string,
  _password: string,
): { success: boolean; user?: User; error?: string } {
  return {
    success: false,
    error: "Use server sign-in in the writing workspace.",
  };
}
export function registerUser(
  _name: string,
  _email: string,
  _password: string,
): { success: boolean; user?: User; error?: string } {
  return {
    success: false,
    error: "Use server registration in the writing workspace.",
  };
}
export function isSubscriptionActive(_user: User | null): boolean {
  return false;
}
export function getRemainingDays(_user: User | null): number {
  return 0;
}
export function updateUserPlan(
  _id: string,
  _plan: SubscriptionPlanId,
  _days?: number,
): void {
  retired();
}
export function updateUserStatus(
  _id: string,
  _status: UserAccountStatus,
): void {
  retired();
}
export function deleteUser(_id: string): void {
  retired();
}
export function getDBSBankSettings(): DBSBankSettings {
  return DEFAULT_DBS_SETTINGS;
}
export function updateDBSBankSettings(_settings: DBSBankSettings): void {
  retired();
}
export function getPaymentSubmissions(): PaymentSubmission[] {
  return [];
}
export function savePaymentSubmissions(
  _submissions: PaymentSubmission[],
): void {
  retired();
}
export function createPaymentSubmission(
  _user: User,
  _plan: "3_months" | "6_months" | "1_year",
  _reference: string,
  _receipt: string,
): PaymentSubmission {
  return retired();
}
export function approvePayment(_id: string): void {
  retired();
}
export function rejectPayment(_id: string, _note?: string): void {
  retired();
}
