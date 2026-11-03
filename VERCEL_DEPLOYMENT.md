# Vercel deployment

1. Import this repository into Vercel using Vite, build command `npm run build`, output `dist`, and Node 24 (22.13+ also supported).
2. Provision persistent PostgreSQL and set `DATABASE_URL` server-side. Use your provider's pooler URL and verified TLS settings. Never disable certificate verification.
3. Set `APP_ORIGIN` to the exact public origin, e.g. `https://your-project.vercel.app`, without a trailing slash. Previews need their own matching origin and preferably separate databases.
4. Optionally set `GEMINI_API_KEY`. Without it, AI analysis uses local heuristics and web similarity is unavailable.
5. Deploy, register disposable test accounts, save a draft, refresh and reopen it, sign out, and verify account isolation.
6. Configure database backups, encryption, restricted credentials, spending limits, bot controls, monitoring, and retention before broad public access.

`vercel.json` routes API requests to Express and applies security headers to static pages. Sessions, rate limits, and documents use PostgreSQL to survive function restarts. SQLite fallback is intentionally unavailable on Vercel.

Remove `VITE_ADMIN_PASSWORD` from all environments and rotate any password ever configured there, including reuse elsewhere. VITE-prefixed configuration is frontend-visible. Rebuild/redeploy and remove older deployments containing sensitive values; this revision cannot retract previously published assets.

This revision does not provision a database or deploy production. Hosted PostgreSQL, live Gemini, production HTTPS cookies, and function limits need smoke testing with your deployment credentials. Local SQLite, API security regression tests, build, and type checks were validated.

## Sign-up troubleshooting

Real accounts require PostgreSQL. In the Vercel project, attach a Neon/PostgreSQL database and expose its pooled connection string as DATABASE_URL to Preview and Production, then redeploy. The app creates its tables automatically. Vercel's own VERCEL_URL is accepted as the exact trusted preview origin; APP_ORIGIN remains the custom production origin.

If the deployment is protected by Vercel Authentication, sign in through Vercel before testing. Do not disable protection just to hide an API error. Missing storage now returns a specific setup error. Server startup failures return JSON rather than an HTML error page where possible. The API module uses explicit ESM import paths and loads PDF parsing only when requested.
