// Explicit, one-time deployment maintenance. No credentials or account rows are printed.
if (process.env.VERITAS_DB_MIGRATE_ON_BUILD === "1") {
  if (!process.env.DATABASE_URL) throw new Error("Database migration requires the project's private database configuration.");
  const { query, closeStorage } = await import("../server/storage.js");
  try {
    const [migration] = await query("SELECT version FROM schema_migrations WHERE version=$1", ["002_referrals"]);
    const [counts] = await query("SELECT (SELECT COUNT(*) FROM accounts) AS accounts,(SELECT COUNT(*) FROM account_mailboxes) AS mailbox_identities");
    if (!migration) throw new Error("Migration version was not finalized.");
    console.log(JSON.stringify({ event: "referral_database_migration", success: true, version: migration.version, accounts: Number(counts.accounts), mailboxIdentities: Number(counts.mailbox_identities) }));
  } catch {
    throw new Error("Database migration could not complete. Check schema access and bundled email policy data.");
  } finally { await closeStorage(); }
}
