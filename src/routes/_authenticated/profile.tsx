import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { profileQuery } from "@/lib/queries";
import { CURRENCIES, INTERESTS, PACES, TRAVELER_TYPES } from "@/lib/travel-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Profile & Settings — TravelMate AI" }, { name: "description", content: "Manage your travel preferences." }, { property: "og:title", content: "Profile — TravelMate AI" }, { property: "og:description", content: "Manage your travel preferences." }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(profileQuery),
  component: Profile,
});

function Profile() {
  const { data: p } = useSuspenseQuery(profileQuery);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const prefs = (p?.travel_preferences ?? {}) as any;
  const [name, setName] = useState(p?.full_name ?? "");
  const [currency, setCurrency] = useState(p?.preferred_currency ?? "USD");
  const [tt, setTt] = useState(prefs.traveler_type ?? "solo");
  const [pace, setPace] = useState(prefs.pace ?? "balanced");
  const [interests, setInterests] = useState<string[]>(prefs.interests ?? []);
  const [diet, setDiet] = useState(prefs.diet ?? "");
  const [access, setAccess] = useState(prefs.access ?? "");

  async function save() {
    const { error } = await supabase.from("profiles").upsert({ id: p!.id, full_name: name, preferred_currency: currency, travel_preferences: { traveler_type: tt, pace, interests, diet, access } });
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["profile"] });
    toast.success("Preferences saved");
  }
  async function reset() {
    if (!p?.email) return;
    const { error } = await supabase.auth.resetPasswordForEmail(p.email, { redirectTo: `${window.location.origin}/reset-password` });
    error ? toast.error(error.message) : toast.success("Reset link sent to your email");
  }
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-3xl font-bold">Profile & settings</h1>
      <div className="space-y-5 rounded-3xl border bg-card p-6 shadow-soft">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5"><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Email</Label><Input value={p?.email ?? ""} disabled /></div>
          <div className="space-y-1.5"><Label>Preferred currency</Label><Select value={currency} onValueChange={setCurrency}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-1.5"><Label>Default traveler type</Label><Select value={tt} onValueChange={setTt}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{TRAVELER_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-1.5"><Label>Default pace</Label><Select value={pace} onValueChange={setPace}><SelectTrigger className="capitalize"><SelectValue /></SelectTrigger><SelectContent>{PACES.map((t) => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-1.5"><Label>Dietary preferences</Label><Input value={diet} onChange={(e) => setDiet(e.target.value)} /></div>
          <div className="space-y-1.5 sm:col-span-2"><Label>Accessibility preferences</Label><Input value={access} onChange={(e) => setAccess(e.target.value)} /></div>
        </div>
        <div><Label>Favorite interests</Label>
          <div className="mt-2 flex flex-wrap gap-2">{INTERESTS.map((i) => <button key={i} onClick={() => setInterests(interests.includes(i) ? interests.filter((x) => x !== i) : [...interests, i])} className={cn("rounded-full border px-3 py-1.5 text-sm", interests.includes(i) ? "border-primary bg-accent text-accent-foreground" : "hover:bg-muted")}>{i}</button>)}</div>
        </div>
        <Button variant="hero" onClick={save}>Save preferences</Button>
      </div>
      <div className="flex flex-wrap gap-2 rounded-3xl border bg-card p-6">
        <Button variant="outline" onClick={reset}>Send password reset email</Button>
        <Button variant="outline" onClick={async () => { await supabase.auth.signOut(); navigate({ to: "/" }); }}>Log out</Button>
      </div>
    </div>
  );
}
