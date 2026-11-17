/** Local calendar date as `YYYY-MM-DD`, used for every date comparison. */
export function todayStr(): string {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** Normalize a date string to zero-padded `YYYY-MM-DD` so string comparison
 *  works correctly (e.g. "2026-9-20" → "2026-09-20"). */
export function normalizeDate(value: string): string {
  const parts = value.split("-").map((part) => Number(part));
  if (parts.some((p) => Number.isNaN(p)) || parts.length !== 3) {
    return value;
  }
  const [year, month, day] = parts;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${year.toString().padStart(4, "0")}-${pad(month)}-${pad(day)}`;
}

export const EVENT_TYPES = [
  "Cleanup",
  "Plantation",
  "Donation",
  "Clothes Distribution",
  "Blood Donation",
  "Education",
  "Community Service",
  "Other",
] as const;

export type EventType = (typeof EVENT_TYPES)[number];
