import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Check, ChevronLeft, ChevronRight, Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { generateItinerary } from "@/lib/trips.functions";
import { tripDays } from "@/lib/itinerary-schema";
import { ACCOMMODATION, BUDGET_TIERS, CURRENCIES, DESTINATIONS, INTERESTS, PACES, TRANSPORT, TRAVELER_TYPES, money, fmtDate } from "@/lib/travel-data";
import { profileQuery, tripQuery } from "@/lib/queries";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/trips/new")({
  validateSearch: (s: Record<string, unknown>): { destination?: string; edit?: string } => ({
    ...(typeof s["destination"] === "string" ? { destination: s["destination"] } : {}),
    ...(typeof s["edit"] === "string" ? { edit: s["edit"] } : {}),
  }),
  head: () => ({ meta: [{ title: "Plan a Trip — TravelMate AI" }, { name: "description", content: "Build a personalized AI itinerary step by step." }, { property: "og:title", content: "Plan a Trip — TravelMate AI" }, { property: "og:description", content: "Build a personalized AI itinerary." }] }),
  component: Builder,
});

const STEPS = ["Destination", "Dates", "Travelers", "Budget", "Interests", "Logistics", "Review"];
const LOADING = ["Reading your preferences…", "Picking places that fit your style…", "Grouping nearby stops by day…", "Estimating costs…", "Almost there — finishing your plan…"];

type Form = {
  destination: string; start_date: string; end_date: string; traveler_type: string; adults: number; children: number;
  budget: number; currency: string; budget_category: string; interests: string[]; transport: string; accommodation: string;
  pace: string; diet: string; access: string; notes: string;
};

