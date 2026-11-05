import { useEffect, useRef, useState } from "react";
import { Check, Copy, Gift, LoaderCircle, RefreshCw, X } from "lucide-react";
import { readApiResponse } from "../utils/apiResponse";

type Referral = {
  code: string;
  linkPath: string;
  pending: number;
  verified: number;
  creditsEarned: number;
  creditBalance: number;
  bonusPerReferral: number;
  monthlyLimit: number;
  dailyFreeChecks: number;
};
function isReferral(value: any): value is Referral {
  return Boolean(value && typeof value.code === "string" && /^[A-Za-z0-9_-]{16}$/.test(value.code) &&
    value.linkPath === `/?ref=${value.code}` &&
    ["pending", "verified", "creditsEarned", "creditBalance", "bonusPerReferral", "monthlyLimit", "dailyFreeChecks"].every((key) =>
      Number.isSafeInteger(value[key]) && value[key] >= 0));
}

export default function ReferralPanel({ onClose }: { onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [referral, setReferral] = useState<Referral | null>(null);
  const [loading, setLoading] = useState(true), [error, setError] = useState("");
  const [copied, setCopied] = useState(false), [refresh, setRefresh] = useState(0);
  const link = referral ? `${window.location.origin}${referral.linkPath}` : "";
  useEffect(() => {
    dialog.current?.showModal();
    return () => dialog.current?.close();
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError(""); setReferral(null);
    fetch("/api/referrals/me", {
      method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" },
      body: "{}", signal: controller.signal,
    }).then(readApiResponse).then((data) => {
      if (!isReferral(data.referral)) throw new Error("Your invitation details could not be loaded. Please try again.");
      setReferral(data.referral);
    }).catch((error: unknown) => {
      if (!controller.signal.aborted) setError(error instanceof Error ? error.message : "Invitations are temporarily unavailable.");
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [refresh]);
  async function copyLink() {
    setError(""); setCopied(false);
    try { await navigator.clipboard.writeText(link); setCopied(true); }
    catch { setError("Copy is unavailable. Select the invitation link below and copy it manually."); }
  }
  return <dialog ref={dialog} className="auth-dialog referral-dialog" onCancel={onClose} aria-labelledby="referral-heading" aria-describedby="referral-description">
    <button className="icon-button close-dialog" onClick={onClose} aria-label="Close invitations"><X size={21} /></button>
    <span className="brand-mark"><Gift size={25} /></span>
    <h2 id="referral-heading">Better writing, together.</h2>
    <p id="referral-description">Invite friends to Veritas and earn extra checks when eligible new accounts confirm their email.</p>
    {loading && <p className="referral-loading" role="status"><LoaderCircle size={18} className="spin" />Loading your invitation…</p>}
    {error && <p className="error-message" role="alert">{error}</p>}
    {referral && <>
      <div className="referral-balance"><span>Available bonus credits</span><strong>{referral.creditBalance.toLocaleString()}</strong><p>One credit adds one tool request after your daily free checks are used.</p></div>
      <div className="referral-stats" aria-label="Invitation progress">
        <div><strong>{referral.pending.toLocaleString()}</strong><span>Awaiting confirmation</span></div>
        <div><strong>{referral.verified.toLocaleString()}</strong><span>Verified invitations</span></div>
        <div><strong>{referral.creditsEarned.toLocaleString()}</strong><span>Total credits earned</span></div>
      </div>
      <label className="referral-link-label" htmlFor="referral-link">Your invitation link</label>
      <div className="referral-link-row"><input id="referral-link" readOnly value={link} onFocus={(event) => event.currentTarget.select()} /><button className="button" onClick={copyLink}>{copied ? <Check size={16} /> : <Copy size={16} />}{copied ? "Copied" : "Copy link"}</button></div>
      {copied && <p className="auth-feedback" role="status">Invitation link copied. Share it with a friend who wants to join.</p>}
      <div className="referral-rules"><h3>How bonus checks work</h3><ul>
        <li>Earn {referral.bonusPerReferral} credits for each eligible new friend who signs up with your link and confirms a permanent email address.</li>
        <li>Each mailbox can qualify once. Existing accounts, duplicate mailboxes, and temporary email addresses do not qualify.</li>
        <li>Earn up to {referral.monthlyLimit} bonus credits per calendar month. The monthly limit resets at midnight UTC on the first day of the month.</li>
        <li>Your {referral.dailyFreeChecks} daily free checks are used first, then available bonus credits. The limit of 12 requests per minute still applies.</li>
        <li>A bonus check is reserved when processing starts. Cached results, server-rejected requests, and unavailable source checks are refunded; stopping a request after processing begins can use a check.</li>
      </ul><p>Credits have no cash value and increase this website’s request allowance. AI features still depend on the AI service being available.</p><p>Invitation links use this website address. Friends need access to the website, including access to a protected preview if you are using one.</p></div>
    </>}
    {!loading && <button className="button secondary referral-refresh" onClick={() => { setCopied(false); setRefresh((value) => value + 1); }}><RefreshCw size={15} />Refresh progress</button>}
  </dialog>;
}
