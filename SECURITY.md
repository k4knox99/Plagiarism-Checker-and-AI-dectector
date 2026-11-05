# Security review

## Fixed in this revision

- Replaced simulated browser authentication with server accounts, salted scrypt password hashes, random session tokens stored as hashes, seven-day expiry, and revocation on logout/rotation.
- Removed plaintext browser password storage, seeded admin/demo accounts, frontend admin-password checks, editable browser roles, and simulated payment approvals. Legacy compatibility exports fail closed.
- All analysis and PDF endpoints require server authentication. Document queries bind parameters and check ownership for reads, updates, and deletes.
- Added persistent authentication/analysis rate limits, daily analysis limits, input/body/file/document limits, provider timeouts, and per-instance analysis concurrency limits.
- Scan cache keys hash complete exact text and account identity. Cache capacity is 50 results with a 30-minute TTL. Expired entries are discarded on the next cache write; process restarts clear the cache.
- Disabled the caller-selected verification-code endpoint, which could function as an email relay.
- Added same-origin checks, JSON-only writes, HttpOnly/SameSite cookies, Secure cookies in production, no-store API responses, and production CSP/HSTS/security headers.
- API errors omit provider details. Model results and saved reports are validated. React escapes content; source links accept only HTTP(S) and must appear in Google's grounding metadata.
- Missing search never certifies originality. APIs that fabricated authenticity or guaranteed detector-evasion scores now return 410.
- Added reproducible npm dependency installation and security regression tests. npm audit reported no known advisories during validation.

## Required deployment actions

Rotate any `VITE_ADMIN_PASSWORD` previously deployed, including reuse elsewhere. VITE-prefixed values are public frontend configuration. Remove old deployments containing sensitive build values. The repository example contained a placeholder; deployed secrets were not inspected.

Use HTTPS, a private durable database, verified database TLS, restricted database credentials, encrypted disks/backups, spend caps, and a retention policy. Never expose the Vite development server publicly. PostgreSQL is required on Vercel; a self-hosted single instance can use SQLite on a persistent private volume.

## Remaining limits

This is a source review and local regression testing, not a penetration-test certification.

- Registration is open, but email confirmation is required before protected tools or documents are accessible. There is no password reset, MFA, account recovery, billing, enterprise authorization, or administrator interface. Email domains must never establish organizational membership.
- Proxy configuration determines IP rate-limit identity. Vercel trusts one platform proxy; self-hosting trusts no proxies by default. Configure only known reverse proxies deliberately.
- Rate windows are shared in the database; cache/concurrency limits are per process. Public installations still need edge bot controls, global provider quotas, admission controls, and monitoring. Multiple accounts/IPs can exhaust provider budgets.
- File-size limits do not fully stop compressed-document resource attacks. PDF parsing remains in-process. Hostile/high-volume environments should isolate parsing in constrained workers/services and add file scanning.
- PostgreSQL schema changes and reward uniqueness were checked on an isolated Neon branch. Local application tests use SQLite. Protected live-preview flows, provider outputs, TLS cookies, and function time limits still require deployment-level validation; live Gemini is not configured.
- Documents are stored in the configured database without application-level encryption. Document deletion removes the active row, not backups, cache, or prior provider submissions. There is no self-service account deletion yet.
- Saved reports are user-controlled data, not signed certificates. AI signals cannot prove authorship. Search coverage is incomplete and similarity is not a plagiarism verdict.

References: [Express production security guidance](https://expressjs.com/en/advanced/best-practice-security/) and [Node SQLite API](https://nodejs.org/api/sqlite.html).

Report issues privately to the repository owner; do not post secrets or private documents in public issues.

Preview-origin handling also accepts only the exact VERCEL_URL supplied by Vercel. It never derives production trust from a client-controlled Host or forwarding header. Registration fails closed with a setup error until durable hosted storage is connected.

## Verification and tool update

The preview now requires email confirmation for every account, including pre-update users. Existing passwords, IDs, and documents are retained; old sessions cannot bypass the verification gate. App passwords are not sent to the OTP provider. The provider consumes single-use codes; local challenges enforce expiry, per-account binding, a 60-second resend cooldown, five-attempt limit and shared database rate limits. Case-insensitive unique email indexing and conflict-safe insertion prevent concurrent duplicate application accounts.

The owner configured custom SMTP in Neon Auth and confirmed a test email arrived in the inbox. This does not guarantee inbox placement for every recipient. Automated verification tests use an isolated provider stub. Password reset and MFA remain outside this revision.

Live AI Gateway/web-search calls use the deployment OIDC token or a server-only gateway key. Requests are bounded and source links are filtered against actual provider source metadata. Provider credits/payment verification can affect availability. The UI labels local fallback output rather than hiding outages.

## Disposable email and referral controls

Registration rejects known disposable email domains and their subdomains using a pinned, bundled CC0 dataset; no external lookup runs per request. Missing/invalid policy data fails closed. Consumer Gmail dot/plus/googlemail variants share one hashed mailbox identity. Historical duplicate accounts are preserved, but only the original identity owner can create reward-eligible invitations. Other providers' alias semantics are not assumed, and a domain list cannot establish a person's identity or identify every new disposable service.

Referral attribution is accepted only during creation of a new account. Both mailboxes must be permanent, distinct, and eligible. Email confirmation and reward insertion occur in one database transaction. A unique referred-user key prevents replay, a wallet-row lock serializes monthly awards, and rewards stop at 100 credits per UTC calendar month. Referrers see counts and their balance, never invitees' email addresses.

Bonus credits are atomically reserved after the free daily allowance. Authenticated, account-separated cache hits are served without consuming the daily allowance or bonus balance; the per-minute limit still applies. JSON responses settle or refund reservations before writing the response, with no negative wallet balance or double spending. Failed requests and unavailable source checks are refunded; a model-controlled result label cannot request a refund from another tool. A canceled request can consume its reserved check once work starts. Bonus credits do not remove per-minute limits or enable provider billing. Legacy disposable accounts retain access to their own library, but writing tools and referral rewards require a permanent email.
