import { mkdirSync } from "node:fs";
import path from "node:path";
import { Pool } from "pg";

let ready: Promise<void> | undefined;
let pool: Pool | undefined;
let sqlite: any;

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
  } else {
    if (process.env.VERCEL)
      throw new Error("Persistent DATABASE_URL is required on Vercel.");
    const directory = path.resolve(process.env.DATA_DIR || "./data");
    mkdirSync(directory, { recursive: true, mode: 0o700 });
    const { DatabaseSync } = await import("node:sqlite");
    sqlite = new DatabaseSync(path.join(directory, "veritas.sqlite"));
    sqlite.exec(
      "PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;",
    );
  }
  for (const sql of [
    "CREATE TABLE IF NOT EXISTS accounts (id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, created_at TEXT NOT NULL)",
    "CREATE TABLE IF NOT EXISTS sessions (token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE, expires_at BIGINT NOT NULL)",
    "CREATE TABLE IF NOT EXISTS documents (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE, title TEXT NOT NULL, content TEXT NOT NULL, report TEXT, updated_at TEXT NOT NULL)",
    "CREATE INDEX IF NOT EXISTS documents_owner ON documents(user_id)",
    "CREATE TABLE IF NOT EXISTS rate_limits (key TEXT PRIMARY KEY, hits INTEGER NOT NULL, expires_at BIGINT NOT NULL)",
  ])
    await queryRaw(sql);
}

export async function query(sql: string, params: any[] = []) {
  ready ||= initialize().catch((error) => {
    ready = undefined;
    throw error;
  });
  await ready;
  return queryRaw(sql, params);
}
