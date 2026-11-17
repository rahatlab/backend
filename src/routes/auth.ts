import { Router } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { auth, googleAuthEnabled } from "../lib/auth.js";
import { signApiJwt } from "../lib/jwt.js";

export const authRouter = Router();

/** Public flags the client needs before anyone logs in. */
authRouter.get("/config", (_req, res) => {
  res.json({ googleAuth: googleAuthEnabled });
});

/**
 * Exchanges the Better Auth session cookie for our own JWT.
 * The client calls this after login/register and on every reload, which is
 * what keeps private routes working after a refresh.
 */
authRouter.get("/session", async (req, res) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session) {
      // 200 with a null token (BetterAuth's own convention) instead of 401,
      // so a logged-out page load does not log a console error.
      res.json({ token: null, user: null });
      return;
    }

    const token = await signApiJwt({
      sub: session.user.email,
      name: session.user.name,
      image: session.user.image ?? undefined,
    });

    res.json({
      token,
      user: {
        name: session.user.name,
        email: session.user.email,
        image: session.user.image ?? null,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not read the session" });
  }
});
