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

- Registration is open and email ownership is unverified. There is no password reset, MFA, account recovery, billing, enterprise authorization, or administrator interface. Email domains must never establish organizational membership.
- Proxy configuration determines IP rate-limit identity. Vercel trusts one platform proxy; self-hosting trusts no proxies by default. Configure only known reverse proxies deliberately.
- Rate windows are shared in the database; cache/concurrency limits are per process. Public installations still need edge bot controls, global provider quotas, admission controls, and monitoring. Multiple accounts/IPs can exhaust provider budgets.
- File-size limits do not fully stop compressed-document resource attacks. PDF parsing remains in-process. Hostile/high-volume environments should isolate parsing in constrained workers/services and add file scanning.
- Hosted PostgreSQL and live Gemini were not exercised with deployment credentials. Smoke-test production routing, database permissions, TLS cookies, provider outputs, and function time limits before launch.
- Documents are stored in the configured database without application-level encryption. Document deletion removes the active row, not backups, cache, or prior provider submissions. There is no self-service account deletion yet.
- Saved reports are user-controlled data, not signed certificates. AI signals cannot prove authorship. Search coverage is incomplete and similarity is not a plagiarism verdict.

References: [Express production security guidance](https://expressjs.com/en/advanced/best-practice-security/) and [Node SQLite API](https://nodejs.org/api/sqlite.html).

Report issues privately to the repository owner; do not post secrets or private documents in public issues.
