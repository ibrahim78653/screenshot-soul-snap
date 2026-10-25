import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { savedQuery } from "@/lib/queries";
import { imageFor } from "@/lib/travel-data";

export const Route = createFileRoute("/_authenticated/saved")({
  head: () => ({ meta: [{ title: "Saved Places — TravelMate AI" }, { name: "description", content: "Your travel wishlist." }, { property: "og:title", content: "Saved Places — TravelMate AI" }, { property: "og:description", content: "Your travel wishlist." }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(savedQuery),
  component: Saved,
});

function Saved() {
  const { data } = useSuspenseQuery(savedQuery);
  const qc = useQueryClient();
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Saved places</h1>
      {data.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-12 text-center text-muted-foreground">Nothing saved yet. <Link to="/explore" className="text-primary">Explore destinations →</Link></div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((p) => (
            <div key={p.id} className="flex gap-3 overflow-hidden rounded-2xl border bg-card shadow-soft">
              <img src={imageFor(p.place_name)} alt="" className="w-28 object-cover" />
              <div className="flex-1 py-3 pr-3">
                <p className="font-semibold">{p.place_name}</p>
                <p className="text-xs text-muted-foreground">{p.category}</p>
                <div className="mt-2 flex gap-2">
                  <Button size="sm" asChild><Link to="/trips/new" search={{ destination: p.destination ?? p.place_name }}>Plan</Link></Button>
                  <Button size="sm" variant="ghost" aria-label="Remove" onClick={async () => { await supabase.from("saved_places").delete().eq("id", p.id); qc.invalidateQueries({ queryKey: ["saved"] }); }}><Trash2 className="text-destructive" /></Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
