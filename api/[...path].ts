import app from './_app';
import type { Request, Response } from 'express';

// Vercel Serverless Function wildcard entry point for /api/* sub-routes
export default function handler(req: Request, res: Response) {
  try {
    return app(req, res);
  } catch (err: any) {
    console.error('Vercel serverless uncaught exception in /api/[...path]:', err);
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: err?.message || 'Serverless invocation error' });
    }
  }
}
