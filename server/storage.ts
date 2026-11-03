import { mkdirSync } from "node:fs";
import path from "node:path";
import { Pool } from "pg";

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
        ["001_email_verification"],
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
}

export async function query(sql: string, params: any[] = []) {
  ready ||= initialize().catch((error) => {
    ready = undefined;
    throw error;
  });
  await ready;
  return queryRaw(sql, params);
}
