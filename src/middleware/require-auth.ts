import type { Request, Response, NextFunction } from "express";
import { verifyApiJwt, type ApiJwtPayload } from "../lib/jwt.js";

export interface AuthedRequest extends Request {
  user?: ApiJwtPayload;
}

/**
 * JWT validation for every protected API. Rejects missing, malformed or
 * expired tokens with 401 instead of letting the request through.
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized: missing token" });
    return;
  }

  try {
    const payload = await verifyApiJwt(header.slice(7));
    (req as AuthedRequest).user = payload;
    next();
  } catch {
    res.status(401).json({ error: "Unauthorized: invalid or expired token" });
  }
}
