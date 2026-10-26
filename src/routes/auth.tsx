import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import hero from "@/assets/santorini.jpg";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>) => (s["mode"] === "signup" || s["mode"] === "forgot" ? { mode: s["mode"] } : {}) as { mode?: "signup" | "forgot" },
  head: () => ({
    meta: [
      { title: "Sign in — TravelMate AI" },
      { name: "description", content: "Sign in or create your TravelMate AI account." },
      { property: "og:title", content: "Sign in — TravelMate AI" },
      { property: "og:description", content: "Access your personalized trip plans." },
    ],
  }),
  component: AuthPage,
});

const schema = z.object({ email: z.string().trim().email("Enter a valid email"), password: z.string().min(8, "At least 8 characters") });

function AuthPage() {
  const { mode: initial } = Route.useSearch();
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">(initial ?? "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => data.session && navigate({ to: "/dashboard" }));
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
        if (error) throw error;
        toast.success("Check your email for a reset link.");
        return;
      }
      const parsed = schema.safeParse({ email, password });
      if (!parsed.success) throw new Error(parsed.error.issues[0]?.message);
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/dashboard`, data: { full_name: name } } });
        if (error) throw error;
        if (!data.session) toast.success("Check your email to confirm your account.");
        else navigate({ to: "/dashboard" });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/dashboard" });
      }
    } catch (err: any) {
      toast.error(err.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function google() {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/auth" });
    if (r.error) return toast.error(r.error.message ?? "Google sign-in failed");
    if (r.redirected) return;
    navigate({ to: "/dashboard" });
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col p-8">
        <Logo />
        <div className="m-auto w-full max-w-sm">
          <h1 className="text-3xl font-bold">{mode === "signup" ? "Create your account" : mode === "forgot" ? "Reset password" : "Welcome back"}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{mode === "forgot" ? "We'll email you a reset link." : "Plan smarter trips with AI."}</p>
          {mode !== "forgot" && (
            <>
              <Button variant="outline" className="mt-6 w-full" onClick={google}>Continue with Google</Button>
              <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground"><div className="h-px flex-1 bg-border" />or<div className="h-px flex-1 bg-border" /></div>
            </>
          )}
          <form onSubmit={submit} className="space-y-4">
            {mode === "signup" && (<div className="space-y-1.5"><Label htmlFor="name">Name</Label><Input id="name" value={name} onChange={(e) => setName(e.target.value)} /></div>)}
            <div className="space-y-1.5"><Label htmlFor="email">Email</Label><Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
            {mode !== "forgot" && (<div className="space-y-1.5"><Label htmlFor="pw">Password</Label><Input id="pw" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} /></div>)}
            <Button type="submit" variant="hero" className="w-full" disabled={loading}>{loading ? "Please wait…" : mode === "signup" ? "Create account" : mode === "forgot" ? "Send reset link" : "Sign in"}</Button>
          </form>
          <div className="mt-5 flex justify-between text-sm">
            <button className="text-primary" onClick={() => setMode(mode === "signup" ? "signin" : "signup")}>{mode === "signup" ? "Have an account? Sign in" : "Create an account"}</button>
            {mode === "signin" && <button className="text-muted-foreground" onClick={() => setMode("forgot")}>Forgot password?</button>}
            {mode === "forgot" && <button className="text-muted-foreground" onClick={() => setMode("signin")}>Back</button>}
          </div>
        </div>
      </div>
      <div className="relative hidden lg:block">
        <img src={hero} alt="Santorini at sunset" className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-0 bg-gradient-hero" />
        <p className="absolute bottom-10 left-10 max-w-sm font-display text-3xl text-navy-foreground">"The world is a book, and those who do not travel read only one page."</p>
      </div>
    </div>
  );
}
