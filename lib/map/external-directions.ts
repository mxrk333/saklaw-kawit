import type { Coordinates } from "@/types";
import type { TravelMode } from "./config";

const point = (c: Coordinates) => `${c.lat},${c.lng}`;

export function googleDirectionsUrl(destination: Coordinates, mode: TravelMode, origin?: Coordinates): string {
  const params = new URLSearchParams({
    api: "1",
    destination: point(destination),
    travelmode: mode,
  });
  if (origin) params.set("origin", point(origin));
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

export function appleDirectionsUrl(destination: Coordinates, mode: TravelMode, origin?: Coordinates): string {
  const params = new URLSearchParams({
    daddr: point(destination),
    dirflg: mode === "walking" ? "w" : "d",
  });
  if (origin) params.set("saddr", point(origin));
  return `https://maps.apple.com/?${params.toString()}`;
}
