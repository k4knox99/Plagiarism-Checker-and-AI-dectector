-- Additive schema. The application backfills normalized mailbox identities in
-- creation order and records 002_referrals only after that step succeeds.
-- Existing duplicate mailbox accounts and their documents are retained.
CREATE TABLE IF NOT EXISTS account_mailboxes (mailbox_key TEXT PRIMARY KEY, user_id TEXT UNIQUE NOT NULL REFERENCES accounts(id) ON DELETE CASCADE, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS referral_codes (user_id TEXT PRIMARY KEY REFERENCES accounts(id) ON DELETE CASCADE, code TEXT UNIQUE NOT NULL, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS referral_attributions (referred_user_id TEXT PRIMARY KEY REFERENCES accounts(id) ON DELETE CASCADE, referrer_user_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE, created_at TEXT NOT NULL, CHECK(referred_user_id <> referrer_user_id));
CREATE INDEX IF NOT EXISTS referral_attributions_owner ON referral_attributions(referrer_user_id);
CREATE TABLE IF NOT EXISTS referral_rewards (referred_user_id TEXT PRIMARY KEY REFERENCES accounts(id) ON DELETE CASCADE, referrer_user_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE, credits INTEGER NOT NULL CHECK(credits >= 0), awarded_at TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS referral_rewards_month ON referral_rewards(referrer_user_id,awarded_at);
CREATE TABLE IF NOT EXISTS credit_balances (user_id TEXT PRIMARY KEY REFERENCES accounts(id) ON DELETE CASCADE, credits INTEGER NOT NULL DEFAULT 0 CHECK(credits >= 0));
CREATE TABLE IF NOT EXISTS credit_spends (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE, state TEXT NOT NULL CHECK(state IN ('reserved','spent','refunded')), reserved_at TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS credit_spends_owner ON credit_spends(user_id,reserved_at);
