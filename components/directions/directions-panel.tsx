"use client";

import { Car, ExternalLink, Footprints, LoaderCircle, LocateFixed, MapPinned, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DirectionsState } from "@/hooks/use-directions";
import { appleDirectionsUrl, googleDirectionsUrl } from "@/lib/map/external-directions";
import type { TravelMode } from "@/lib/map/config";
import { formatDistance, formatDuration } from "@/lib/utils/format";
import { cn } from "@/lib/utils";
import type { Coordinates } from "@/types";

const MODES: ReadonlyArray<{ mode: TravelMode; label: string; Icon: typeof Car }> = [
  { mode: "driving", label: "Drive", Icon: Car },
  { mode: "walking", label: "Walk", Icon: Footprints },
];

interface DirectionsPanelProps {
  destination: Coordinates;
  directions: DirectionsState;
  onClose: () => void;
}

export function DirectionsPanel({ destination, directions, onClose }: DirectionsPanelProps) {
  const { mode, origin, route, phase, message, pickingOrigin, availableModes } = directions;
  const routingConfigured = availableModes.length > 0;

  return (
    <section aria-label="Directions" className="space-y-3 rounded-xl border bg-muted/40 p-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Directions</h3>
        <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close directions">
          <X />
        </Button>
      </div>

      <div className="flex gap-1.5" role="group" aria-label="Travel mode">
        {MODES.map(({ mode: value, label, Icon }) => {
          const unavailable = routingConfigured && !availableModes.includes(value);
          return (
            <button
              key={value}
              type="button"
              disabled={unavailable}
              aria-pressed={mode === value}
              title={unavailable ? "In-app routing is not configured for this mode" : undefined}
              onClick={() => directions.setMode(value)}
              className={cn(
                "inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg border text-xs font-medium disabled:opacity-40",
                mode === value ? "border-primary bg-primary/10 text-primary" : "bg-card hover:bg-muted",
              )}
            >
              <Icon className="size-3.5" aria-hidden />
              {label}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-1.5">
        <Button variant="outline" size="sm" onClick={directions.locateMe} disabled={phase === "locating"}>
          {phase === "locating" ? <LoaderCircle className="animate-spin" /> : <LocateFixed />}
          Use my location
        </Button>
        <Button
          variant={pickingOrigin ? "default" : "outline"}
          size="sm"
          onClick={directions.startPickingOrigin}
          aria-pressed={pickingOrigin}
        >
          <MapPinned />
          {pickingOrigin ? "Tap the map…" : "Choose start on map"}
        </Button>
      </div>

      <div aria-live="polite" className="min-h-5 text-sm">
        {phase === "routing" && (
          <p className="flex items-center gap-1.5 text-muted-foreground">
            <LoaderCircle className="size-3.5 animate-spin" aria-hidden /> Finding route…
          </p>
        )}
        {phase === "ready" && route && (
          <p className="font-medium">
            {formatDistance(route.distanceMeters)} · {formatDuration(route.durationSeconds)}{" "}
            <span className="font-normal text-muted-foreground">{route.mode === "walking" ? "walking" : "driving"}</span>
          </p>
        )}
        {message && phase !== "routing" && (
          <p className={phase === "error" ? "text-destructive" : "text-muted-foreground"}>{message}</p>
        )}
        {origin && !routingConfigured && (
          <p className="text-xs text-muted-foreground">
            Route preview isn&apos;t set up. Your maps app will start from the point you chose.
          </p>
        )}
        {!origin && !message && phase === "idle" && (
          <p className="text-xs text-muted-foreground">
            {routingConfigured
              ? "Pick a starting point to see the route and travel time on the map."
              : "In-app routes aren't set up yet. Open your maps app for turn-by-turn directions."}
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        <a
          href={googleDirectionsUrl(destination, mode, origin?.coordinates)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-7 items-center gap-1 rounded-lg border bg-card px-2.5 text-[0.8rem] font-medium hover:bg-muted"
        >
          Google Maps <ExternalLink className="size-3" aria-hidden />
        </a>
        <a
          href={appleDirectionsUrl(destination, mode, origin?.coordinates)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-7 items-center gap-1 rounded-lg border bg-card px-2.5 text-[0.8rem] font-medium hover:bg-muted"
        >
          Apple Maps <ExternalLink className="size-3" aria-hidden />
        </a>
      </div>
    </section>
  );
}
