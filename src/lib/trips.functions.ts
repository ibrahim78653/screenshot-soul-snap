import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { itinerarySchema, daySchema, tripDays } from "./itinerary-schema";

const INSTRUCTIONS = `You are TravelMate, an expert travel planner. Create realistic, personalized itineraries.
Rules:
- Use real, well-known attractions, neighborhoods and food experiences in the destination.
- All prices are ESTIMATES in the trip currency, for the whole group. Never claim bookings, availability, opening hours or live schedules.
- Group nearby attractions on the same day to minimize travel. Respect the pace (relaxed: 2-3 activities/day, balanced: 3-4, packed: 5-6).
- Provide approximate lat/lng for each activity when you are confident, else null.
- Give each activity a short unique id like "d1a1". Times in 24h "HH:MM".
- Keep the budget breakdown totals within the user's budget when possible.`;

async function loadTrip(supabase: any, id: string) {
  const { data, error } = await supabase.from("trips").select("*").eq("id", id).single();
  if (error || !data) throw new Error("Trip not found");
  return data;
}

function tripBrief(t: any) {
  return `Destination: ${t.destination}
Dates: ${t.start_date} to ${t.end_date} (${tripDays(t.start_date, t.end_date)} days)
Travelers: ${t.traveler_type}, ${t.traveler_count} people
Budget: ${t.budget} ${t.currency} total (${t.budget_category})
Interests: ${(t.travel_preferences ?? []).join(", ") || "general sightseeing"}
Accommodation: ${t.accommodation_preferences ?? "any"}
Transport: ${t.transportation_preferences ?? "mixed"}
Pace: ${t.pace}
Extra notes (diet, accessibility, wishes): ${t.notes ?? "none"}`;
}

export const generateItinerary = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ tripId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { generateStructured } = await import("./ai.server");
    const trip = await loadTrip(context.supabase, data.tripId);
    const days = tripDays(trip.start_date, trip.end_date);
    if (days < 1 || days > 21) throw new Error("Trips must be 1 to 21 days long.");
    const itin = await generateStructured(
      itinerarySchema,
      INSTRUCTIONS,
      `Plan exactly ${days} days.\n${tripBrief(trip)}`,
    );
    const { error } = await context.supabase
      .from("trips")
      .update({ itinerary: itin, status: "planned" })
      .eq("id", trip.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const regenerateDay = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ tripId: z.string().uuid(), dayIndex: z.number().int().min(0), note: z.string().max(500).optional() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { generateStructured } = await import("./ai.server");
    const trip = await loadTrip(context.supabase, data.tripId);
    const itin = itinerarySchema.parse(trip.itinerary);
    const day = itin.days[data.dayIndex];
    if (!day) throw new Error("Day not found");
    const others = itin.days
      .filter((_, i) => i !== data.dayIndex)
      .map((d) => `Day ${d.dayNumber}: ${d.activities.map((a) => a.name).join(", ")}`)
      .join("\n");
    const newDay = await generateStructured(
      daySchema,
      INSTRUCTIONS,
      `Regenerate ONLY day ${day.dayNumber} (${day.date}) of this trip with fresh ideas. Avoid repeating activities from other days.
${tripBrief(trip)}
Other days (keep unchanged, do not repeat):\n${others}
${data.note ? `User request for this day: ${data.note}` : ""}`,
    );
    newDay.dayNumber = day.dayNumber;
    newDay.date = day.date;
    itin.days[data.dayIndex] = newDay;
    const { error } = await context.supabase.from("trips").update({ itinerary: itin }).eq("id", trip.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
