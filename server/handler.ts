import type { Request, Response } from "express";

// Catch module initialization failures too: a static app import fails before a
// function-level try/catch runs and Vercel then returns an HTML error page.
let application: Promise<typeof import("./app.js")> | undefined;
export default async function handler(req: Request, res: Response) {
  try {
    application ||= import("./app.js").catch((error) => {
      application = undefined;
      throw error;
    });
    const { default: app } = await application;
    return app(req, res);
  } catch {
    console.error("API initialization failed. Check server deployment logs.");
    if (!res.headersSent)
      res.status(503).json({
        error:
          "The account service could not start. Please contact the site owner or try again later.",
        code: "API_UNAVAILABLE",
      });
  }
}
