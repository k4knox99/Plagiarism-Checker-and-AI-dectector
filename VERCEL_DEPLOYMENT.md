# Vercel deployment

1. Import this repository into Vercel using Vite, build command `npm run build`, output `dist`, and Node 24 (22.13+ also supported).
2. Provision persistent PostgreSQL and set `DATABASE_URL` server-side. Use your provider's pooler URL and verified TLS settings. Never disable certificate verification.
3. Set `APP_ORIGIN` to the exact public origin, e.g. `https://your-project.vercel.app`, without a trailing slash. Previews need their own matching origin and preferably separate databases.
4. Configure `GEMINI_API_KEY`, `AI_GATEWAY_API_KEY`, or Vercel OIDC for AI Gateway. Advanced rewrites and plagiarism web search require an eligible AI account with available credits. Without one, AI detection uses labeled local estimates, rewriting/proofreading use limited basic English rules, and summaries use original source sentences. Document comparison and manual citations work independently. Web search reports unavailable until its provider is ready.
5. Deploy, register disposable test accounts, save a draft, refresh and reopen it, sign out, and verify account isolation.
6. Configure database backups, encryption, restricted credentials, spending limits, bot controls, monitoring, and retention before broad public access.

`vercel.json` routes API requests to Express and applies security headers to static pages. Sessions, rate limits, and documents use PostgreSQL to survive function restarts. SQLite fallback is intentionally unavailable on Vercel.

Remove `VITE_ADMIN_PASSWORD` from all environments and rotate any password ever configured there, including reuse elsewhere. VITE-prefixed configuration is frontend-visible. Rebuild/redeploy and remove older deployments containing sensitive values; this revision cannot retract previously published assets.

For the read-only owner dashboard, set server-only `OWNER_ACCOUNT_ID` to the verified owner's immutable account ID in the same database. Scope it to the intended Vercel project/environment and branch before deploying. The owner signs in normally and opens `/admin`; no shared admin password is used. A missing or mismatched value denies access. Dashboard requests recheck session verification and the exact account ID, and never return password hashes, sessions, provider keys, or document text.

This revision does not provision a database or deploy production. Hosted PostgreSQL, live Gemini, production HTTPS cookies, and function limits need smoke testing with your deployment credentials. Local SQLite, API security regression tests, build, and type checks were validated.

## Sign-up troubleshooting

Real accounts require PostgreSQL. In the Vercel project, attach a Neon/PostgreSQL database and expose its pooled connection string as DATABASE_URL to Preview and Production, then redeploy. The app creates its tables automatically. Vercel's own VERCEL_URL is accepted as the exact trusted preview origin; APP_ORIGIN remains the custom production origin.

If the deployment is protected by Vercel Authentication, sign in through Vercel before testing. Do not disable protection just to hide an API error. Missing storage now returns a specific setup error. Server startup failures return JSON rather than an HTML error page where possible. The API module uses explicit ESM import paths and loads PDF parsing only when requested.

## Confirmation-code configuration

Set NEON_AUTH_BASE_URL on the same preview branch as DATABASE_URL. Apply server/migrations/001_email_verification.sql before deploying the updated server. Set AI_GATEWAY_MODEL to a catalog model; Vercel OIDC can authenticate Gateway without copying provider keys. AI Gateway still requires an eligible account/credits. Verification uses the branch's Managed Auth OTP service and retains existing application account/document IDs. Existing users must sign in with their current password and enter the emailed code.

Enable project OIDC and redeploy. Build-time `VERCEL_OIDC_TOKEN` is not the runtime credential source for Functions: `@vercel/oidc` reads the current request context for every AI request, with no shared token cache. An explicit server `AI_GATEWAY_API_KEY` takes precedence. Self-hosted clients cannot supply a header to activate this platform credential path.

For a one-time provider smoke check, set preview-branch `VERITAS_AI_DEPLOY_CHECK=1` before the intended deployment. Build logs show writing and grounded-search status without user text or credentials. Set it back to `0` after inspection; do not create another deployment only to clear the flag. A `customer_verification_required` or exhausted allowance requires the project owner's provider account action.

## Referral migration and email policy data

Test `server/migrations/002_referrals.sql` on an isolated Neon branch, then apply its additive schema to the intended preview database. Existing accounts and documents stay in place. Set `VERITAS_DB_MIGRATE_ON_BUILD=1` for the release build to normalize existing mailbox identities and finalize migration `002_referrals`; reset the branch flag to `0` after success without another deployment. The script prints only migration status and aggregate counts.

`vercel.json` explicitly includes `server/data/**` in API Functions. The pinned disposable-domain dataset must be packaged: account operations fail closed when the data is absent or invalid. Updates use a reviewed upstream commit and include the upstream CC0 notice. Credits extend app request quotas only; they do not resolve AI Gateway account verification or provider billing. Protected previews also restrict who can open invitation links.

Configure a custom SMTP sender in Neon Auth. The preview currently uses the sender configured by its owner. The server derives the required Origin header from NEON_AUTH_BASE_URL rather than forwarding a browser-controlled header. Never copy the preview database or authentication audience into production unintentionally.
