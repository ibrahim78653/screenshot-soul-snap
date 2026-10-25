import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Plus, Plane, CalendarCheck, Flag, Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TripCard } from "@/components/TripCard";
import { tripsQuery, savedQuery, profileQuery, tripStatus } from "@/lib/queries";
import { DESTINATIONS } from "@/lib/travel-data";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — TravelMate AI" }, { name: "description", content: "Your trips at a glance." }, { property: "og:title", content: "Dashboard — TravelMate AI" }, { property: "og:description", content: "Your trips at a glance." }] }),
  loader: ({ context }) => Promise.all([context.queryClient.ensureQueryData(tripsQuery), context.queryClient.ensureQueryData(savedQuery), context.queryClient.ensureQueryData(profileQuery)]),
  component: Dashboard,
});

function Dashboard() {
  const { data: trips } = useSuspenseQuery(tripsQuery);
  const { data: saved } = useSuspenseQuery(savedQuery);
  const { data: profile } = useSuspenseQuery(profileQuery);
  const upcoming = trips.filter((t) => tripStatus(t) === "upcoming");
  const completed = trips.filter((t) => tripStatus(t) === "completed");
  const recent = [...trips].sort((a, b) => b.updated_at.localeCompare(a.updated_at)).slice(0, 3);
  const name = profile?.full_name?.split(" ")[0] ?? "traveler";
  const stats = [
    { label: "Trips planned", value: trips.length, icon: Plane, tone: "bg-accent text-accent-foreground" },
    { label: "Upcoming", value: upcoming.length, icon: CalendarCheck, tone: "bg-chart-3/15 text-chart-3" },
    { label: "Completed", value: completed.length, icon: Flag, tone: "bg-chart-4/15 text-chart-4" },
    { label: "Saved places", value: saved.length, icon: Bookmark, tone: "bg-sun/20 text-sun" },
  ];
  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-muted-foreground">{new Date().toLocaleDateString("en", { weekday: "long", month: "long", day: "numeric" })}</p>
        <h1 className="text-3xl font-bold">Hello, {name}</h1>
      </div>
      <div className="relative overflow-hidden rounded-3xl bg-navy p-8 text-navy-foreground">
        <div className="absolute -right-10 -top-10 size-64 rounded-full bg-gradient-primary opacity-40 blur-3xl" />
        <h2 className="relative text-2xl font-bold">Where are you headed next?</h2>
        <p className="relative mt-1 opacity-80">Build a personalized itinerary in a few steps.</p>
        <Button asChild variant="hero" className="relative mt-5"><Link to="/trips/new"><Plus /> Create new trip</Link></Button>
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border bg-card p-5 shadow-soft">
            <span className={`grid size-9 place-items-center rounded-xl ${s.tone}`}><s.icon className="size-4" /></span>
            <p className="mt-3 text-3xl font-bold">{s.value}</p>
            <p className="text-sm text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>
      <section>
        <div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-semibold">Upcoming trips</h2><Link to="/trips" className="text-sm text-primary">View all</Link></div>
        {upcoming.length ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{upcoming.slice(0, 3).map((t) => <TripCard key={t.id} trip={t} />)}</div>
        ) : (
          <div className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground">No upcoming trips yet. <Link to="/trips/new" className="text-primary">Plan your first one →</Link></div>
        )}
      </section>
      {recent.length > 0 && (
        <section>
          <h2 className="mb-4 text-xl font-semibold">Recently edited</h2>
          <div className="grid gap-3 md:grid-cols-3">{recent.map((t) => <TripCard key={t.id} trip={t} list />)}</div>
        </section>
      )}
      <section>
        <h2 className="mb-4 text-xl font-semibold">Suggested destinations</h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {DESTINATIONS.map((d) => (
            <Link key={d.name} to="/trips/new" search={{ destination: d.name }} className="card-lift relative aspect-[4/3] overflow-hidden rounded-2xl">
              <img src={d.image} alt={d.name} loading="lazy" className="size-full object-cover" />
              <div className="absolute inset-0 bg-gradient-hero" />
              <p className="absolute bottom-3 left-3 font-semibold text-navy-foreground">{d.name}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
