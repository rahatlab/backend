import { MongoClient, Db } from "mongodb";

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error("MONGODB_URI is not set");
}

/**
 * `client.db()` does not open a connection by itself, the driver connects
 * lazily on the first operation. We still call `connect()` explicitly during
 * startup so a bad connection string fails fast instead of on first request.
 */
export const client = new MongoClient(uri);
export const db: Db = client.db(process.env.MONGODB_DB_NAME || "events-platform");

export async function connectDb(): Promise<void> {
  await client.connect();
}

export async function disconnectDb(): Promise<void> {
  await client.close();
}
