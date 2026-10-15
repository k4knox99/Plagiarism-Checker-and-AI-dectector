# VeritasAI — Plagiarism & AI Detector with Smart Humanizer

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)
![Vite](https://img.shields.io/badge/Vite-8.3-646CFF?logo=vite&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-06B6D4?logo=tailwindcss&logoColor=white)

Comprehensive plagiarism checker, AI content detector, and smart humanizer fixer to verify originality and rewrite flagged text with natural human cadence. Engineered for high performance both locally and on **Vercel**.

---

## 🚀 1-Click Deploy to Vercel

Click the button below to deploy your own instance of VeritasAI directly to Vercel:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

### Step-by-Step Vercel Deployment (Git Import)

1. **Push your code to GitHub / GitLab / Bitbucket**.
2. Go to [vercel.com/new](https://vercel.com/new).
3. Import your VeritasAI repository.
4. Vercel automatically detects the project settings from `vercel.json`:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Under **Environment Variables**, add:
   - `GEMINI_API_KEY`: Your Gemini API key (obtain from [Google AI Studio](https://aistudio.google.com/app/apikey)).
6. Click **Deploy**. Your application will be live in seconds!

---

## 💻 Deploy via Vercel CLI

You can also deploy directly from your terminal using the Vercel CLI:

```bash
# 1. Install Vercel CLI globally (or use npx)
npm install -g vercel

# 2. Login to your Vercel account
vercel login

# 3. Deploy preview
vercel

# 4. Deploy directly to production
vercel --prod
```

When prompted during CLI deployment:
- Set up and deploy? **Yes**
- Link to existing project? **No**
- What's your project's name? **veritas-ai**
- In which directory is your code located? **./**
- Want to modify these settings? **No** (Vercel automatically reads `vercel.json`)

After deploying, set your secret key:
```bash
vercel env add GEMINI_API_KEY production
```

---

## 🏗️ Architecture on Vercel

```
┌────────────────────────────────────────────────────────┐
│                      Vercel Edge                       │
│                                                        │
│   Incoming Requests                                    │
│   ├── /api/*   ───────►   Vercel Serverless Function   │
│   │                       (/api/index.ts -> Express)   │
│   │                                                    │
│   └── /*       ───────►   Global Edge CDN (Vite SPA)   │
│                           (/dist/index.html + assets)  │
└────────────────────────────────────────────────────────┘
```

- **Frontend**: Single Page Application built by Vite with React 19, Lucide icons, and Tailwind CSS v4, compiled into `/dist` and delivered through Vercel's Global CDN.
- **Backend API**: Serverless Functions inside `/api/` running the Express app on Node.js.
- **Fail-Safe Heuristic Engine**: If `GEMINI_API_KEY` is temporarily missing or hits a quota threshold, VeritasAI automatically utilizes its built-in local stylometric analysis engine (burstiness, perplexity proxies, syntactic uniformity, and cliché pattern matching) to provide instant responses without throwing 500 errors.

---

## ⚙️ Environment Variables

| Variable | Required | Description |
| :--- | :---: | :--- |
| `GEMINI_API_KEY` | Recommended | API key from Google AI Studio. Powers deep AI forensics and the Gemini 3.8 Flash humanizer. (App gracefully falls back to local stylometrics if omitted). |
| `PORT` | Optional | Port for local server (defaults to `3000`). |

---

## 🛠️ Local Development

```bash
# 1. Install dependencies
npm install

# 2. Set your environment variable in .env
echo "GEMINI_API_KEY=your_key_here" > .env

# 3. Start local development server (Vite + Express with HMR middleware)
npm run dev

# 4. Build for production
npm run build

# 5. Type check / lint
npm run lint
```

Local server starts at `http://localhost:3000`.

---

## 📡 API Endpoints

- `GET  /api/health` — Service health and API key readiness check.
- `POST /api/detect/comprehensive` — Unified single-call AI forensics & web plagiarism scan.
- `POST /api/detect/ai` — Stylometric and perplexity AI probability detector.
- `POST /api/detect/plagiarism` — Web search grounded plagiarism audit.
- `POST /api/fix/humanize` — Multi-style humanizer (Academic, Conversational, Professional, Creative, Stealth).
- `POST /api/fix/sentence` — Instant 3-variation single sentence humanizer.
- `POST /api/fix/cite` — Citation generator (APA, MLA, Chicago, Harvard, BibTeX).

---

## 📄 License

MIT
