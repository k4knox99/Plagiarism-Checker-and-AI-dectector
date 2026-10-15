import app from './_app';
import type { Request, Response } from 'express';

// Vercel Serverless Function entry point for /api
export default function handler(req: Request, res: Response) {
  try {
    return app(req, res);
  } catch (err: any) {
    console.error('Vercel serverless uncaught exception in /api/index:', err);
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: err?.message || 'Serverless invocation error' });
    }
  }
}
