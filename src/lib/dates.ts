/** Local calendar date as `YYYY-MM-DD`, used for every date comparison. */
export function todayStr(): string {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
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
