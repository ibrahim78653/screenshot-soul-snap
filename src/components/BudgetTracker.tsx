import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Trash2, Plus } from "lucide-react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { expensesQuery, type Trip } from "@/lib/queries";
import { BUDGET_CATEGORIES, budgetTotal, type Itinerary } from "@/lib/itinerary-schema";
import { money } from "@/lib/travel-data";

const LABEL: Record<string, string> = { accommodation: "Stay", food: "Food", transport: "Transport", activities: "Activities", misc: "Misc" };

export function BudgetTracker({ trip, itin }: { trip: Trip; itin: Itinerary | null }) {
  const qc = useQueryClient();
  const { data: expenses = [] } = useQuery(expensesQuery(trip.id));
  const [form, setForm] = useState({ category: "food", description: "", amount: "" });
  // Only expenses in the trip currency are summed; others are listed but excluded (no conversion).
  const same = expenses.filter((e) => e.currency === trip.currency);
  const actual = same.reduce((s, e) => s + Number(e.amount), 0);
  const estimated = itin ? budgetTotal(itin.budget) : 0;
  const budget = Number(trip.budget);
  const chart = BUDGET_CATEGORIES.map((k) => ({ name: LABEL[k], Estimated: itin ? Number(itin.budget[k]) : 0, Actual: same.filter((e) => e.category === k).reduce((s, e) => s + Number(e.amount), 0) }));

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const amount = Number(form.amount);
    if (!(amount > 0)) return toast.error("Enter an amount");
    const { error } = await supabase.from("expenses").insert({ trip_id: trip.id, category: form.category, description: form.description, amount, currency: trip.currency });
    if (error) return toast.error(error.message);
    setForm({ ...form, description: "", amount: "" });
    qc.invalidateQueries({ queryKey: ["expenses", trip.id] });
  }
  async function del(id: string) {
    await supabase.from("expenses").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["expenses", trip.id] });
  }

  const stats = [["Total budget", budget], ["Estimated plan", estimated], ["Actual spent", actual], ["Remaining", budget - actual]] as const;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map(([k, v]) => (
          <div key={k} className="rounded-2xl border bg-card p-4 shadow-soft"><p className="text-xs text-muted-foreground">{k}</p><p className={`mt-1 text-xl font-bold ${k === "Remaining" && v < 0 ? "text-destructive" : ""}`}>{money(v, trip.currency)}</p></div>
        ))}
      </div>
      <div className="h-64 rounded-2xl border bg-card p-4 shadow-soft">
        <ResponsiveContainer><BarChart data={chart}><XAxis dataKey="name" fontSize={12} /><YAxis fontSize={12} /><Tooltip /><Legend /><Bar dataKey="Estimated" fill="var(--chart-1)" radius={6} /><Bar dataKey="Actual" fill="var(--chart-2)" radius={6} /></BarChart></ResponsiveContainer>
      </div>
      <form onSubmit={add} className="flex flex-wrap gap-2 rounded-2xl border bg-card p-4">
        <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}><SelectTrigger className="w-36"><SelectValue /></SelectTrigger><SelectContent>{BUDGET_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{LABEL[c]}</SelectItem>)}</SelectContent></Select>
        <Input className="min-w-40 flex-1" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <Input className="w-32" type="number" step="0.01" placeholder={`Amount (${trip.currency})`} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
        <Button type="submit"><Plus /> Add expense</Button>
      </form>
      <ul className="divide-y rounded-2xl border bg-card">
        {expenses.length === 0 && <li className="p-6 text-center text-sm text-muted-foreground">No expenses logged yet.</li>}
        {expenses.map((e) => (
          <li key={e.id} className="flex items-center justify-between p-4 text-sm">
            <div><p className="font-medium">{e.description || LABEL[e.category]}</p><p className="text-xs text-muted-foreground">{LABEL[e.category] ?? e.category} · {e.expense_date}</p></div>
            <div className="flex items-center gap-3"><span className="font-semibold">{money(Number(e.amount), e.currency)}</span><button onClick={() => del(e.id)} aria-label="Delete expense"><Trash2 className="size-4 text-destructive" /></button></div>
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted-foreground">Plan figures are AI estimates, not confirmed prices.</p>
    </div>
  );
}
