import { mkdirSync } from "node:fs";
import path from "node:path";
import { Pool } from "pg";
import { assessEmail } from "./email-policy.js";
import { referralSchemaStatements } from "./referral-schema.js";

let ready: Promise<void> | undefined;
let pool: Pool | undefined;
let sqlite: any;
export class StorageConfigurationError extends Error {
  constructor() {
    super("Persistent DATABASE_URL is required on Vercel.");
  }
}

async function queryRaw(sql: string, params: any[] = []): Promise<any[]> {
  if (pool) return (await pool.query(sql, params)).rows;
  const statement = sqlite.prepare(sql.replace(/\$\d+/g, "?"));
  return statement.all(...params);
}

async function initialize() {
  if (process.env.DATABASE_URL) {
    // Provider SSL options belong in DATABASE_URL; certificate verification stays enabled.
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 5,
      connectionTimeoutMillis: 5000,
    });
    // A migrated hosted database needs one read per cold start, not repeated DDL.
    try {
      const applied = await queryRaw(
        "SELECT version FROM schema_migrations WHERE version=$1",
        ["002_referrals"],
      );
      if (applied.length) return;
    } catch (error: any) {
      if (error?.code !== "42P01") throw error;
    }
  } else {
    if (process.env.VERCEL) throw new StorageConfigurationError();
    const directory = path.resolve(process.env.DATA_DIR || "./data");
    mkdirSync(directory, { recursive: true, mode: 0o700 });
    const { DatabaseSync } = await import("node:sqlite");
    sqlite = new DatabaseSync(path.join(directory, "veritas.sqlite"));
    sqlite.exec(
      "PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;",
    );
  }
  for (const sql of [
    "CREATE TABLE IF NOT EXISTS accounts (id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, created_at TEXT NOT NULL, verified_at TEXT)",
    "CREATE TABLE IF NOT EXISTS sessions (token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE, expires_at BIGINT NOT NULL)",
    "CREATE TABLE IF NOT EXISTS documents (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE, title TEXT NOT NULL, content TEXT NOT NULL, report TEXT, updated_at TEXT NOT NULL)",
    "CREATE TABLE IF NOT EXISTS verification_requests (user_id TEXT PRIMARY KEY REFERENCES accounts(id) ON DELETE CASCADE,request_id TEXT NOT NULL,last_sent BIGINT NOT NULL,expires_at BIGINT NOT NULL,attempts INTEGER NOT NULL)",
    "CREATE INDEX IF NOT EXISTS documents_owner ON documents(user_id)",
    "CREATE TABLE IF NOT EXISTS rate_limits (key TEXT PRIMARY KEY, hits INTEGER NOT NULL, expires_at BIGINT NOT NULL)",
  ])
    await queryRaw(sql);
  // Existing accounts remain unverified until they prove email ownership.
  if (pool)
    await queryRaw(
      "ALTER TABLE accounts ADD COLUMN IF NOT EXISTS verified_at TEXT",
    );
  else if (
    !sqlite
      .prepare("PRAGMA table_info(accounts)")
      .all()
      .some((column: any) => column.name === "verified_at")
  )
    sqlite.exec("ALTER TABLE accounts ADD COLUMN verified_at TEXT");
  await queryRaw(
    "CREATE UNIQUE INDEX IF NOT EXISTS accounts_email_normalized ON accounts(lower(email))",
  );
  await queryRaw(
    "CREATE INDEX IF NOT EXISTS sessions_expiry ON sessions(expires_at)",
  );
  await queryRaw(
    "CREATE INDEX IF NOT EXISTS rate_limits_expiry ON rate_limits(expires_at)",
  );
  await queryRaw(
    "CREATE TABLE IF NOT EXISTS schema_migrations (version TEXT PRIMARY KEY,applied_at TEXT NOT NULL)",
  );
  await queryRaw(
    "INSERT INTO schema_migrations (version,applied_at) VALUES ($1,$2) ON CONFLICT(version) DO NOTHING",
    ["001_email_verification", new Date().toISOString()],
  );
  for (const sql of referralSchemaStatements) await queryRaw(sql);
  // Preserve legacy accounts and documents. One mailbox owner is selected in
  // creation order when historical Gmail aliases share an inbox.
  const existing = await queryRaw("SELECT id,email,created_at FROM accounts ORDER BY created_at,id");
  for (const account of existing) {
    try {
      const identity = assessEmail(account.email);
      await queryRaw("INSERT INTO account_mailboxes (mailbox_key,user_id,created_at) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING", [identity.mailboxKey, account.id, account.created_at]);
    } catch (error: any) {
      if (error?.code !== "INVALID_EMAIL") throw error;
    }
  }
  await queryRaw("INSERT INTO schema_migrations (version,applied_at) VALUES ($1,$2) ON CONFLICT(version) DO NOTHING", ["002_referrals", new Date().toISOString()]);
}

async function ensureReady() {
  ready ||= initialize().catch((error) => {
    ready = undefined;
    throw error;
  });
  await ready;
}
export type Query = (sql: string, params?: any[]) => Promise<any[]>;
let sqliteQueue: Promise<void> = Promise.resolve();
async function serialized<T>(work: () => Promise<T>): Promise<T> {
  const preceding = sqliteQueue;
  let release!: () => void;
  sqliteQueue = new Promise<void>((resolve) => { release = resolve; });
  await preceding;
  try { return await work(); } finally { release(); }
}
export async function query(sql: string, params: any[] = []) {
  await ensureReady();
  return pool ? queryRaw(sql, params) : serialized(() => queryRaw(sql, params));
}
export async function transaction<T>(work: (query: Query) => Promise<T>): Promise<T> {
  await ensureReady();
  if (pool) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const result = await work(async (sql, params = []) => (await client.query(sql, params)).rows);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK").catch(() => {});
      throw error;
    } finally { client.release(); }
  }
  return serialized(async () => {
    sqlite.exec("BEGIN IMMEDIATE");
    try { const result = await work(queryRaw); sqlite.exec("COMMIT"); return result; }
    catch (error) { sqlite.exec("ROLLBACK"); throw error; }
  });
}
// Maintenance scripts close their own process-local connection after migration.
export async function closeStorage() {
  if (pool) { await pool.end(); pool = undefined; }
  if (sqlite) { sqlite.close(); sqlite = undefined; }
  ready = undefined;
}
