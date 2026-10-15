# Vercel Deployment Checklist & Guide

This project is pre-configured for seamless zero-configuration deployment to **Vercel**.

## 1. Key Configuration Files Created

- `vercel.json`: Defines the build command (`npm run build`), output directory (`dist`), and routing rewrites for both API serverless functions and SPA client-side routing.
- `.vercelignore`: Prevents unnecessary local build caches and credentials from being uploaded.
- `api/_app.ts`: Modular Express application containing all forensics, plagiarism detection, and humanizer routes, with automatic fallback when API keys are pending.
- `api/index.ts`: Standard Vercel Serverless Function entry point for `/api`.
- `api/[...path].ts`: Wildcard Vercel Serverless Function entry point ensuring all `/api/*` subroutes route seamlessly.

## 2. Deploying via Vercel Web Dashboard

1. Push this repository to your GitHub account:
   ```bash
   git add .
   git commit -m "Configure Vercel deployment"
   git push origin main
   ```
2. Navigate to [https://vercel.com/new](https://vercel.com/new).
3. Select your repository.
4. Vercel automatically detects the Vite framework and settings.
5. In the **Environment Variables** section:
   - Name: `GEMINI_API_KEY`
   - Value: `your_gemini_api_key`
6. Click **Deploy**.

## 3. Deploying via Vercel CLI

```bash
# Preview deployment
npx vercel

# Production deployment
npx vercel --prod
```

## 4. Testing Your Deployed API

Once deployed, you can verify your Vercel deployment by requesting:
`https://your-vercel-deployment.vercel.app/api/health`

It should return:
```json
{
  "status": "ok",
  "service": "VeritasAI API",
  "timestamp": "2026-10-15T...",
  "hasApiKey": true
}
```
