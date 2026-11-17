import { Router } from "express";
import { ObjectId, type Collection, type Document } from "mongodb";
import { db } from "../lib/db.js";
import { todayStr } from "../lib/dates.js";
import { createEventSchema, updateEventSchema, joinSchema } from "../schemas/event.js";
import { requireAuth, type AuthedRequest } from "../middleware/require-auth.js";

export const eventRouter = Router();

interface EventDoc extends Document {
  title: string;
  description: string;
  type: string;
  thumbnail: string;
  location: string;
  date: string;
  creatorEmail: string;
  creatorName: string;
  createdAt: Date;
}

interface JoinDoc extends Document {
  eventId: ObjectId;
  userEmail: string;
  joinedAt: Date;
}

const events = (): Collection<EventDoc> => db.collection<EventDoc>("events");
const joins = (): Collection<JoinDoc> => db.collection<JoinDoc>("joins");

function parseBody<T>(
  schema: { safeParse: (data: unknown) => { success: boolean; data?: T; error?: { issues: Array<{ message: string }> } } },
  body: unknown,
  res: { status: (code: number) => { json: (body: unknown) => unknown } },
): T | null {
  const result = schema.safeParse(body);
  if (!result.success) {
    res.status(400).json({ error: result.error?.issues?.[0]?.message ?? "Invalid input" });
    return null;
  }
  return result.data as T;
}

/** Express 5 types query values as `string | string[] | ParsedQs`, normalise to a single value. */
function param(value: unknown): string {
  if (Array.isArray(value)) {
    return (value[0] as string) ?? "";
  }
  return typeof value === "string" ? value : "";
}

function toObjectId(id: string, res: { status: (code: number) => { json: (body: unknown) => unknown } }): ObjectId | null {
  if (!ObjectId.isValid(id)) {
    res.status(400).json({ error: "Invalid event id" });
    return null;
  }
  return new ObjectId(id);
}

/* ------------------------------------------------------------------ create */
eventRouter.post("/", requireAuth, async (req, res) => {
  const user = (req as AuthedRequest).user!;
  const input = parseBody(createEventSchema, req.body, res);
  if (!input) return;

  const doc: EventDoc = {
    ...input,
    creatorEmail: user.sub,
    creatorName: user.name,
    createdAt: new Date(),
  };

  const result = await events().insertOne(doc);
  res.status(201).json({ _id: result.insertedId, ...doc });
});

/* ------------------------------------------------- upcoming (public, no past) */
eventRouter.get("/", async (_req, res) => {
  const type = param(_req.query.type);
  const search = param(_req.query.search);

  const filter: Record<string, unknown> = { date: { $gte: todayStr() } };

  if (type) {
    filter.type = type;
  }

  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
      { location: { $regex: search, $options: "i" } },
    ];
  }

  const list = await events()
    .find(filter)
    .sort({ date: 1 })
    .toArray();
  res.json(list);
});

/* --------------------------------------- recent 6 for the home page (limit()) */
eventRouter.get("/recent", async (_req, res) => {
  const list = await events()
    .find({ date: { $gte: todayStr() } })
    .sort({ date: 1 })
    .limit(6)
    .toArray();
  res.json(list);
});

/* ------------------------------------------- events created by the caller */
eventRouter.get("/mine", requireAuth, async (req, res) => {
  const user = (req as AuthedRequest).user!;
  const list = await events()
    .find({ creatorEmail: user.sub })
    .sort({ date: 1 })
    .toArray();
  res.json(list);
});

/* --------------------------------------------------- events the caller joined */
eventRouter.get("/joined", requireAuth, async (req, res) => {
  const user = (req as AuthedRequest).user!;
  const joined = await joins().find({ userEmail: user.sub }).toArray();
  const ids = joined.map((row) => row.eventId);
  const list = ids.length
    ? await events().find({ _id: { $in: ids } }).sort({ date: 1 }).toArray()
    : [];
  res.json(list);
});

/* ---------------------------------------------------------------- read one */
eventRouter.get("/:id", async (req, res) => {
  const id = toObjectId(param(req.params.id), res);
  if (!id) return;

  const event = await events().findOne({ _id: id });
  if (!event) {
    res.status(404).json({ error: "Event not found" });
    return;
  }

  const participants = await joins().countDocuments({ eventId: id });
  res.json({ ...event, participants });
});

/* ------------------------------------------------------------------ update */
eventRouter.patch("/:id", requireAuth, async (req, res) => {
  const user = (req as AuthedRequest).user!;
  const id = toObjectId(param(req.params.id), res);
  if (!id) return;

  const existing = await events().findOne({ _id: id });
  if (!existing) {
    res.status(404).json({ error: "Event not found" });
    return;
  }
  if (existing.creatorEmail !== user.sub) {
    res.status(403).json({ error: "You can only edit your own events" });
    return;
  }

  const input = parseBody(updateEventSchema, req.body, res);
  if (!input) return;

  await events().updateOne({ _id: id }, { $set: input });
  const updated = await events().findOne({ _id: id });
  res.json(updated);
});

/* ------------------------------------------------------------------ delete */
eventRouter.delete("/:id", requireAuth, async (req, res) => {
  const user = (req as AuthedRequest).user!;
  const id = toObjectId(param(req.params.id), res);
  if (!id) return;

  const existing = await events().findOne({ _id: id });
  if (!existing) {
    res.status(404).json({ error: "Event not found" });
    return;
  }
  if (existing.creatorEmail !== user.sub) {
    res.status(403).json({ error: "You can only delete your own events" });
    return;
  }

  await events().deleteOne({ _id: id });
  await joins().deleteMany({ eventId: id });
  res.json({ success: true });
});

/* ------------------------------------------------------------------- join */
eventRouter.post("/:id/join", requireAuth, async (req, res) => {
  const user = (req as AuthedRequest).user!;
  const id = toObjectId(param(req.params.id), res);
  if (!id) return;

  const parsed = joinSchema.safeParse({ eventId: param(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message });
    return;
  }

  const event = await events().findOne({ _id: id });
  if (!event) {
    res.status(404).json({ error: "Event not found" });
    return;
  }
  if (event.date < todayStr()) {
    res.status(400).json({ error: "This event has already taken place" });
    return;
  }

  const existing = await joins().findOne({ eventId: id, userEmail: user.sub });
  if (existing) {
    res.status(409).json({ error: "You already joined this event" });
    return;
  }

  await joins().insertOne({ eventId: id, userEmail: user.sub, joinedAt: new Date() });
  const participants = await joins().countDocuments({ eventId: id });
  res.status(201).json({ success: true, participants });
});

/* ------------------------------------------------------------- join status */
eventRouter.get("/:id/join-status", requireAuth, async (req, res) => {
  const user = (req as AuthedRequest).user!;
  const id = toObjectId(param(req.params.id), res);
  if (!id) return;

  const existing = await joins().findOne({ eventId: id, userEmail: user.sub });
  res.json({ joined: Boolean(existing) });
});
