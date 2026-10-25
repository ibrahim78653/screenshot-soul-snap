import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles, Route as RouteIcon, Wallet, Heart, MapPin, User, Users, ArrowRight, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { DESTINATIONS } from "@/lib/travel-data";
import hero from "@/assets/hero.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TravelMate AI — Your Next Adventure, Planned by AI" },
      { name: "description", content: "Create personalized day-by-day travel itineraries in seconds, with budgets and maps." },
      { property: "og:title", content: "TravelMate AI — Your Next Adventure, Planned by AI" },
      { property: "og:description", content: "Personalized AI itineraries, budget tracking and route maps for every kind of trip." },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  { icon: Sparkles, title: "AI planning", text: "Day-by-day plans shaped by your interests, pace and budget." },
  { icon: RouteIcon, title: "Smart routing", text: "Nearby stops grouped together and mapped for every day." },
  { icon: Wallet, title: "Budget tracking", text: "Estimated costs by category, plus your real spending." },
  { icon: Heart, title: "Made for you", text: "Dietary, accessibility and style preferences built in." },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="absolute inset-x-0 top-0 z-20">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 text-navy-foreground">
          <Logo />
          <div className="hidden gap-8 text-sm font-medium md:flex">
            <a href="#features" className="opacity-90 hover:opacity-100">Features</a>
            <a href="#how" className="opacity-90 hover:opacity-100">How it works</a>
            <a href="#destinations" className="opacity-90 hover:opacity-100">Destinations</a>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/auth" className="hidden px-3 text-sm font-medium sm:block">Sign in</Link>
            <Button asChild variant="glass" size="sm" className="h-9 px-4"><Link to="/auth" search={{ mode: "signup" }}>Get started</Link></Button>
          </div>
        </nav>
      </header>

      <section className="relative isolate min-h-[92vh] overflow-hidden">
        <img src={hero} alt="Coastal road along turquoise bay at sunset" width={1600} height={1008} className="absolute inset-0 -z-10 size-full object-cover" />
        <div className="absolute inset-0 -z-10 bg-gradient-hero" />
        <div className="mx-auto flex min-h-[92vh] max-w-7xl flex-col justify-end px-6 pb-20 pt-32 text-navy-foreground">
          <span className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-card/30 bg-card/10 px-3 py-1 text-xs backdrop-blur">
            <Sparkles className="size-3.5" /> AI-powered trip planning
          </span>
          <h1 className="max-w-3xl text-5xl font-bold leading-[1.02] md:text-7xl">Your Next Adventure, Planned by AI.</h1>
          <p className="mt-5 max-w-xl text-lg opacity-90">Tell us where, when and what you love. Get a personalized day-by-day itinerary with budgets and maps in seconds.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild variant="hero" size="lg"><Link to="/trips/new">Plan my trip <ArrowRight /></Link></Button>
            <Button asChild variant="glass" size="lg"><a href="#sample">See a sample</a></Button>
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-7xl px-6 py-24">
        <h2 className="max-w-xl text-4xl font-bold">Everything a great trip needs, in one place</h2>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="card-lift rounded-2xl border bg-card p-6 shadow-soft">
              <f.icon className="size-6 text-primary" />
              <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="how" className="bg-navy py-24 text-navy-foreground">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="text-4xl font-bold">Three steps to takeoff</h2>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {[["Tell us your trip", "Destination, dates, travelers and budget."], ["Pick your vibe", "Interests, pace, stays and how you get around."], ["Get your plan", "Edit, regenerate days and track spending."]].map(([t, d], i) => (
              <div key={t} className="border-t border-card/20 pt-6">
                <span className="font-display text-5xl text-primary-glow">0{i + 1}</span>
                <h3 className="mt-3 text-xl font-semibold">{t}</h3>
                <p className="mt-2 opacity-75">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="destinations" className="mx-auto max-w-7xl px-6 py-24">
        <h2 className="text-4xl font-bold">Where to next?</h2>
        <p className="mt-2 text-muted-foreground">Featured destinations to inspire your plan.</p>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {DESTINATIONS.map((d) => (
            <Link key={d.name} to="/trips/new" search={{ destination: d.name }} className="card-lift group relative aspect-[4/5] overflow-hidden rounded-2xl">
              <img src={d.image} alt={d.name} loading="lazy" width={800} height={1008} className="size-full object-cover transition-transform duration-500 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-hero" />
              <div className="absolute inset-x-0 bottom-0 p-5 text-navy-foreground">
                <span className="rounded-full bg-card/20 px-2 py-0.5 text-xs backdrop-blur">{d.tag}</span>
                <h3 className="mt-2 text-xl font-semibold">{d.name}</h3>
                <p className="text-sm opacity-85">{d.blurb}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section id="sample" className="mx-auto grid max-w-7xl gap-12 px-6 pb-24 lg:grid-cols-2">
        <div>
          <h2 className="text-4xl font-bold">A plan you can actually use</h2>
          <p className="mt-3 text-muted-foreground">Every day comes with timed stops, estimated costs, food picks and how to get between places. Prices are always shown as estimates.</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[[User, "Solo", "Weekend food & sights on a budget"], [Heart, "Couples", "Scenic, romantic, relaxed pace"], [Users, "Groups", "Costs split for the whole crew"]].map(([I, t, d]: any) => (
              <div key={t} className="rounded-2xl bg-accent p-4">
                <I className="size-5 text-accent-foreground" />
                <p className="mt-2 font-semibold">{t}</p>
                <p className="text-sm text-muted-foreground">{d}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-3xl border bg-card p-6 shadow-soft">
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><Calendar className="size-4" /> Day 2 · Kyoto · Sample</div>
          <h3 className="mt-1 text-2xl font-semibold">Eastern Hills & Gion</h3>
          <ol className="mt-5 space-y-4">
            {[["08:00", "Kiyomizu-dera at opening", "≈ ¥500"], ["11:30", "Sannenzaka & Ninenzaka lanes", "Free"], ["13:00", "Yudofu lunch near Nanzen-ji", "≈ ¥3,000"], ["18:30", "Evening stroll in Gion", "Free"]].map(([t, n, c]) => (
              <li key={t} className="flex items-start gap-4">
                <span className="w-12 pt-0.5 text-sm font-semibold text-primary">{t}</span>
                <div className="flex-1 border-l-2 border-accent pl-4"><p className="font-medium">{n}</p><p className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="size-3" /> Estimated {c}</p></div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="bg-secondary py-20">
        <div className="mx-auto max-w-7xl px-6">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Sample testimonials (illustrative)</p>
          <div className="mt-6 grid gap-5 md:grid-cols-3">
            {["“Planned a 3-day Lisbon trip over coffee.”", "“Regenerating a single day is a lifesaver.”", "“Finally a budget we could all agree on.”"].map((q) => (
              <blockquote key={q} className="rounded-2xl bg-card p-6 font-display text-lg shadow-soft">{q}</blockquote>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-8 text-sm text-muted-foreground">
          <Logo className="text-foreground" />
          <div className="flex gap-6"><a href="#features">Features</a><a href="#">Privacy</a><a href="#">Terms</a><a href="mailto:hello@example.com">Contact</a></div>
          <p>© 2026 TravelMate AI</p>
        </div>
      </footer>
    </div>
  );
}
