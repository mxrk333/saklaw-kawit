"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Coordinates } from "@/types";

export interface UserLocation {
  coordinates: Coordinates;
  /** Horizontal accuracy radius in meters, as reported by the device. */
  accuracy: number;
}

export type TrackingStatus = "idle" | "locating" | "tracking" | "denied" | "unavailable";

interface TrackingState {
  status: TrackingStatus;
  location: UserLocation | null;
  error: string | null;
}

const IDLE: TrackingState = { status: "idle", location: null, error: null };

const MESSAGES = {
  denied: "Location permission was denied. Allow location for this site in your browser settings to see where you are.",
  unavailable: "We couldn't get your location. Check that location services are on and try again.",
  unsupported: "This browser doesn't support location.",
} as const;

/** Live device location via watchPosition. Nothing is requested until `start` is called. */
export function useUserLocation() {
  const [state, setState] = useState<TrackingState>(IDLE);
  const watchId = useRef<number | null>(null);

  const stop = useCallback(() => {
    if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
    watchId.current = null;
    setState(IDLE);
  }, []);

  const start = useCallback(() => {
    if (watchId.current !== null) return;
    if (!("geolocation" in navigator)) {
      setState({ status: "unavailable", location: null, error: MESSAGES.unsupported });
      return;
    }
    setState((current) => ({ ...current, status: "locating", error: null }));
    watchId.current = navigator.geolocation.watchPosition(
      (position) =>
        setState({
          status: "tracking",
          error: null,
          location: {
            coordinates: { lat: position.coords.latitude, lng: position.coords.longitude },
            accuracy: position.coords.accuracy,
          },
        }),
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          navigator.geolocation.clearWatch(watchId.current ?? 0);
          watchId.current = null;
          setState({ status: "denied", location: null, error: MESSAGES.denied });
          return;
        }
        // Timeouts and temporary loss of signal: keep the watch and the last known fix.
        setState((current) => ({ ...current, status: current.location ? "tracking" : "unavailable", error: MESSAGES.unavailable }));
      },
      { enableHighAccuracy: true, maximumAge: 5_000, timeout: 20_000 },
    );
  }, []);

  useEffect(
    () => () => {
      if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
    },
    [],
  );

  return { ...state, start, stop };
}
