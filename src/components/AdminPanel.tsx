import { useEffect, useRef, useState } from "react";
import { LoaderCircle, RefreshCw, ShieldCheck, X } from "lucide-react";
import { readApiResponse } from "../utils/apiResponse";

type AdminOverview = {
  stats: {
    accounts: number;
    verifiedAccounts: number;
    documents: number;
    referrals: number;
    referralCredits: number;
    bonusBalance: number;
  };
  users: { id: string; email: string; verified: boolean; createdAt: string; creditBalance: number }[];
  services: { geminiConfigured: boolean; gatewayAuthenticated: boolean };
};
const statLabels: { key: keyof AdminOverview["stats"]; label: string }[] = [
  { key: "accounts", label: "Accounts" },
  { key: "verifiedAccounts", label: "Verified accounts" },
  { key: "documents", label: "Saved documents" },
  { key: "referrals", label: "Referrals" },
  { key: "referralCredits", label: "Referral credits earned" },
  { key: "bonusBalance", label: "Available bonus credits" },
];
function isOverview(value: any): value is AdminOverview {
  return Boolean(value?.stats && statLabels.every(({ key }) => Number.isSafeInteger(value.stats[key]) && value.stats[key] >= 0) &&
    Array.isArray(value.users) && value.users.length <= 50 && value.users.every((user: any) =>
      user && typeof user.id === "string" && typeof user.email === "string" && typeof user.verified === "boolean" &&
      typeof user.createdAt === "string" && Number.isSafeInteger(user.creditBalance) && user.creditBalance >= 0) &&
    typeof value.services?.geminiConfigured === "boolean" && typeof value.services?.gatewayAuthenticated === "boolean");
}
function joinedDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Unknown" : date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export default function AdminPanel({ onClose }: { onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [loading, setLoading] = useState(true), [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    dialog.current?.showModal();
    return () => dialog.current?.close();
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError(""); setOverview(null);
    fetch("/api/admin/overview", { credentials: "same-origin", cache: "no-store", signal: controller.signal })
      .then(readApiResponse).then((data) => {
        if (!isOverview(data)) throw new Error("The dashboard returned an incomplete overview. Please try again.");
        setOverview(data);
      }).catch((error: unknown) => {
        if (!controller.signal.aborted) setError(error instanceof Error ? error.message : "The dashboard is temporarily unavailable.");
      }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [refresh]);
  return <dialog ref={dialog} className="auth-dialog admin-dialog" onCancel={onClose} aria-labelledby="admin-heading" aria-describedby="admin-description">
    <button className="icon-button close-dialog" onClick={onClose} aria-label="Close admin dashboard"><X size={21} /></button>
    <span className="brand-mark"><ShieldCheck size={25} /></span>
    <h2 id="admin-heading">Admin Dashboard</h2>
    <p id="admin-description">A read-only overview of accounts, saved documents, invitations, and service configuration.</p>
    {loading && <p className="admin-loading" role="status"><LoaderCircle size={18} className="spin" aria-hidden="true" />Loading dashboard…</p>}
    {error && <p className="error-message" role="alert">{error}</p>}
    {overview && <>
      <dl className="admin-stats">{statLabels.map(({ key, label }) => <div key={key}><dt>{label}</dt><dd>{overview.stats[key].toLocaleString()}</dd></div>)}</dl>
      <section className="admin-services" aria-labelledby="admin-services-heading">
        <h3 id="admin-services-heading">Engine configuration</h3>
        <dl><div><dt>Gemini API key</dt><dd>{overview.services.geminiConfigured ? "Configured" : "Not configured"}</dd></div><div><dt>Gateway authentication</dt><dd>{overview.services.gatewayAuthenticated ? "Credentials available" : "Not available"}</dd></div></dl>
        <p>Configuration does not confirm a successful provider request. Provider verification, credits, or service availability may still be required.</p>
      </section>
      <section className="admin-accounts" aria-labelledby="admin-accounts-heading">
        <h3 id="admin-accounts-heading">Latest accounts</h3>
        {overview.users.length ? <div className="admin-table-scroll" tabIndex={0} role="region" aria-label="Latest accounts table"><table><caption>Up to 50 most recently created accounts</caption><thead><tr><th scope="col">Email</th><th scope="col">Status</th><th scope="col">Joined</th><th scope="col">Bonus credits</th></tr></thead><tbody>{overview.users.map((user) => <tr key={user.id}><td>{user.email}</td><td><span className={`admin-account-status ${user.verified ? "verified" : ""}`}>{user.verified ? "Verified" : "Unverified"}</span></td><td>{joinedDate(user.createdAt)}</td><td>{user.creditBalance.toLocaleString()}</td></tr>)}</tbody></table></div> : <p>No accounts to display.</p>}
      </section>
    </>}
    <button className="button secondary admin-refresh" disabled={loading} onClick={() => setRefresh((value) => value + 1)}><RefreshCw size={15} aria-hidden="true" />Refresh overview</button>
  </dialog>;
}
