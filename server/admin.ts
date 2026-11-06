import { Router } from "express";
import { requireUser, rateLimit, type UserRequest } from "./security.js";
import { isOwnerAccount } from "./owner.js";
import { query } from "./storage.js";
import { gatewayConfigured } from "./gateway.js";

export const adminRouter = Router();
adminRouter.use(requireUser, (req: UserRequest, res, next) => {
  if (!isOwnerAccount(req.userId, req.emailVerified))
    return res.status(403).json({ error: "This account does not have administrator access.", code: "ADMIN_REQUIRED" });
  next();
}, rateLimit("admin-overview", 30));
adminRouter.get("/overview", async (_req, res) => {
  try {
    const [counts] = await query("SELECT (SELECT COUNT(*) FROM accounts) AS accounts,(SELECT COUNT(verified_at) FROM accounts) AS verified_accounts,(SELECT COUNT(*) FROM documents) AS documents,(SELECT COUNT(*) FROM referral_attributions) AS referrals,(SELECT COALESCE(SUM(credits),0) FROM referral_rewards) AS referral_credits,(SELECT COALESCE(SUM(credits),0) FROM credit_balances) AS bonus_balance");
    const rows = await query("SELECT accounts.id,accounts.email,accounts.verified_at,accounts.created_at,COALESCE(credit_balances.credits,0) AS credit_balance FROM accounts LEFT JOIN credit_balances ON credit_balances.user_id=accounts.id ORDER BY accounts.created_at DESC,accounts.id LIMIT 50");
    return res.json({
      stats: { accounts: Number(counts.accounts), verifiedAccounts: Number(counts.verified_accounts), documents: Number(counts.documents), referrals: Number(counts.referrals), referralCredits: Number(counts.referral_credits), bonusBalance: Number(counts.bonus_balance) },
      users: rows.map((row) => ({ id: row.id, email: row.email, verified: Boolean(row.verified_at), createdAt: row.created_at, creditBalance: Number(row.credit_balance) })),
      services: { geminiConfigured: Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY), gatewayAuthenticated: gatewayConfigured() },
    });
  } catch { return res.status(503).json({ error: "The administrator overview is temporarily unavailable." }); }
});
