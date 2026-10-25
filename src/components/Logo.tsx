import { Link } from "@tanstack/react-router";
import { Compass } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <Link to="/" className={cn("flex items-center gap-2 font-display text-lg font-bold", className)}>
      <span className="grid size-8 place-items-center rounded-xl bg-gradient-primary text-primary-foreground">
        <Compass className="size-4" />
      </span>
      TravelMate<span className="text-primary">AI</span>
    </Link>
  );
}
