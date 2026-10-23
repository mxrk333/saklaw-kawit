import { z } from "zod";
import type { Coordinates } from "@/types";
import type { TravelMode } from "./config";

const osrmResponse = z.object({
  code: z.string(),
  routes: z
    .array(
      z.object({
        distance: z.number(),
        duration: z.number(),
        geometry: z.object({
          type: z.literal("LineString"),
          coordinates: z.array(z.tuple([z.number(), z.number()])),
        }),
      }),
    )
    .default([]),
});

export interface RouteResult {
  /** [lng, lat] pairs. */
  line: [number, number][];
  distanceMeters: number;
  durationSeconds: number;
  mode: TravelMode;
}

export class RoutingError extends Error {}

/** Fetches a route from an OSRM-compatible server. Values come straight from the server. */
export async function fetchRoute(
  baseUrl: string,
  mode: TravelMode,
  origin: Coordinates,
  destination: Coordinates,
  signal?: AbortSignal,
): Promise<RouteResult> {
  const coords = `${origin.lng},${origin.lat};${destination.lng},${destination.lat}`;
  const url = `${baseUrl}/route/v1/driving/${coords}?overview=full&geometries=geojson`;

  let response: Response;
  try {
    response = await fetch(url, { signal });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new RoutingError("Could not reach the routing service.");
  }
  if (!response.ok) throw new RoutingError(`Routing service responded with ${response.status}.`);

  const parsed = osrmResponse.safeParse(await response.json());
  if (!parsed.success || parsed.data.code !== "Ok" || parsed.data.routes.length === 0) {
    throw new RoutingError("No route was found between these points.");
  }
  const route = parsed.data.routes[0];
  return {
    line: route.geometry.coordinates,
    distanceMeters: route.distance,
    durationSeconds: route.duration,
    mode,
  };
}
