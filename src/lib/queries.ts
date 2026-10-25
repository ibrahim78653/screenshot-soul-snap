import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Trip = Tables<"trips">;
export type Expense = Tables<"expenses">;
export type SavedPlace = Tables<"saved_places">;
export type Profile = Tables<"profiles">;

export const tripsQuery = queryOptions({
  queryKey: ["trips"],
  queryFn: async () => {
    const { data, error } = await supabase.from("trips").select("*").order("start_date", { ascending: true });
    if (error) throw error;
    return data;
  },
});

export const tripQuery = (id: string) =>
  queryOptions({
    queryKey: ["trip", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("trips").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

export const expensesQuery = (tripId: string) =>
  queryOptions({
    queryKey: ["expenses", tripId],
    queryFn: async () => {
      const { data, error } = await supabase.from("expenses").select("*").eq("trip_id", tripId).order("expense_date");
      if (error) throw error;
      return data;
    },
  });

export const savedQuery = queryOptions({
  queryKey: ["saved"],
  queryFn: async () => {
    const { data, error } = await supabase.from("saved_places").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },
});

export const profileQuery = queryOptions({
  queryKey: ["profile"],
  queryFn: async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return null;
    const { data } = await supabase.from("profiles").select("*").eq("id", u.user.id).maybeSingle();
    return { ...(data ?? { id: u.user.id, full_name: null, preferred_currency: "USD", travel_preferences: {} }), email: u.user.email } as Profile & { email?: string };
  },
});

export function tripStatus(t: Trip): "draft" | "upcoming" | "completed" {
  if (!t.itinerary) return "draft";
  const today = new Date().toISOString().slice(0, 10);
  return t.end_date < today ? "completed" : "upcoming";
}

export async function duplicateTrip(t: Trip) {
  const { id, created_at, updated_at, user_id, ...rest } = t;
  const { data, error } = await supabase.from("trips").insert({ ...rest, title: `${t.title} (copy)` }).select("id").single();
  if (error) throw error;
  return data.id;
}