function Builder() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const gen = useServerFn(generateItinerary);
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(0);
  const [errors, setErrors] = useState<string | null>(null);
  const [f, setF] = useState<Form>({
    destination: search.destination ?? "", start_date: "", end_date: "", traveler_type: "solo", adults: 1, children: 0,
    budget: 1500, currency: "USD", budget_category: "moderate", interests: [], transport: "Mixed", accommodation: "Boutique hotel",
    pace: "balanced", diet: "", access: "", notes: "",
  });
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    (async () => {
      if (search.edit) {
        const t = await qc.fetchQuery(tripQuery(search.edit));
        if (t) setF((p) => ({ ...p, destination: t.destination, start_date: t.start_date, end_date: t.end_date, traveler_type: t.traveler_type, adults: t.traveler_count, children: 0, budget: Number(t.budget), currency: t.currency, budget_category: t.budget_category, interests: (t.travel_preferences as string[]) ?? [], transport: t.transportation_preferences ?? "Mixed", accommodation: t.accommodation_preferences ?? "Boutique hotel", pace: t.pace, notes: t.notes ?? "" }));
        return;
      }
      const p = await qc.fetchQuery(profileQuery);
      const prefs = (p?.travel_preferences ?? {}) as any;
      setF((x) => ({ ...x, currency: p?.preferred_currency ?? x.currency, traveler_type: prefs.traveler_type ?? x.traveler_type, interests: prefs.interests ?? x.interests, pace: prefs.pace ?? x.pace, diet: prefs.diet ?? "", access: prefs.access ?? "" }));
    })();
  }, [search.edit, qc]);

  useEffect(() => {
    if (!busy) return;
    const i = setInterval(() => setMsg((m) => Math.min(m + 1, LOADING.length - 1)), 5000);
    return () => clearInterval(i);
  }, [busy]);

  const days = tripDays(f.start_date, f.end_date);
  const travelers = f.traveler_type === "solo" ? 1 : f.traveler_type === "couple" ? 2 : f.adults + f.children;
  const today = new Date().toISOString().slice(0, 10);

  function validate(s: number): string | null {
    if (s === 0 && f.destination.trim().length < 2) return "Enter a destination.";
    if (s === 1) {
      if (!f.start_date || !f.end_date) return "Pick both dates.";
      if (days < 1) return "Return date must be on or after departure.";
      if (days > 21) return "Trips can be up to 21 days.";
    }
    if (s === 2 && travelers < 1) return "Add at least one traveler.";
    if (s === 3 && (!(f.budget > 0))) return "Enter a budget above zero.";
    if (s === 4 && f.interests.length === 0) return "Pick at least one interest.";
    return null;
  }
  function next() { const e = validate(step); setErrors(e); if (!e) setStep((s) => s + 1); }

  async function submit() {
    for (let i = 0; i < 6; i++) { const e = validate(i); if (e) { setStep(i); setErrors(e); return; } }
    setBusy(true); setMsg(0);
    const notes = [f.diet && `Dietary: ${f.diet}`, f.access && `Accessibility: ${f.access}`, f.children ? `${f.children} children` : "", f.notes].filter(Boolean).join(". ");
    const row = {
      title: `${f.destination.split(",")[0]} trip`, destination: f.destination.trim(), start_date: f.start_date, end_date: f.end_date,
      traveler_type: f.traveler_type, traveler_count: travelers, budget: f.budget, currency: f.currency, budget_category: f.budget_category,
      travel_preferences: f.interests, accommodation_preferences: f.accommodation, transportation_preferences: f.transport, pace: f.pace, notes,
    };
    let id = search.edit;
    if (id) {
      const { error } = await supabase.from("trips").update(row).eq("id", id);
      if (error) { setBusy(false); return toast.error(error.message); }
    } else {
      const { data, error } = await supabase.from("trips").insert(row).select("id").single();
      if (error) { setBusy(false); return toast.error(error.message); }
      id = data.id;
    }
    qc.invalidateQueries({ queryKey: ["trips"] });
    try {
      await gen({ data: { tripId: id! } });
      await qc.invalidateQueries({ queryKey: ["trip", id] });
      toast.success("Your itinerary is ready!");
    } catch (e: any) {
      toast.error(e.message ?? "Generation failed. Your trip was saved as a draft.");
    }
    setBusy(false);
    navigate({ to: "/trips/$id", params: { id: id! } });
  }

  if (busy) {
    return (
      <div className="mx-auto mt-20 max-w-md text-center">
        <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground"><Loader2 className="size-7 animate-spin" /></div>
        <h2 className="mt-6 text-2xl font-bold">Planning {f.destination.split(",")[0]}</h2>
        <p className="mt-2 text-muted-foreground">{LOADING[msg]}</p>
        <p className="mt-6 text-xs text-muted-foreground">This usually takes under a minute.</p>
      </div>
    );
  }

  const chip = (active: boolean) => cn("rounded-full border px-4 py-2 text-sm transition-colors", active ? "border-primary bg-accent text-accent-foreground" : "hover:bg-muted");

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-bold">{search.edit ? "Edit trip" : "Plan a trip"}</h1>
      <ol className="mt-6 flex gap-1.5">
        {STEPS.map((s, i) => (
          <li key={s} className="flex-1">
            <div className={cn("h-1.5 rounded-full", i <= step ? "bg-primary" : "bg-muted")} />
            <p className={cn("mt-2 hidden text-xs sm:block", i === step ? "font-semibold" : "text-muted-foreground")}>{s}</p>
          </li>
        ))}
      </ol>
      <div className="mt-8 rounded-3xl border bg-card p-6 shadow-soft md:p-8">
        {step === 0 && (
          <div className="space-y-4">
            <Label htmlFor="dest" className="text-lg">Where do you want to go?</Label>
            <Input id="dest" className="h-12 text-base" placeholder="City, region or country (e.g. Lisbon, Portugal)" value={f.destination} onChange={(e) => set("destination", e.target.value)} />
            <div className="flex flex-wrap gap-2">{DESTINATIONS.map((d) => <button key={d.name} className={chip(f.destination === d.name)} onClick={() => set("destination", d.name)}>{d.name}</button>)}</div>
          </div>
        )}
        {step === 1 && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5"><Label>Departure</Label><Input type="date" min={today} value={f.start_date} onChange={(e) => set("start_date", e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Return</Label><Input type="date" min={f.start_date || today} value={f.end_date} onChange={(e) => set("end_date", e.target.value)} /></div>
            {days > 0 && <p className="text-sm text-primary sm:col-span-2">{days} day{days > 1 ? "s" : ""}</p>}
          </div>
        )}
        {step === 2 && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{TRAVELER_TYPES.map((t) => <button key={t.value} className={cn(chip(f.traveler_type === t.value), "rounded-2xl py-4")} onClick={() => set("traveler_type", t.value)}>{t.label}</button>)}</div>
            {(f.traveler_type === "family" || f.traveler_type === "friends") && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label>Adults</Label><Input type="number" min={1} max={20} value={f.adults} onChange={(e) => set("adults", Math.max(1, +e.target.value))} /></div>
                <div className="space-y-1.5"><Label>Children</Label><Input type="number" min={0} max={20} value={f.children} onChange={(e) => set("children", Math.max(0, +e.target.value))} /></div>
              </div>
            )}
          </div>
        )}
        {step === 3 && (
          <div className="space-y-5">
            <div className="grid grid-cols-[1fr_120px] gap-3">
              <div className="space-y-1.5"><Label>Total budget</Label><Input type="number" min={0} value={f.budget} onChange={(e) => set("budget", +e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Currency</Label><Select value={f.currency} onValueChange={(v) => set("currency", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <p className="text-sm text-muted-foreground">≈ {money(f.budget / Math.max(travelers, 1), f.currency)} per person</p>
            <div className="flex flex-wrap gap-2">{BUDGET_TIERS.map((b) => <button key={b} className={cn(chip(f.budget_category === b), "capitalize")} onClick={() => set("budget_category", b)}>{b}</button>)}</div>
          </div>
        )}
        {step === 4 && (
          <div className="flex flex-wrap gap-2">{INTERESTS.map((i) => <button key={i} className={chip(f.interests.includes(i))} onClick={() => set("interests", f.interests.includes(i) ? f.interests.filter((x) => x !== i) : [...f.interests, i])}>{f.interests.includes(i) && <Check className="mr-1 inline size-3.5" />}{i}</button>)}</div>
        )}
        {step === 5 && (
          <div className="space-y-5">
            <div><Label>Getting around</Label><div className="mt-2 flex flex-wrap gap-2">{TRANSPORT.map((t) => <button key={t} className={chip(f.transport === t)} onClick={() => set("transport", t)}>{t}</button>)}</div></div>
            <div><Label>Stay</Label><div className="mt-2 flex flex-wrap gap-2">{ACCOMMODATION.map((t) => <button key={t} className={chip(f.accommodation === t)} onClick={() => set("accommodation", t)}>{t}</button>)}</div></div>
            <div><Label>Pace</Label><div className="mt-2 flex flex-wrap gap-2">{PACES.map((t) => <button key={t} className={cn(chip(f.pace === t), "capitalize")} onClick={() => set("pace", t)}>{t}</button>)}</div></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5"><Label>Dietary preferences</Label><Input value={f.diet} onChange={(e) => set("diet", e.target.value)} placeholder="e.g. vegetarian" /></div>
              <div className="space-y-1.5"><Label>Accessibility needs</Label><Input value={f.access} onChange={(e) => set("access", e.target.value)} placeholder="e.g. step-free access" /></div>
            </div>
            <div className="space-y-1.5"><Label>Anything else?</Label><Textarea value={f.notes} onChange={(e) => set("notes", e.target.value)} maxLength={500} placeholder="Must-sees, things to avoid…" /></div>
          </div>
        )}
        {step === 6 && (
          <dl className="grid gap-4 sm:grid-cols-2">
            {[["Destination", f.destination], ["Dates", f.start_date && `${fmtDate(f.start_date)} – ${fmtDate(f.end_date)} (${days} days)`], ["Travelers", `${TRAVELER_TYPES.find((t) => t.value === f.traveler_type)?.label} · ${travelers}`], ["Budget", `${money(f.budget, f.currency)} · ${f.budget_category}`], ["Interests", f.interests.join(", ")], ["Logistics", `${f.transport} · ${f.accommodation} · ${f.pace}`]].map(([k, v]) => (
              <div key={k} className="rounded-2xl bg-muted p-4"><dt className="text-xs text-muted-foreground">{k}</dt><dd className="mt-1 font-medium">{v || "—"}</dd></div>
            ))}
          </dl>
        )}
        {errors && <p className="mt-4 text-sm text-destructive">{errors}</p>}
        <div className="mt-8 flex justify-between">
          <Button variant="ghost" disabled={step === 0} onClick={() => { setErrors(null); setStep((s) => s - 1); }}><ChevronLeft /> Back</Button>
          {step < 6 ? <Button variant="hero" onClick={next}>Continue <ChevronRight /></Button> : <Button variant="hero" size="lg" onClick={submit}><Sparkles /> Generate my itinerary</Button>}
        </div>
      </div>
    </div>
  );
}
