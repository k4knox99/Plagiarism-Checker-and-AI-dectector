import app from './_app';
import type { Request, Response } from 'express';

// Vercel Serverless Function entry point for /api
export default function handler(req: Request, res: Response) {
  return app(req, res);
}
