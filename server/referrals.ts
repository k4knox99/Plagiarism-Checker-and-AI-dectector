import { createHash, randomBytes, randomUUID } from "node:crypto";
import type { Request, Response, NextFunction } from "express";
import { query, transaction, type Query } from "./storage.js";
import { assessEmail } from "./email-policy.js";

export const referralBonus = 10, monthlyCreditLimit = 100, dailyFreeChecks = 100;
const dayMs = 86400000;
export class ReferralError extends Error {
  constructor(message: string, public status = 400, public code = "INVALID_REFERRAL") { super(message); }
}
function permanentIdentity(email: string) {
  try { const value = assessEmail(email); return value.isDisposable ? null : value; } catch { return null; }
}
export async function attachReferral(q: Query, referredId: string, mailboxKey: string, referralCode: unknown) {
  if (referralCode === undefined) return;
  if (typeof referralCode !== "string" || !/^[A-Za-z0-9_-]{16}$/.test(referralCode))
    throw new ReferralError("This invitation is invalid. Check the link or continue without an invitation.");
  const [owner] = await q("SELECT accounts.id,accounts.email,accounts.verified_at FROM referral_codes JOIN accounts ON accounts.id=referral_codes.user_id WHERE referral_codes.code=$1", [referralCode]);
  const identity = owner && permanentIdentity(owner.email);
  const [mailboxOwner] = identity ? await q("SELECT user_id FROM account_mailboxes WHERE mailbox_key=$1", [identity.mailboxKey]) : [];
  if (!owner?.verified_at || !identity || owner.id === referredId || identity.mailboxKey === mailboxKey || mailboxOwner?.user_id !== owner.id)
    throw new ReferralError("This invitation is unavailable. Continue without it or ask for another link.");
  await q("INSERT INTO referral_attributions (referred_user_id,referrer_user_id,created_at) VALUES ($1,$2,$3)", [referredId, owner.id, new Date().toISOString()]);
}
export async function awardVerifiedReferral(q: Query, referredId: string) {
  const [referral] = await q("SELECT referral_attributions.referrer_user_id,accounts.email,accounts.verified_at FROM referral_attributions JOIN accounts ON accounts.id=referral_attributions.referred_user_id WHERE referred_user_id=$1", [referredId]);
  if (!referral?.verified_at || !permanentIdentity(referral.email)) return;
  const [owner] = await q("SELECT id,email,verified_at FROM accounts WHERE id=$1", [referral.referrer_user_id]);
  const identity = owner && permanentIdentity(owner.email), referredIdentity = permanentIdentity(referral.email);
  if (!owner?.verified_at || !identity || identity.mailboxKey === referredIdentity?.mailboxKey) return;
  const [referredMailboxOwner] = await q("SELECT user_id FROM account_mailboxes WHERE mailbox_key=$1", [referredIdentity!.mailboxKey]);
  if (referredMailboxOwner?.user_id !== referredId) return;
  const [mailboxOwner] = await q("SELECT user_id FROM account_mailboxes WHERE mailbox_key=$1", [identity.mailboxKey]);
  if (mailboxOwner?.user_id !== owner.id) return;
  await q("INSERT INTO credit_balances (user_id,credits) VALUES ($1,0) ON CONFLICT(user_id) DO NOTHING", [owner.id]);
  // The wallet row serializes awards and redemptions for this referrer on Postgres.
  await q("UPDATE credit_balances SET credits=credits WHERE user_id=$1", [owner.id]);
  const now = new Date(), monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
  const [monthly] = await q("SELECT COALESCE(SUM(credits),0) AS earned FROM referral_rewards WHERE referrer_user_id=$1 AND awarded_at>=$2", [owner.id, monthStart]);
  const credits = Number(monthly.earned) + referralBonus <= monthlyCreditLimit ? referralBonus : 0;
  const inserted = await q("INSERT INTO referral_rewards (referred_user_id,referrer_user_id,credits,awarded_at) VALUES ($1,$2,$3,$4) ON CONFLICT(referred_user_id) DO NOTHING RETURNING referred_user_id", [referredId, owner.id, credits, now.toISOString()]);
  if (inserted.length && credits) await q("UPDATE credit_balances SET credits=credits+$1 WHERE user_id=$2", [credits, owner.id]);
}
export async function referralProfile(userId: string) {
  return transaction(async (q) => {
    const [user] = await q("SELECT email,verified_at FROM accounts WHERE id=$1", [userId]);
    const identity = user && permanentIdentity(user.email);
    const [owner] = identity ? await q("SELECT user_id FROM account_mailboxes WHERE mailbox_key=$1", [identity.mailboxKey]) : [];
    if (!user?.verified_at || !identity || owner?.user_id !== userId)
      throw new ReferralError("Invitations require a verified permanent email with a unique mailbox.", 403, "REFERRAL_INELIGIBLE");
    await q("INSERT INTO referral_codes (user_id,code,created_at) VALUES ($1,$2,$3) ON CONFLICT(user_id) DO NOTHING", [userId, randomBytes(12).toString("base64url"), new Date().toISOString()]);
    await q("INSERT INTO credit_balances (user_id,credits) VALUES ($1,0) ON CONFLICT(user_id) DO NOTHING", [userId]);
    const [code] = await q("SELECT code FROM referral_codes WHERE user_id=$1", [userId]);
    const [counts] = await q("SELECT COUNT(*) AS total,COUNT(accounts.verified_at) AS verified FROM referral_attributions JOIN accounts ON accounts.id=referred_user_id WHERE referrer_user_id=$1", [userId]);
    const [earned] = await q("SELECT COALESCE(SUM(credits),0) AS earned FROM referral_rewards WHERE referrer_user_id=$1", [userId]);
    const [balance] = await q("SELECT credits FROM credit_balances WHERE user_id=$1", [userId]);
    return { code: code.code, linkPath: `/?ref=${code.code}`, pending: Number(counts.total) - Number(counts.verified), verified: Number(counts.verified), creditsEarned: Number(earned.earned), creditBalance: Number(balance.credits), bonusPerReferral: referralBonus, monthlyLimit: monthlyCreditLimit, dailyFreeChecks };
  });
}
async function reserveToolUse(userId: string) {
  return transaction(async (q) => {
    const bucket = Math.floor(Date.now() / dayMs), digest = createHash("sha256").update(userId).digest("hex");
    const [usage] = await q("INSERT INTO rate_limits (key,hits,expires_at) VALUES ($1,1,$2) ON CONFLICT(key) DO UPDATE SET hits=rate_limits.hits+1 RETURNING hits", [`daily-analysis:${digest}:${bucket}`, (bucket + 1) * dayMs]);
    if (Number(usage.hits) <= dailyFreeChecks) return null;
    const debited = await q("UPDATE credit_balances SET credits=credits-1 WHERE user_id=$1 AND credits>0 RETURNING credits", [userId]);
    if (!debited.length) throw new ReferralError("Today's free checks are used and no bonus credits remain. Try again tomorrow.", 429, "DAILY_ALLOWANCE_REACHED");
    const id = randomUUID();
    await q("INSERT INTO credit_spends (id,user_id,state,reserved_at) VALUES ($1,$2,'reserved',$3)", [id, userId, new Date().toISOString()]);
    return id;
  });
}
async function settleToolUse(id: string, success: boolean) {
  await transaction(async (q) => {
    const rows = await q("UPDATE credit_spends SET state=$1 WHERE id=$2 AND state='reserved' RETURNING user_id", [success ? "spent" : "refunded", id]);
    if (!success && rows.length) await q("UPDATE credit_balances SET credits=credits+1 WHERE user_id=$1", [rows[0].user_id]);
  });
}
export async function dailyToolAllowance(req: Request & {userId?: string}, res: Response, next: NextFunction) {
  try {
    const reservation = await reserveToolUse(req.userId!);
    if (reservation) {
      const writeJson = res.json.bind(res);
      let sent = false;
      res.json = (body: any) => {
        if (sent) return res;
        sent = true;
        // Settle/refund before writing JSON so the serverless response cannot
        // finish before the wallet update. Cancellation after work starts uses a check.
        const unavailableSourceCheck = req.route?.path === "/detect/plagiarism" && body?.analysis?.verdict === "Not checked";
        void settleToolUse(reservation, res.statusCode < 400 && !unavailableSourceCheck && body?.fromCache !== true).then(() => writeJson(body)).catch(() => {
          res.status(503); writeJson({ error: "The credit service is unavailable. Please try again later." });
        });
        return res;
      };
    }
    next();
  } catch (error) {
    if (error instanceof ReferralError) {
      if (error.status === 429) res.set("Retry-After", String(Math.ceil((dayMs - Date.now() % dayMs) / 1000)));
      return res.status(error.status).json({ error: error.message, code: error.code });
    }
    return res.status(503).json({ error: "The usage allowance service is unavailable. Please try again later." });
  }
}
