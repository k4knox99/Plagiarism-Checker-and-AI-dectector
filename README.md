# Veritas — writing integrity workspace

A responsive writing studio with AI signal analysis, plagiarism source checks, a four-tone writing rewrite tool, and a private server document library.

## Run locally

Requires Node 22.13+ (tested on Node 24).

```sh
npm ci
npm run dev
```

Open http://localhost:3000 and register with a password of at least 12 characters. Configure the email provider below to confirm the account. SQLite is created under `data/` and persists across restarts. No API key is needed for local pattern analysis; rewrites and web search need a server-side AI provider.

## Production

Set `APP_ORIGIN` to the exact HTTPS origin without a trailing slash. Set `DATABASE_URL` to a private PostgreSQL database for Vercel or multiple instances. Use provider-approved, certificate-verified TLS. Schema creation is automatic; table/index creation privileges are required on first startup.

Set `GEMINI_API_KEY` or `AI_GATEWAY_API_KEY` on the server to enable model analysis, rewrites, and grounded web search. Vercel deployments can also authenticate Gateway through their OIDC token. Never prefix a secret with `VITE_`.

Run `npm ci`, `npm run build`, then `npm start`. Start selects production mode. Place self-hosted servers behind HTTPS. A single self-hosted process may use SQLite instead, with `DATA_DIR` on a persistent private volume. Vercel refuses SQLite fallback because its filesystem is ephemeral.

See [deployment instructions](VERCEL_DEPLOYMENT.md) and [security review](SECURITY.md).

## Save, load, and privacy

Sign in, write or import TXT/Markdown/DOCX/PDF, and choose **Save document**. Reopen, search, export, or delete saved drafts and reports from your account library. Saving is explicit; unsaved edits trigger a navigation warning. Limits: 100 documents per account, 15,000 characters per document, 2 MB per imported file.

Analysis and PDF import send text/files to the server. Model analysis and rewrites share text with the configured AI provider; plagiarism checks also use its web search. DOCX parsing is local and its library loads only when needed. Passwords are hashed; browser storage is not used for credentials or document persistence. Production session cookies are Secure, HttpOnly, and SameSite=Strict.

Documents and reports live in the configured database. Recent scan results are cached in process memory for up to 30 minutes, with 50 entries maximum and full-text/account-separated keys. Expired entries are removed on the next cache write. Deleting a document does not purge database backups, caches, or prior provider submissions. Database encryption, backup, access, and retention controls are the deployer's responsibility.

## Limitations and migration

AI scores are estimates, not proof of authorship. Similarity is not a plagiarism verdict. Search coverage is incomplete; manually check suggested sources. Unavailable web search reports **Not checked**, never a certificate of originality.

The old browser-only subscriptions, payment receipts, admin/demo accounts, bearer sign-in, certificates, and guaranteed detector-evasion features are retired. Old browser credentials and sessions are cleared on first load and are not migrated. Create a new server account. Email confirmation is required. Password reset, MFA, billing, and an administrator interface are not implemented.

## Validation

```sh
npm test
npm run lint
npm run build
npm audit
```

Integration tests use temporary SQLite databases in ignored `work/`. They cover account isolation, authentication, session revocation/expiry, rate limits, validation, cache separation, and unavailable-service behavior. CI runs on Node 22 and 24. Hosted PostgreSQL and live Gemini require deployment credentials and are not included in the offline suite.

## Email confirmation update

All new and existing accounts must prove email ownership before saving/loading private documents, importing PDFs, or running analysis. Existing account IDs, passwords and documents are retained; previously issued sessions are checked against verification state on every protected request. Nobody is automatically marked verified.

The preview uses Neon Managed Auth email OTP delivery with the configured custom SMTP sender. The app keeps its existing password/session identity and uses Neon only to consume a single-use email code and return a verified email-ownership proof. A small managed email identity is created by the OTP provider; it does not create another application account or change document ownership. Its temporary provider session is discarded after verification. No app passwords are sent to Neon Auth.

Set server-only NEON_AUTH_BASE_URL to the branch Auth URL. Server requests include the configured provider's Origin, which Neon requires even for server-to-server OTP calls. The confirmation screen supports resend with a 60-second cooldown; each challenge allows five attempts, expires within ten minutes (the provider can expire it sooner), and is bound to the signed-in account. SMTP acceptance is distinct from inbox delivery; public errors do not expose SMTP credentials or codes.

Apply the versioned migration in server/migrations/001_email_verification.sql. It adds nullable verified_at, a normalized unique email index and bounded verification state; it does not mark existing users verified or delete their data. Hosted cold starts read the migration version rather than rerunning schema DDL each time.

## Live analysis configuration

Gemini keys remain supported. Vercel deployments also use AI Gateway through their short-lived VERCEL_OIDC_TOKEN; AI_GATEWAY_MODEL selects a model, currently openai/gpt-5.4-mini. Web similarity uses actual provider web search and returns only URLs present in source metadata. Provider account/credit requirements still apply. Results identify local fallback estimates if the AI service is unavailable; fallback scores are never proof of authorship or originality.

Choose **Humanize & rewrite** for Natural, Professional, Academic, or Concise edits. Review the original and rewritten drafts side by side, copy or download the output, and save the result with its source draft. **Use in editor** applies the new text and clears scans made against the old text. Rewrites require a working model; provider failures return an error and preserve the original. The app does not fabricate a successful rewrite or promise a detector score.
