import type { Request, Response } from 'express';
import { Resend } from 'resend';

export async function sendVerificationHandler(req: Request, res: Response) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed. Use POST.' });
  }

  try {
    const { email, code } = req.body || {};

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ success: false, error: 'Valid email address is required.' });
    }

    if (!code || typeof code !== 'string' || code.trim().length !== 6) {
      return res.status(400).json({ success: false, error: 'Valid 6-digit verification code is required.' });
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey || resendApiKey.trim() === '') {
      console.warn('RESEND_API_KEY is not configured in environment variables.');
      return res.status(500).json({
        success: false,
        error: 'Email verification service is temporarily unconfigured (RESEND_API_KEY missing). Please set RESEND_API_KEY in environment variables.'
      });
    }

    const resend = new Resend(resendApiKey.trim());
    const fromAddress = process.env.RESEND_FROM_EMAIL || 'VeritasAI <onboarding@resend.dev>';
    const cleanCode = code.trim();

    const { data, error } = await resend.emails.send({
      from: fromAddress,
      to: [email.trim()],
      subject: `Your VeritasAI Verification Code: ${cleanCode}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>VeritasAI Email Verification</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #09090b; color: #f4f4f5; padding: 40px 20px; margin: 0;">
          <div style="max-width: 480px; margin: 0 auto; background-color: #18181b; border: 2px solid #27272a; border-radius: 16px; padding: 32px; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
            <div style="margin-bottom: 24px; text-align: center;">
              <h1 style="color: #ffffff; font-size: 22px; font-weight: 800; margin: 0; letter-spacing: -0.5px;">
                Veritas<span style="color: #818cf8;">AI</span>
              </h1>
              <p style="color: #a1a1aa; font-size: 13px; margin-top: 6px;">Enterprise AI Cadence & Forensic Audit</p>
            </div>
            
            <div style="background-color: #09090b; border: 1px solid #3f3f46; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
              <p style="color: #a1a1aa; font-size: 13px; margin: 0 0 12px 0;">Your 6-digit confirmation code is:</p>
              <div style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #34d399; margin: 8px 0;">
                ${cleanCode}
              </div>
              <p style="color: #71717a; font-size: 11px; margin: 12px 0 0 0;">Valid for 15 minutes. Never share this code with anyone.</p>
            </div>

            <p style="color: #d4d4d8; font-size: 13px; line-height: 1.6; margin: 0 0 16px 0;">
              Enter this code in your browser to activate your <strong>7-Day Free Trial</strong> with full access to AI Detection, Web Plagiarism Check, and Cadence Humanizer.
            </p>

            <hr style="border: none; border-top: 1px solid #27272a; margin: 24px 0;" />
            
            <p style="color: #71717a; font-size: 11px; text-align: center; margin: 0;">
              If you did not request this verification code, you can safely ignore this email.
            </p>
          </div>
        </body>
        </html>
      `,
      text: `Your VeritasAI verification code is: ${cleanCode}. Enter this code to activate your 7-day free trial.`
    });

    if (error) {
      console.error('Resend API delivery error:', error);
      return res.status(400).json({
        success: false,
        error: error.message || 'Failed to dispatch email via Resend.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Verification code sent successfully.',
      id: data?.id
    });
  } catch (err: any) {
    console.error('Unexpected error in send-verification route:', err);
    return res.status(500).json({
      success: false,
      error: err?.message || 'Internal server error while sending verification code.'
    });
  }
}

// Default export for Vercel Serverless Function entry point
export default sendVerificationHandler;
