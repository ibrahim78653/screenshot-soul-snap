import { useEffect, useRef } from "react";
import L from "leaflet";

export type Pin = { lat: number; lng: number; label: string; n: number };

export default function TripMap({ pins }: { pins: Pin[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const layer = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!ref.current || map.current) return;
    map.current = L.map(ref.current, { scrollWheelZoom: false }).setView([20, 0], 2);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "© OpenStreetMap contributors", maxZoom: 19 }).addTo(map.current);
    layer.current = L.layerGroup().addTo(map.current);
    return () => { map.current?.remove(); map.current = null; };
  }, []);

  useEffect(() => {
    const m = map.current, g = layer.current;
    if (!m || !g) return;
    g.clearLayers();
    if (!pins.length) return;
    const pts = pins.map((p) => [p.lat, p.lng] as [number, number]);
    pins.forEach((p) => {
      L.marker([p.lat, p.lng], { icon: L.divIcon({ className: "", html: `<div class="map-pin">${p.n}</div>`, iconSize: [28, 28], iconAnchor: [14, 14] }) }).bindPopup(p.label).addTo(g);
    });
    if (pts.length > 1) L.polyline(pts, { color: "oklch(0.62 0.12 190)", weight: 3, dashArray: "6 6" }).addTo(g);
    m.fitBounds(L.latLngBounds(pts).pad(0.3), { maxZoom: 14 });
  }, [pins]);

  return <div ref={ref} className="size-full" />;
}
