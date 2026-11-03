# Veritas — writing integrity workspace

A responsive writing studio with AI signal analysis, grounded web source suggestions, and a private server document library.

## Run locally

Requires Node 22.13+ (tested on Node 24).

```sh
npm ci
npm run dev
```

Open http://localhost:3000 and register with a password of at least 12 characters. SQLite is created under `data/` and persists across restarts. No API key is needed for local pattern analysis; web search needs a server-side Gemini key.

## Production

Set `APP_ORIGIN` to the exact HTTPS origin without a trailing slash. Set `DATABASE_URL` to a private PostgreSQL database for Vercel or multiple instances. Use provider-approved, certificate-verified TLS. Schema creation is automatic; table/index creation privileges are required on first startup.

Set `GEMINI_API_KEY` on the server to enable Gemini analysis and grounded web search. Never prefix a secret with `VITE_`.

Run `npm ci`, `npm run build`, then `npm start`. Start selects production mode. Place self-hosted servers behind HTTPS. A single self-hosted process may use SQLite instead, with `DATA_DIR` on a persistent private volume. Vercel refuses SQLite fallback because its filesystem is ephemeral.

See [deployment instructions](VERCEL_DEPLOYMENT.md) and [security review](SECURITY.md).

## Save, load, and privacy

Sign in, write or import TXT/Markdown/DOCX/PDF, and choose **Save document**. Reopen, search, export, or delete saved drafts and reports from your account library. Saving is explicit; unsaved edits trigger a navigation warning. Limits: 100 documents per account, 15,000 characters per document, 2 MB per imported file.

Analysis and PDF import send text/files to the server. AI analysis may share text with Google Gemini. DOCX parsing is local and its library loads only when needed. Passwords are hashed; browser storage is not used for credentials or document persistence. Production session cookies are Secure, HttpOnly, and SameSite=Strict.

Documents and reports live in the configured database. Recent scan results are cached in process memory for up to 30 minutes, with 50 entries maximum and full-text/account-separated keys. Expired entries are removed on the next cache write. Deleting a document does not purge database backups, caches, or prior provider submissions. Database encryption, backup, access, and retention controls are the deployer's responsibility.

## Limitations and migration

AI scores are estimates, not proof of authorship. Similarity is not a plagiarism verdict. Search coverage is incomplete; manually check suggested sources. Unavailable web search reports **Not checked**, never a certificate of originality.

The old browser-only subscriptions, payment receipts, admin/demo accounts, bearer sign-in, certificates, and guaranteed detector-evasion features are retired. Old browser credentials and sessions are cleared on first load and are not migrated. Create a new server account. There is currently no email ownership verification, password reset, MFA, billing, or administrator interface.

## Validation

```sh
npm test
npm run lint
npm run build
npm audit
```

Integration tests use temporary SQLite databases in ignored `work/`. They cover account isolation, authentication, session revocation/expiry, rate limits, validation, cache separation, and unavailable-service behavior. CI runs on Node 22 and 24. Hosted PostgreSQL and live Gemini require deployment credentials and are not included in the offline suite.
