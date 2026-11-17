import { z } from "zod";
import { EVENT_TYPES, todayStr } from "../lib/dates.js";

const dateField = z
  .string()
  .min(1, "Event date is required")
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD")
  .refine((value) => value >= todayStr(), {
    message: "Event date must be in the future",
  });

const thumbnailField = z
  .string()
  .trim()
  .min(1, "Thumbnail image URL is required")
  .url("Thumbnail must be a valid URL");

export const createEventSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(120),
  description: z
    .string()
    .trim()
    .min(10, "Description must be at least 10 characters")
    .max(2000),
  type: z.enum(EVENT_TYPES, { message: "Pick a valid event type" }),
  thumbnail: thumbnailField,
  location: z.string().trim().min(3, "Location is required").max(200),
  date: dateField,
});

export const updateEventSchema = createEventSchema;

export const joinSchema = z.object({
  eventId: z.string().min(1, "Event id is required"),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;
