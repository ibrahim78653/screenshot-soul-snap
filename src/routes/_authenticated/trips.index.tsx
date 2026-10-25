import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { LayoutGrid, List, Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TripCard } from "@/components/TripCard";
import { tripsQuery, tripStatus } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/trips/")({
  head: () => ({ meta: [{ title: "My Trips — TravelMate AI" }, { name: "description", content: "Manage your planned, draft and past trips." }, { property: "og:title", content: "My Trips — TravelMate AI" }, { property: "og:description", content: "Manage your trips." }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(tripsQuery),
  component: Trips,
});

function Trips() {
  const { data } = useSuspenseQuery(tripsQuery);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("date");
  const [view, setView] = useState<"grid" | "list">("grid");
  const list = useMemo(() => {
    let r = data.filter((t) => t.destination.toLowerCase().includes(q.toLowerCase()) || t.title.toLowerCase().includes(q.toLowerCase()));
    if (status !== "all") r = r.filter((t) => tripStatus(t) === status);
    return [...r].sort((a, b) => (sort === "date" ? a.start_date.localeCompare(b.start_date) : b.updated_at.localeCompare(a.updated_at)));
  }, [data, q, status, sort]);
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">My Trips</h1>
        <Button asChild variant="hero"><Link to="/trips/new"><Plus /> New trip</Link></Button>
      </div>
      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-60 flex-1"><Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" /><Input className="pl-9" placeholder="Search destination" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <Select value={status} onValueChange={setStatus}><SelectTrigger className="w-36"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="upcoming">Upcoming</SelectItem><SelectItem value="draft">Drafts</SelectItem><SelectItem value="completed">Past</SelectItem></SelectContent></Select>
        <Select value={sort} onValueChange={setSort}><SelectTrigger className="w-44"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="date">Departure date</SelectItem><SelectItem value="updated">Recently updated</SelectItem></SelectContent></Select>
        <div className="flex rounded-md border">
          <button aria-label="Grid" onClick={() => setView("grid")} className={`p-2 ${view === "grid" ? "bg-accent" : ""}`}><LayoutGrid className="size-4" /></button>
          <button aria-label="List" onClick={() => setView("list")} className={`p-2 ${view === "list" ? "bg-accent" : ""}`}><List className="size-4" /></button>
        </div>
      </div>
      {list.length ? (
        <div className={view === "grid" ? "grid gap-5 sm:grid-cols-2 lg:grid-cols-3" : "grid gap-3"}>{list.map((t) => <TripCard key={t.id} trip={t} list={view === "list"} />)}</div>
      ) : (
        <div className="rounded-2xl border border-dashed p-12 text-center text-muted-foreground">No trips found.</div>
      )}
    </div>
  );
}
