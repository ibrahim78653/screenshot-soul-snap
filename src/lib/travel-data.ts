import kyoto from "@/assets/kyoto.jpg";
import santorini from "@/assets/santorini.jpg";
import marrakech from "@/assets/marrakech.jpg";
import hero from "@/assets/hero.jpg";

export const DESTINATIONS = [
  { name: "Kyoto, Japan", image: kyoto, tag: "Culture", days: "4–6 days", cost: "Moderate", blurb: "Temples, gardens and kaiseki dining." },
  { name: "Santorini, Greece", image: santorini, tag: "Romantic", days: "3–5 days", cost: "Premium", blurb: "Caldera sunsets and whitewashed villages." },
  { name: "Marrakech, Morocco", image: marrakech, tag: "Food", days: "3–4 days", cost: "Budget", blurb: "Souks, riads and spice-scented streets." },
  { name: "Amalfi Coast, Italy", image: hero, tag: "Nature", days: "4–7 days", cost: "Premium", blurb: "Cliffside roads and turquoise coves." },
];

export function imageFor(destination: string) {
  const d = destination.toLowerCase();
  const hit = DESTINATIONS.find((x) => d.includes(x.name.split(",")[0].toLowerCase()));
  if (hit) return hit.image;
  const pool = DESTINATIONS.map((x) => x.image);
  let h = 0;
  for (const c of d) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return pool[h % pool.length];
}

export const INTERESTS = [
  "Adventure", "Nature", "Culture & history", "Food & restaurants", "Shopping", "Beaches",
  "Nightlife", "Photography", "Relaxation", "Romantic", "Family-friendly", "Religious & heritage",
];
export const TRAVELER_TYPES = [
  { value: "solo", label: "Solo" },
  { value: "couple", label: "Couple" },
  { value: "family", label: "Family" },
  { value: "friends", label: "Group of friends" },
];
export const BUDGET_TIERS = ["budget", "moderate", "premium", "luxury"];
export const CURRENCIES = ["USD", "EUR", "GBP", "INR", "JPY", "AUD", "CAD"];
export const TRANSPORT = ["Walking", "Public transport", "Rental car", "Taxi", "Mixed"];
export const ACCOMMODATION = ["Hostel", "Budget hotel", "Boutique hotel", "Resort", "Luxury stay"];
export const PACES = ["relaxed", "balanced", "packed"];

export function money(n: number, currency: string) {
  try {
    return new Intl.NumberFormat("en", { style: "currency", currency, maximumFractionDigits: 0 }).format(n || 0);
  } catch {
    return `${Math.round(n || 0)} ${currency}`;
  }
}

export function fmtDate(d: string) {
  return new Date(d + "T00:00:00Z").toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}
