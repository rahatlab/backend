import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { db } from "./db.js";

const isProd = process.env.NODE_ENV === "production";

const clientOrigins = (process.env.CLIENT_URL || "http://localhost:3000")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

export const clientOriginList = clientOrigins;

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
export const googleAuthEnabled = Boolean(googleClientId && googleClientSecret);

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: mongodbAdapter(db),
  emailAndPassword: {
    enabled: true,
    // The assignment asks for at least 6 characters; upper/lowercase rules are
    // enforced on the client with a friendlier message.
    minPasswordLength: 6,
    // No email verification / password reset - kept off on purpose so the
    // examiner is never blocked by an email they cannot receive.
    requireEmailVerification: false,
  },
  ...(googleAuthEnabled
    ? {
        socialProviders: {
          google: {
            clientId: googleClientId as string,
            clientSecret: googleClientSecret as string,
          },
        },
      }
    : {}),
  trustedOrigins: clientOrigins,
  /**
   * The client (Vercel) and this API (Render) live on different top level
   * domains, so the session cookie has to be `SameSite=None; Secure` or the
   * browser will drop it on every cross-site request.
   */
  ...(isProd
    ? {
        advanced: {
          useSecureCookies: true,
          defaultCookieAttributes: {
            sameSite: "none" as const,
            secure: true,
          },
        },
      }
    : {}),
});
