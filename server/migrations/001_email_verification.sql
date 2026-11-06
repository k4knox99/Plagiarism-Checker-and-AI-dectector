ALTER TABLE accounts ADD COLUMN IF NOT EXISTS verified_at TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS accounts_email_normalized ON accounts(lower(email));
CREATE TABLE IF NOT EXISTS verification_requests (user_id TEXT PRIMARY KEY REFERENCES accounts(id) ON DELETE CASCADE,request_id TEXT NOT NULL,last_sent BIGINT NOT NULL,expires_at BIGINT NOT NULL,attempts INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS sessions_expiry ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS rate_limits_expiry ON rate_limits(expires_at);
CREATE TABLE IF NOT EXISTS schema_migrations (version TEXT PRIMARY KEY,applied_at TEXT NOT NULL);
INSERT INTO schema_migrations (version,applied_at) VALUES ('001_email_verification',CURRENT_TIMESTAMP::text) ON CONFLICT(version) DO NOTHING;
