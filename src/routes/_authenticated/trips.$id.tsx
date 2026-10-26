import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense, useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Calendar, Clock, Copy, Loader2, MapPin, Pencil, Plus, Printer, RefreshCw, Save, Sparkles, Trash2, Users, Utensils, BedDouble, Bus, Lightbulb } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { BudgetTracker } from "@/components/BudgetTracker";
import { tripQuery, duplicateTrip } from "@/lib/queries";
import { generateItinerary, regenerateDay } from "@/lib/trips.functions";
import { itinerarySchema, budgetTotal, tripDays, type Activity, type Itinerary } from "@/lib/itinerary-schema";
import { imageFor, money, fmtDate } from "@/lib/travel-data";
import { cn } from "@/lib/utils";

const TripMap = lazy(() => import("@/components/TripMap"));

export const Route = createFileRoute("/_authenticated/trips/$id")({
  head: () => ({ meta: [{ title: "Trip itinerary — TravelMate AI" }, { name: "description", content: "Your day-by-day AI itinerary." }, { property: "og:title", content: "Trip itinerary — TravelMate AI" }, { property: "og:description", content: "Your day-by-day AI itinerary." }] }),
  loader: ({ context, params }) => context.queryClient.ensureQueryData(tripQuery(params.id)),
  component: TripPage,
});

const SLOT_TONE: Record<string, string> = { morning: "bg-sun/20 text-foreground", afternoon: "bg-accent text-accent-foreground", evening: "bg-chart-3/15 text-chart-3" };

