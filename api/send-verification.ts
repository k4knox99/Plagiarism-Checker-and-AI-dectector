import type { Request, Response } from "express";
// Former endpoint accepted a caller-selected code and could be abused as an email relay.
export function sendVerificationHandler(_req: Request, res: Response) {
  return res
    .status(410)
    .json({
      error:
        "Legacy verification is disabled. Use server account registration.",
    });
}
export default sendVerificationHandler;
