import type { Response, NextFunction } from "express";
import type { AuthedRequest } from "./require-auth.js";

/**
 * Express 5 passes async rejections to the error handler automatically, this
 * just keeps the JSON shape consistent for anything that still throws.
 */
export function errorHandler(
  err: unknown,
  _req: AuthedRequest,
  res: Response,
  _next: NextFunction,
): void {
  console.error(err);
  const message = err instanceof Error ? err.message : "Something went wrong";
  res.status(500).json({ error: message });
}