function TripPage() {
  const { id } = Route.useParams();
  const { data: trip } = useSuspenseQuery(tripQuery(id));
  const qc = useQueryClient();
  const navigate = useNavigate();
  const genAll = useServerFn(generateItinerary);
  const genDay = useServerFn(regenerateDay);
  const parsed = useMemo(() => { const r = itinerarySchema.safeParse(trip?.itinerary); return r.success ? r.data : null; }, [trip?.itinerary]);
  const [itin, setItin] = useState<Itinerary | null>(parsed);
  const [dirty, setDirty] = useState(false);
  const [dayIdx, setDayIdx] = useState(0);
  const [busy, setBusy] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ a: Activity; idx: number | null } | null>(null);
  const [dayNote, setDayNote] = useState("");
  const [lastParsed, setLastParsed] = useState(parsed);
  if (parsed !== lastParsed) { setLastParsed(parsed); setItin(parsed); setDirty(false); }

  if (!trip) return <div className="p-10 text-center">Trip not found. <Link to="/trips" className="text-primary">Back to trips</Link></div>;
  const day = itin?.days[dayIdx];
  const pins = (day?.activities ?? []).filter((a) => a.lat != null && a.lng != null).map((a, i) => ({ lat: a.lat!, lng: a.lng!, label: a.name, n: i + 1 }));

  const refresh = () => qc.invalidateQueries({ queryKey: ["trip", id] });
  function update(fn: (d: Itinerary) => void) { if (!itin) return; const c = structuredClone(itin); fn(c); setItin(c); setDirty(true); }
  async function save() {
    const { error } = await supabase.from("trips").update({ itinerary: itin }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Changes saved"); setDirty(false); refresh();
  }
  async function regenAll() {
    setBusy("all");
    try { await genAll({ data: { tripId: id } }); await refresh(); toast.success("Itinerary regenerated"); } catch (e: any) { toast.error(e.message); }
    setBusy(null);
  }
  async function regenDay() {
    if (dirty) await save();
    setBusy("day");
    try { await genDay({ data: { tripId: id, dayIndex: dayIdx, note: dayNote || undefined } }); await refresh(); setDayNote(""); toast.success(`Day ${dayIdx + 1} regenerated`); } catch (e: any) { toast.error(e.message); }
    setBusy(null);
  }
  function move(i: number, dir: -1 | 1) { update((d) => { const a = d.days[dayIdx]!.activities; const j = i + dir; if (j < 0 || j >= a.length) return; const t = a[i]!; a[i] = a[j]!; a[j] = t; }); }
  function saveActivity() {
    if (!editing) return;
    update((d) => { const a = d.days[dayIdx]!.activities; if (editing.idx == null) a.push(editing.a); else a[editing.idx] = editing.a; a.sort((x, y) => x.time.localeCompare(y.time)); });
    setEditing(null);
  }
  async function del() { await supabase.from("trips").delete().eq("id", id); qc.invalidateQueries({ queryKey: ["trips"] }); navigate({ to: "/trips" }); }
  async function dup() { const nid = await duplicateTrip(trip!); qc.invalidateQueries({ queryKey: ["trips"] }); navigate({ to: "/trips/$id", params: { id: nid } }); }

  const total = itin ? budgetTotal(itin.budget) : 0;

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl">
        <img src={imageFor(trip.destination)} alt={trip.destination} className="h-56 w-full object-cover md:h-64" />
        <div className="absolute inset-0 bg-gradient-hero" />
        <div className="absolute inset-x-0 bottom-0 p-6 text-navy-foreground">
          <h1 className="text-3xl font-bold md:text-4xl">{trip.title}</h1>
          <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm opacity-90">
            <span className="flex items-center gap-1"><MapPin className="size-4" />{trip.destination}</span>
            <span className="flex items-center gap-1"><Calendar className="size-4" />{fmtDate(trip.start_date)} – {fmtDate(trip.end_date)} · {tripDays(trip.start_date, trip.end_date)} days</span>
            <span className="flex items-center gap-1 capitalize"><Users className="size-4" />{trip.traveler_type} · {trip.traveler_count}</span>
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 print:hidden">
        <Button variant="outline" size="sm" asChild><Link to="/trips/new" search={{ edit: id }}><Pencil /> Edit details</Link></Button>
        <Button variant="outline" size="sm" onClick={regenAll} disabled={!!busy}>{busy === "all" ? <Loader2 className="animate-spin" /> : <Sparkles />} {itin ? "Regenerate all" : "Generate itinerary"}</Button>
        <Button variant="outline" size="sm" onClick={dup}><Copy /> Duplicate</Button>
        <Button variant="outline" size="sm" onClick={() => window.print()}><Printer /> Print / PDF</Button>
        <AlertDialog>
          <AlertDialogTrigger asChild><Button variant="outline" size="sm"><Trash2 /> Delete</Button></AlertDialogTrigger>
          <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete this trip?</AlertDialogTitle><AlertDialogDescription>This can't be undone.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={del}>Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
        </AlertDialog>
        {dirty && <Button size="sm" variant="hero" onClick={save}><Save /> Save changes</Button>}
      </div>

      {!itin ? (
        <div className="rounded-3xl border border-dashed p-12 text-center">
          <p className="text-muted-foreground">{busy === "all" ? "Generating your itinerary… this can take up to a minute." : "No itinerary yet. Generate one from your trip details."}</p>
        </div>
      ) : (
        <Tabs defaultValue="plan">
          <TabsList className="print:hidden"><TabsTrigger value="plan">Itinerary</TabsTrigger><TabsTrigger value="stay">Stays & transport</TabsTrigger><TabsTrigger value="budget">Budget</TabsTrigger></TabsList>
          <TabsContent value="plan" className="mt-6 space-y-6">
            <div className="rounded-2xl bg-accent p-5 text-accent-foreground">
              <p>{itin.summary}</p>
              <p className="mt-2 text-sm font-semibold">Estimated total: {money(total, trip.currency)} <span className="font-normal opacity-75">(budget {money(Number(trip.budget), trip.currency)})</span></p>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 print:hidden">
              {itin.days.map((d, i) => (
                <button key={i} onClick={() => setDayIdx(i)} className={cn("shrink-0 rounded-2xl border px-4 py-2 text-left text-sm", i === dayIdx ? "border-primary bg-card shadow-soft" : "bg-card/50 hover:bg-card")}>
                  <span className="block text-xs text-muted-foreground">Day {d.dayNumber}</span><span className="font-medium">{d.title}</span>
                </button>
              ))}
            </div>
            {day && (
              <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Day {day.dayNumber} · {fmtDate(day.date)}</p>
                    <h2 className="text-2xl font-bold">{day.title}</h2>
                    <p className="mt-1 text-muted-foreground">{day.summary}</p>
                  </div>
                  <ol className="space-y-3">
                    {day.activities.map((a, i) => (
                      <li key={a.id + i} className="group rounded-2xl border bg-card p-4 shadow-soft">
                        <div className="flex items-start gap-3">
                          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-gradient-primary text-sm font-bold text-primary-foreground">{i + 1}</span>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-semibold text-primary">{a.time}</span>
                              <span className={cn("rounded-full px-2 py-0.5 text-xs capitalize", SLOT_TONE[a.slot])}>{a.slot}</span>
                              <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{a.category}</span>
                            </div>
                            <h3 className="mt-1 font-semibold">{a.name}</h3>
                            <p className="text-sm text-muted-foreground">{a.description}</p>
                            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1"><Clock className="size-3" />{a.durationMinutes} min</span>
                              <span className="flex items-center gap-1"><MapPin className="size-3" />{a.location}</span>
                              <span>Est. {money(a.estimatedCost, trip.currency)}</span>
                              {a.transport && <span className="flex items-center gap-1"><Bus className="size-3" />{a.transport}</span>}
                            </div>
                            {a.tip && <p className="mt-2 flex gap-1 text-xs"><Lightbulb className="size-3.5 shrink-0 text-sun" />{a.tip}</p>}
                          </div>
                          <div className="flex flex-col gap-1 opacity-60 transition-opacity group-hover:opacity-100 print:hidden">
                            <button aria-label="Move up" onClick={() => move(i, -1)}><ArrowUp className="size-4" /></button>
                            <button aria-label="Move down" onClick={() => move(i, 1)}><ArrowDown className="size-4" /></button>
                            <button aria-label="Edit" onClick={() => setEditing({ a: { ...a }, idx: i })}><Pencil className="size-4" /></button>
                            <button aria-label="Remove" onClick={() => update((d) => { d.days[dayIdx]!.activities.splice(i, 1); })}><Trash2 className="size-4 text-destructive" /></button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ol>
                  <div className="flex flex-wrap gap-2 print:hidden">
                    <Button variant="outline" size="sm" onClick={() => setEditing({ a: { id: `c${Date.now()}`, time: "12:00", slot: "afternoon", name: "", description: "", category: "Custom", durationMinutes: 60, estimatedCost: 0, location: trip.destination, lat: null, lng: null, transport: "", tip: null }, idx: null })}><Plus /> Add activity</Button>
                    <Input className="h-8 min-w-48 flex-1" placeholder="Optional: what should change for this day?" value={dayNote} onChange={(e) => setDayNote(e.target.value)} />
                    <Button variant="outline" size="sm" onClick={regenDay} disabled={!!busy}>{busy === "day" ? <Loader2 className="animate-spin" /> : <RefreshCw />} Regenerate day</Button>
                  </div>
                  {day.dining.length > 0 && (
                    <div className="rounded-2xl border bg-card p-4">
                      <h3 className="flex items-center gap-2 font-semibold"><Utensils className="size-4 text-primary" /> Where to eat</h3>
                      <ul className="mt-3 space-y-2 text-sm">{day.dining.map((r) => <li key={r.name} className="flex justify-between gap-3"><span><b>{r.name}</b> · {r.cuisine} <span className="text-muted-foreground">— {r.note}</span></span><span className="shrink-0">≈ {money(r.estimatedCost, trip.currency)}</span></li>)}</ul>
                    </div>
                  )}
                  {day.alternatives.length > 0 && <p className="text-sm text-muted-foreground"><b>Alternatives:</b> {day.alternatives.join(" · ")}</p>}
                </div>
                <div className="h-[420px] overflow-hidden rounded-2xl border shadow-soft lg:sticky lg:top-6 print:hidden">
                  <ClientOnly fallback={<div className="size-full animate-pulse bg-muted" />}>
                    <Suspense fallback={<div className="size-full animate-pulse bg-muted" />}><TripMap pins={pins} /></Suspense>
                  </ClientOnly>
                  {pins.length === 0 && <p className="-mt-10 relative z-10 text-center text-xs text-muted-foreground">No map locations for this day</p>}
                </div>
              </div>
            )}
            {itin.tips.length > 0 && <div className="rounded-2xl border bg-card p-5"><h3 className="font-semibold">Practical tips</h3><ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">{itin.tips.map((t) => <li key={t}>{t}</li>)}</ul></div>}
          </TabsContent>
          <TabsContent value="stay" className="mt-6 grid gap-6 md:grid-cols-2">
            <div className="space-y-3"><h3 className="flex items-center gap-2 text-lg font-semibold"><BedDouble className="size-5 text-primary" /> Where to stay</h3>
              {itin.accommodations.map((h) => <div key={h.name} className="rounded-2xl border bg-card p-4 shadow-soft"><div className="flex justify-between"><b>{h.name}</b><span className="text-sm">≈ {money(h.nightlyPrice, trip.currency)}/night</span></div><p className="text-sm text-muted-foreground">{h.area}</p><p className="mt-1 text-sm">{h.reason}</p></div>)}
            </div>
            <div className="space-y-3"><h3 className="flex items-center gap-2 text-lg font-semibold"><Bus className="size-5 text-primary" /> Getting around</h3>
              {itin.transportation.map((t) => <div key={t.mode} className="rounded-2xl border bg-card p-4 shadow-soft"><div className="flex justify-between"><b>{t.mode}</b><span className="text-sm">≈ {money(t.estimatedCost, trip.currency)}</span></div><p className="mt-1 text-sm text-muted-foreground">{t.note}</p></div>)}
            </div>
            <p className="text-xs text-muted-foreground md:col-span-2">Suggestions and prices are AI estimates. Availability and bookings are not confirmed.</p>
          </TabsContent>
          <TabsContent value="budget" className="mt-6"><BudgetTracker trip={trip} itin={itin} /></TabsContent>
        </Tabs>
      )}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing?.idx == null ? "Add activity" : "Edit activity"}</DialogTitle></DialogHeader>
          {editing && (
            <div className="grid gap-3">
              <Input placeholder="Name" value={editing.a.name} onChange={(e) => setEditing({ ...editing, a: { ...editing.a, name: e.target.value } })} />
              <Textarea placeholder="Description" value={editing.a.description} onChange={(e) => setEditing({ ...editing, a: { ...editing.a, description: e.target.value } })} />
              <div className="grid grid-cols-3 gap-2">
                <Input type="time" value={editing.a.time} onChange={(e) => { const t = e.target.value; setEditing({ ...editing, a: { ...editing.a, time: t, slot: t < "12:00" ? "morning" : t < "17:00" ? "afternoon" : "evening" } }); }} />
                <Input type="number" placeholder="Minutes" value={editing.a.durationMinutes} onChange={(e) => setEditing({ ...editing, a: { ...editing.a, durationMinutes: +e.target.value } })} />
                <Input type="number" placeholder="Cost" value={editing.a.estimatedCost} onChange={(e) => setEditing({ ...editing, a: { ...editing.a, estimatedCost: +e.target.value } })} />
              </div>
              <Input placeholder="Location" value={editing.a.location} onChange={(e) => setEditing({ ...editing, a: { ...editing.a, location: e.target.value } })} />
            </div>
          )}
          <DialogFooter><Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button><Button disabled={!editing?.a.name.trim()} onClick={saveActivity}>Done</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
