import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Bookmark, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DESTINATIONS } from "@/lib/travel-data";

export const Route = createFileRoute("/_authenticated/explore")({
  head: () => ({ meta: [{ title: "Explore Destinations — TravelMate AI" }, { name: "description", content: "Discover destinations and save places." }, { property: "og:title", content: "Explore — TravelMate AI" }, { property: "og:description", content: "Discover destinations." }] }),
  component: Explore,
});

function Explore() {
  const [q, setQ] = useState("");
  const qc = useQueryClient();
  const list = DESTINATIONS.filter((d) => (d.name + d.tag).toLowerCase().includes(q.toLowerCase()));
  async function save(name: string, tag: string) {
    const { error } = await supabase.from("saved_places").insert({ place_name: name, destination: name, category: tag });
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["saved"] });
    toast.success("Saved to your wishlist");
  }
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Explore destinations</h1>
      <p className="text-sm text-muted-foreground">Demonstration picks to inspire you. Or type any destination when planning.</p>
      <div className="relative max-w-md"><Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" /><Input className="pl-9" placeholder="Search" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {list.map((d) => (
          <div key={d.name} className="card-lift overflow-hidden rounded-2xl border bg-card shadow-soft">
            <img src={d.image} alt={d.name} loading="lazy" className="aspect-[4/3] w-full object-cover" />
            <div className="p-4">
              <span className="rounded-full bg-accent px-2 py-0.5 text-xs text-accent-foreground">{d.tag}</span>
              <h3 className="mt-2 font-semibold">{d.name}</h3>
              <p className="text-sm text-muted-foreground">{d.blurb}</p>
              <p className="mt-2 text-xs text-muted-foreground">Suggested {d.days} · {d.cost}</p>
              <div className="mt-3 flex gap-2">
                <Button size="sm" asChild><Link to="/trips/new" search={{ destination: d.name }}>Plan trip</Link></Button>
                <Button size="sm" variant="outline" onClick={() => save(d.name, d.tag)}><Bookmark /> Save</Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
