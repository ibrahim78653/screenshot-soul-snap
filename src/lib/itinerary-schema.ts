import { z } from "zod";

export const activitySchema = z.object({
  id: z.string(),
  time: z.string(),
  slot: z.enum(["morning", "afternoon", "evening"]),
  name: z.string(),
  description: z.string(),
  category: z.string(),
  durationMinutes: z.number(),
  estimatedCost: z.number(),
  location: z.string(),
  lat: z.number().nullable(),
  lng: z.number().nullable(),
  transport: z.string(),
  tip: z.string().nullable(),
});

export const daySchema = z.object({
  dayNumber: z.number(),
  date: z.string(),
  title: z.string(),
  summary: z.string(),
  activities: z.array(activitySchema),
  dining: z.array(z.object({ name: z.string(), cuisine: z.string(), estimatedCost: z.number(), note: z.string() })),
  alternatives: z.array(z.string()),
});

export const itinerarySchema = z.object({
  summary: z.string(),
  days: z.array(daySchema),
  accommodations: z.array(
    z.object({ name: z.string(), area: z.string(), nightlyPrice: z.number(), reason: z.string() }),
  ),
  transportation: z.array(z.object({ mode: z.string(), estimatedCost: z.number(), note: z.string() })),
  budget: z.object({
    accommodation: z.number(),
    food: z.number(),
    transport: z.number(),
    activities: z.number(),
    misc: z.number(),
  }),
  tips: z.array(z.string()),
});

export type Activity = z.infer<typeof activitySchema>;
export type Day = z.infer<typeof daySchema>;
export type Itinerary = z.infer<typeof itinerarySchema>;

export const BUDGET_CATEGORIES = ["accommodation", "food", "transport", "activities", "misc"] as const;

export function budgetTotal(b: Itinerary["budget"]) {
  return BUDGET_CATEGORIES.reduce((s, k) => s + (Number(b[k]) || 0), 0);
}

export function tripDays(start: string, end: string) {
  const s = new Date(start + "T00:00:00Z").getTime();
  const e = new Date(end + "T00:00:00Z").getTime();
  if (isNaN(s) || isNaN(e) || e < s) return 0;
  return Math.round((e - s) / 86400000) + 1;
}
