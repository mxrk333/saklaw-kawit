import type { MapLocation } from "@/types";
import { haversineMeters } from "@/lib/utils/geo";

/** A place and an event this close together are the same spot (e.g. a venue and the event held there). */
const SAME_SPOT_METERS = 150;

/** The live event at the selected location's spot, or undefined when nothing is happening there now. */
export function findLiveNear(selected: MapLocation, locations: readonly MapLocation[]): MapLocation | undefined {
  if (selected.live) return selected;
  if (selected.precision !== "exact") return undefined;
  return locations.find(
    (l) => l.live && l.precision === "exact" && haversineMeters(l.coordinates, selected.coordinates) <= SAME_SPOT_METERS,
  );
}
