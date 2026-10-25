import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Calendar, Copy, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { imageFor, fmtDate, money } from "@/lib/travel-data";
import { tripDays } from "@/lib/itinerary-schema";
import { duplicateTrip, tripStatus, type Trip } from "@/lib/queries";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const STATUS_STYLE = { draft: "bg-sun/20 text-foreground", upcoming: "bg-accent text-accent-foreground", completed: "bg-muted text-muted-foreground" };

export function TripCard({ trip, list }: { trip: Trip; list?: boolean }) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const status = tripStatus(trip);
  async function dup() {
    try { const id = await duplicateTrip(trip); qc.invalidateQueries({ queryKey: ["trips"] }); toast.success("Trip duplicated"); navigate({ to: "/trips/$id", params: { id } }); }
    catch (e: any) { toast.error(e.message); }
  }
  async function del() {
    const { error } = await supabase.from("trips").delete().eq("id", trip.id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["trips"] });
    toast.success("Trip deleted");
  }
  return (
    <div className={`card-lift group overflow-hidden rounded-2xl border bg-card shadow-soft ${list ? "flex" : ""}`}>
      <Link to="/trips/$id" params={{ id: trip.id }} className={`relative block overflow-hidden ${list ? "w-40 shrink-0" : "aspect-[16/10]"}`}>
        <img src={imageFor(trip.destination)} alt={trip.destination} loading="lazy" className="size-full object-cover transition-transform duration-500 group-hover:scale-105" />
        <Badge className={`absolute left-3 top-3 capitalize ${STATUS_STYLE[status]}`}>{status}</Badge>
      </Link>
      <div className="flex-1 p-4">
        <h3 className="font-semibold">{trip.title}</h3>
        <p className="text-sm text-muted-foreground">{trip.destination}</p>
        <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground"><Calendar className="size-3.5" />{fmtDate(trip.start_date)} – {fmtDate(trip.end_date)} · {tripDays(trip.start_date, trip.end_date)} days</p>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-sm font-semibold">{money(Number(trip.budget), trip.currency)}</span>
          <div className="flex gap-1">
            <Link to="/trips/$id" params={{ id: trip.id }} className="rounded-lg p-1.5 hover:bg-muted" aria-label="View"><Eye className="size-4" /></Link>
            <button onClick={dup} className="rounded-lg p-1.5 hover:bg-muted" aria-label="Duplicate"><Copy className="size-4" /></button>
            <AlertDialog>
              <AlertDialogTrigger className="rounded-lg p-1.5 text-destructive hover:bg-muted" aria-label="Delete"><Trash2 className="size-4" /></AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader><AlertDialogTitle>Delete this trip?</AlertDialogTitle><AlertDialogDescription>“{trip.title}” and its expenses will be removed permanently.</AlertDialogDescription></AlertDialogHeader>
                <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={del}>Delete</AlertDialogAction></AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
    </div>
  );
}
