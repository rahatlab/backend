import "dotenv/config";
import express from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import { auth, clientOriginList } from "./lib/auth.js";
import { connectDb, disconnectDb } from "./lib/db.js";
import { authRouter } from "./routes/auth.js";
import { eventRouter } from "./routes/event.js";
import { errorHandler } from "./middleware/error-handler.js";

const app = express();
const port = Number(process.env.PORT) || 5000;

const allowedOrigins = clientOriginList.includes("*")
  ? true
  : clientOriginList;

app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

/**
 * Our own `/api/auth/*` routes are mounted BEFORE the Better Auth catch-all.
 * Otherwise `app.all("/api/auth/*splat", ...)` swallows them and answers 404.
 */
app.use("/api/auth", authRouter);

/**
 * Better Auth must be mounted BEFORE express.json(): the body parser consumes
 * the request stream and the auth handler would never see it.
 * `*splat` is the Express 5 syntax for a wildcard segment.
 */
app.all("/api/auth/*splat", toNodeHandler(auth));

app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/events", eventRouter);

app.use(errorHandler);

async function start() {
  await connectDb();
  console.log("MongoDB connected");

  const server = app.listen(port, () => {
    console.log(`API listening on http://localhost:${port}`);
  });

  const shutdown = async () => {
    server.close();
    await disconnectDb();
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
