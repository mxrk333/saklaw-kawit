"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { MapOrigin } from "@/components/map/map-view";
import { getMapConfig, type TravelMode } from "@/lib/map/config";
import { RoutingError, fetchRoute, type RouteResult } from "@/lib/map/routing";
import type { Coordinates } from "@/types";

export type DirectionsPhase = "idle" | "locating" | "routing" | "ready" | "error";

export interface DirectionsState {
  mode: TravelMode;
  origin: MapOrigin | null;
  route: RouteResult | null;
  phase: DirectionsPhase;
  message: string | null;
  pickingOrigin: boolean;
  /** Modes for which in-app routing is configured. */
  availableModes: readonly TravelMode[];
  setMode: (mode: TravelMode) => void;
  locateMe: () => void;
  startPickingOrigin: () => void;
  pickOrigin: (coordinates: Coordinates) => void;
  reset: () => void;
}

interface RouteOutcome {
  /** Identifies the origin/destination/mode the outcome belongs to. */
  signature: string;
  route: RouteResult | null;
  error: string | null;
}

const GEO_ERRORS: Record<number, string> = {
  1: "Location permission was denied. Choose a starting point on the map, or open your maps app.",
  2: "Your location is unavailable right now. Choose a starting point on the map instead.",
  3: "Finding your location timed out. Try again or choose a starting point on the map.",
};

const key = (c: Coordinates) => `${c.lat},${c.lng}`;

/**
 * Directions to `destination`. Distance and duration are only ever taken from a
 * routing server response — nothing is estimated locally. Everything that
 * depends on the destination is derived from signatures, so a new destination
 * automatically discards the previous route.
 */
export function useDirections(destination: Coordinates | null): DirectionsState {
  const config = useMemo(() => getMapConfig(), []);
  const availableModes = useMemo(
    () => (["driving", "walking"] as const).filter((m) => Boolean(config.routingUrls[m])),
    [config],
  );

  const [requestedMode, setMode] = useState<TravelMode>("driving");
  const [origin, setOrigin] = useState<MapOrigin | null>(null);
  const [outcome, setOutcome] = useState<RouteOutcome | null>(null);
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [pickingFor, setPickingFor] = useState<string | null>(null);

  const destinationKey = destination ? key(destination) : null;
  const mode: TravelMode = availableModes.includes(requestedMode) ? requestedMode : (availableModes[0] ?? requestedMode);
  const baseUrl = config.routingUrls[mode];
  const wantsRoute = Boolean(origin && destination && baseUrl);
  const signature = origin && destinationKey ? `${destinationKey}|${key(origin.coordinates)}|${mode}` : null;

  useEffect(() => {
    if (!origin || !destination || !baseUrl || !signature) return;
    const controller = new AbortController();
    fetchRoute(baseUrl, mode, origin.coordinates, destination, controller.signal)
      .then((route) => setOutcome({ signature, route, error: null }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setOutcome({
          signature,
          route: null,
          error: error instanceof RoutingError ? error.message : "Routing failed unexpectedly.",
        });
      });
    return () => controller.abort();
    // `destination` is represented by its key inside `signature`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature, baseUrl, mode]);

  const current = outcome && outcome.signature === signature ? outcome : null;
  const pickingOrigin = pickingFor !== null && pickingFor === destinationKey;

  let phase: DirectionsPhase = "idle";
  let message: string | null = null;
  if (locating) phase = "locating";
  else if (geoError) {
    phase = "error";
    message = geoError;
  } else if (wantsRoute && !current) phase = "routing";
  else if (current?.error) {
    phase = "error";
    message = current.error;
  } else if (current?.route) phase = "ready";
  if (!message && pickingOrigin) message = "Tap the map to set your starting point.";

  const pickOrigin = useCallback((coordinates: Coordinates) => {
    setOrigin({ coordinates, kind: "manual" });
    setGeoError(null);
    setPickingFor(null);
  }, []);

  const locateMe = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setGeoError("This browser does not support location. Choose a starting point on the map instead.");
      return;
    }
    setLocating(true);
    setGeoError(null);
    setPickingFor(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setOrigin({ coordinates: { lat: position.coords.latitude, lng: position.coords.longitude }, kind: "device" });
        setLocating(false);
      },
      (error) => {
        setLocating(false);
        setGeoError(GEO_ERRORS[error.code] ?? "Could not get your location.");
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 30_000 },
    );
  }, []);

  const startPickingOrigin = useCallback(() => {
    setGeoError(null);
    setPickingFor(destinationKey);
  }, [destinationKey]);

  const reset = useCallback(() => {
    setOrigin(null);
    setOutcome(null);
    setLocating(false);
    setGeoError(null);
    setPickingFor(null);
  }, []);

  return {
    mode,
    origin,
    route: current?.route ?? null,
    phase,
    message,
    pickingOrigin,
    availableModes,
    setMode,
    locateMe,
    startPickingOrigin,
    pickOrigin,
    reset,
  };
}
