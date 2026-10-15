import app from './_app';
import type { Request, Response } from 'express';

// Vercel Serverless Function wildcard entry point for /api/* sub-routes
export default function handler(req: Request, res: Response) {
  return app(req, res);
}
