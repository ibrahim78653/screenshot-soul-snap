import { createFileRoute, Link, Outlet, redirect, useNavigate, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Map, PlusCircle, Compass, Bookmark, Settings, LogOut, Menu } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/Logo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: Layout,
});

const NAV = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { to: "/trips", label: "My Trips", icon: Map },
  { to: "/trips/new", label: "Plan a Trip", icon: PlusCircle },
  { to: "/explore", label: "Explore", icon: Compass },
  { to: "/saved", label: "Saved Places", icon: Bookmark },
  { to: "/profile", label: "Profile & Settings", icon: Settings },
] as const;

function Layout() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const nav = (
    <nav className="flex flex-col gap-1">
      {NAV.map((n) => {
        const active = path === n.to || (n.to === "/trips" && path.startsWith("/trips/") && path !== "/trips/new");
        return (
          <Link key={n.to} to={n.to} onClick={() => setOpen(false)} className={cn("flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors", active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground")}>
            <n.icon className={cn("size-4", active && "text-sidebar-primary")} /> {n.label}
          </Link>
        );
      })}
    </nav>
  );
  return (
    <div className="min-h-screen bg-background lg:pl-64">
      <aside className={cn("fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-sidebar p-5 text-sidebar-foreground transition-transform print:hidden lg:translate-x-0", open ? "translate-x-0" : "-translate-x-full")}>
        <Logo className="mb-8 text-sidebar-accent-foreground" />
        {nav}
        <button onClick={async () => { await supabase.auth.signOut(); navigate({ to: "/" }); }} className="mt-auto flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-sidebar-foreground/75 hover:bg-sidebar-accent">
          <LogOut className="size-4" /> Log out
        </button>
      </aside>
      {open && <div className="fixed inset-0 z-30 bg-navy/40 lg:hidden" onClick={() => setOpen(false)} />}
      <div className="flex items-center gap-3 border-b bg-card px-4 py-3 lg:hidden print:hidden">
        <button onClick={() => setOpen(true)} aria-label="Open menu"><Menu /></button>
        <Logo />
      </div>
      <main className="mx-auto max-w-7xl p-4 md:p-8"><Outlet /></main>
    </div>
  );
}
