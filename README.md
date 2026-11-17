# ShohoJog API — Social Development Events Platform

Express + TypeScript API that powers the ShohoJog client. It handles
authentication (BetterAuth + our own JWT), event CRUD, joining events and
participant tracking.

**Local dev:** http://localhost:5000

## Tech stack

Express 5 · TypeScript · MongoDB Atlas (official `mongodb` driver) ·
BetterAuth (email/password + Google OAuth, MongoDB adapter) · jose (JWT) · zod

## Endpoints

### Auth

| Method | Path                          | Auth | Notes                                             |
| ------ | ----------------------------- | ---- | ------------------------------------------------- |
| GET    | `/api/auth/config`            | —    | Tells the client whether Google login is enabled  |
| GET    | `/api/auth/session`           | —    | Exchanges a BetterAuth session for our JWT (200 `{token:null,user:null}` when signed out) |
| *      | `/api/auth/*`                 | —    | BetterAuth handler: `sign-up/email`, `sign-in/email`, `sign-out`, `update-user`, `get-session`, … |

### Events

| Method | Path                         | Auth | Notes                                          |
| ------ | ---------------------------- | ---- | ---------------------------------------------- |
| GET    | `/api/health`                | —    | Liveness check                                 |
| GET    | `/api/events`                | —    | All upcoming events                            |
| GET    | `/api/events/recent`         | —    | 6 most recent upcoming events (homepage)       |
| GET    | `/api/events/upcoming`       | —    | Upcoming events list                           |
| GET    | `/api/events/mine`           | JWT  | Events created by the caller                   |
| GET    | `/api/events/joined`         | JWT  | Events the caller joined                       |
| GET    | `/api/events/:id`            | —    | Single event + participant count               |
| GET    | `/api/events/:id/join-status`| JWT  | Whether the caller already joined              |
| POST   | `/api/events`                | JWT  | Create (400 if the date is in the past)        |
| POST   | `/api/events/:id/join`       | JWT  | Join (409 if already joined)                   |
| PATCH  | `/api/events/:id`            | JWT  | Owner only (403 otherwise)                     |
| DELETE | `/api/events/:id`            | JWT  | Owner only (403 otherwise)                     |

All JWT routes expect `Authorization: Bearer <token>`; the token is issued by
`GET /api/auth/session`.

## Getting started

```bash
cp .env.example .env    # then fill in the real values
npm install
npm run dev             # http://localhost:5000
```

## Environment variables

| Variable               | Description                                                     |
| ---------------------- | --------------------------------------------------------------- |
| `PORT`                 | Server port (default 5000)                                       |
| `NODE_ENV`             | `development` / `production`                                     |
| `MONGODB_URI`          | MongoDB Atlas connection string                                  |
| `MONGODB_DB_NAME`      | Database name (`events-platform`)                                |
| `BETTER_AUTH_SECRET`   | BetterAuth signing secret (generate a long random string)        |
| `BETTER_AUTH_URL`      | Public base URL of this API (`http://localhost:5000` in dev, in prod) |
| `CLIENT_URL`           | Comma separated allowed client origins (CORS + auth cookies). Production: `https://event-switch.vercel.app,http://localhost:3000` |
| `JWT_SECRET`           | Secret for our own access tokens                                 |
| `JWT_EXPIRES_IN`       | Token lifetime (e.g. `7d`)                                       |
| `GOOGLE_CLIENT_ID`     | Optional — leave empty to hide the Google sign-in button         |
| `GOOGLE_CLIENT_SECRET` | Optional — Google OAuth secret                                   |

## Authentication Architecture (BetterAuth)

### Files

- `src/lib/auth.ts` — BetterAuth instance configuration (baseURL, secret, social providers, trustedOrigins, cookie attributes)
- `src/routes/auth.ts` — Custom auth routes (`/config`, `/session`) mounted before the BetterAuth catch-all
- `src/index.ts` — Express app with CORS and route mounting order

### How Google OAuth works

1. User clicks "Sign in with Google" on the frontend
2. `authClient.signIn.social({ provider: "google", callbackURL })` redirects to Google's OAuth consent page
3. After the user consents, Google redirects to BetterAuth's callback route: `GET /api/auth/callback/google`
4. BetterAuth verifies the `state` parameter (prevents CSRF) and creates/links the user account
5. BetterAuth sets a session cookie (`SameSite=None; Secure` for cross-domain)
6. The client is redirected back to `callbackURL` (the frontend origin)
7. The frontend calls `GET /api/auth/session` to exchange the BetterAuth session for our own JWT

### Cross-domain cookie configuration

Because the frontend (Vercel) and backend (Render) are on different domains, the session cookie must be configured for cross-site use:

```ts
advanced: {
  useSecureCookies: true,
  defaultCookieAttributes: {
    sameSite: "none" as const,
    secure: true,
  },
},
```

This is applied only when `NODE_ENV=production`.

### Google Cloud Console setup

1. Go to **APIs & Services → Credentials**
2. Select your OAuth 2.0 Client ID
3. Under **Authorized redirect URIs**, click **+ Add URI**
4. Click **Save** (propagation takes 5–60 minutes)

### CORS configuration

CORS is configured in `src/index.ts` with:
- `origin`: from `CLIENT_URL` env var (comma-separated list)
- `credentials: true` — required for cookies to be sent cross-origin
- `allowedHeaders: ["Content-Type", "Authorization"]`

## Deploy (Render)

1. Create a Web Service from this folder; build command `npm install && npm run build`,
   start command `npm start`.
2. Set every environment variable above. In production `BETTER_AUTH_URL` and
   `CLIENT_URL` must be the real `https` URLs of the API and the client
   (cookies are `SameSite=None; Secure` so they work cross-site).
3. Add the Render URL to Google Cloud Console's authorised redirect URIs if you
   use Google sign-in.
4. Render auto-deploys on every push to GitHub.

## Scripts

| Command               | What it does                  |
| --------------------- | ----------------------------- |
| `npm run dev`         | Watch mode via `tsx`          |
| `npm run build`       | Compile TypeScript to `dist/` |
| `npm start`           | Run the compiled server       |
| `npm run typecheck`   | Type-check without emitting   |
