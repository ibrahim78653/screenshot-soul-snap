import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Set a new password — TravelMate AI" },
      { name: "description", content: "Choose a new password for your TravelMate AI account." },
      { property: "og:title", content: "Set a new password — TravelMate AI" },
      { property: "og:description", content: "Reset your TravelMate AI password." },
    ],
  }),
  component: Reset,
});

function Reset() {
  const [pw, setPw] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pw.length < 8) return toast.error("At least 8 characters");
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Password updated");
    navigate({ to: "/dashboard" });
  }
  return (
    <div className="flex min-h-screen flex-col p-8">
      <Logo />
      <form onSubmit={submit} className="m-auto w-full max-w-sm space-y-4">
        <h1 className="text-3xl font-bold">Set a new password</h1>
        <Input type="password" placeholder="New password" value={pw} onChange={(e) => setPw(e.target.value)} />
        <Button variant="hero" className="w-full" disabled={loading}>Update password</Button>
      </form>
    </div>
  );
}
