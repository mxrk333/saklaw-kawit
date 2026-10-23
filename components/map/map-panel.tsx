"use client";

import { Box, Compass, Crosshair, Home, Layers, LoaderCircle, LocateFixed, LocateOff, Minus, Plus } from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { useUserLocation } from "@/hooks/use-user-location";
import { getMapConfig, type Basemap } from "@/lib/map/config";
import { TYPE_COLORS } from "@/lib/map/geojson";
import { isInsideKawit } from "@/lib/map/kawit";
import { cn } from "@/lib/utils";
import type { Coordinates } from "@/types";
import type { MapViewHandle, MapViewProps } from "./map-view";

// MapLibre needs WebGL and `window`, so it is never rendered on the server.
const MapView = dynamic(() => import("./map-view").then((m) => m.MapView), {
  ssr: false,
  loading: () => <Skeleton className="size-full rounded-none" />,
});

type MapPanelProps = Omit<MapViewProps, "ref" | "config" | "basemap" | "userLocation" | "follow" | "onFollowEnd"> & {
  /** Where the recenter control flies to; falls back to the Kawit default view. */
  recenterTarget: Coordinates | null;
  /** Say so when there are results but none can be pinned (not when there are no results at all). */
  explainMissingLocations?: boolean;
};

const LEGEND = [
  { label: "Places", color: TYPE_COLORS.business },
  { label: "Updates", color: TYPE_COLORS.announcement },
  { label: "Events", color: TYPE_COLORS.event },
] as const;

const controlClass =
  "grid size-11 place-items-center lg:size-9 rounded-lg border bg-card text-foreground shadow-sm hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none";

export function MapPanel({ recenterTarget, explainMissingLocations = false, ...viewProps }: MapPanelProps) {
  const { topPadding } = viewProps;
  const mapRef = useRef<MapViewHandle>(null);
  const config = useMemo(() => getMapConfig(), []);

  const [basemap, setBasemap] = useState<Basemap>(config.defaultBasemap);
  const user = useUserLocation();
  const [follow, setFollow] = useState(false);
  const insideKawit = user.location ? isInsideKawit(user.location.coordinates) : null;
  const warnedOutside = useRef(false);

  useEffect(() => {
    if (user.error) toast.error(user.error);
  }, [user.error]);

  useEffect(() => {
    if (insideKawit === false && !warnedOutside.current) {
      warnedOutside.current = true;
      toast.info("You appear to be outside Kawit, so the map won't follow you. Directions still work from your location.");
    }
  }, [insideKawit]);

  /** Off -> track and follow. Tracking but panned away -> follow again. Following -> stop. */
  const onLocateClick = () => {
    if (user.status === "idle" || user.status === "denied" || user.status === "unavailable") {
      user.start();
      setFollow(true);
    } else if (!follow) {
      setFollow(true);
    } else {
      user.stop();
      setFollow(false);
    }
  };

  const tracking = user.status === "tracking";
  const locateLabel =
    user.status === "locating"
      ? "Finding your location"
      : !tracking
        ? "Show my location"
        : follow
          ? "Stop tracking my location"
          : "Follow my location";

  return (
    <div className="relative size-full" style={{ "--map-top-inset": `${topPadding}px` } as CSSProperties}>
      <MapView
        ref={mapRef}
        config={config}
        basemap={basemap}
        {...viewProps}
        userLocation={user.location}
        follow={follow && insideKawit === true}
        onFollowEnd={() => setFollow(false)}
      />

      <div className="absolute left-3 flex flex-col gap-2" style={{ top: topPadding + 12 }}>
        <button type="button" className={controlClass} aria-label="Return to default Kawit view" title="Kawit view" onClick={() => mapRef.current?.resetView()}>
          <Home className="size-4" aria-hidden />
        </button>
        <button
          type="button"
          className={controlClass}
          aria-label="Recenter on selection or your starting point"
          title="Recenter"
          onClick={() => (recenterTarget ? mapRef.current?.flyToCoordinates(recenterTarget) : mapRef.current?.resetView())}
        >
          <Crosshair className="size-4" aria-hidden />
        </button>
        <button
          type="button"
          className={cn(controlClass, tracking && "border-blue-600 text-blue-600", tracking && follow && "bg-blue-600 text-white")}
          aria-label={locateLabel}
          aria-pressed={tracking && follow}
          title={locateLabel}
          onClick={onLocateClick}
        >
          {user.status === "locating" ? (
            <LoaderCircle className="size-4 animate-spin" aria-hidden />
          ) : tracking || user.status === "idle" ? (
            <LocateFixed className="size-4" aria-hidden />
          ) : (
            <LocateOff className="size-4" aria-hidden />
          )}
        </button>
        <button type="button" className={controlClass} aria-label="Toggle 3D tilt" title="Toggle 3D tilt" onClick={() => mapRef.current?.toggleTilt()}>
          <Box className="size-4" aria-hidden />
        </button>
        {config.satellite && (
          <button
            type="button"
            className={cn(controlClass, basemap === "satellite" && "border-primary text-primary")}
            aria-label={basemap === "satellite" ? "Switch to map view" : "Switch to satellite view"}
            aria-pressed={basemap === "satellite"}
            title={basemap === "satellite" ? "Switch to map view" : "Switch to satellite view"}
            onClick={() => setBasemap((current) => (current === "satellite" ? "map" : "satellite"))}
          >
            <Layers className="size-4" aria-hidden />
          </button>
        )}
      </div>

      <div className="absolute right-3 flex flex-col gap-2" style={{ top: topPadding + 12 }}>
        <div className="flex flex-col overflow-hidden rounded-lg border bg-card shadow-sm">
          <button type="button" className="grid size-11 place-items-center hover:bg-muted lg:size-9" aria-label="Zoom in" onClick={() => mapRef.current?.zoomIn()}>
            <Plus className="size-4" aria-hidden />
          </button>
          <button type="button" className="grid size-11 place-items-center border-t hover:bg-muted lg:size-9" aria-label="Zoom out" onClick={() => mapRef.current?.zoomOut()}>
            <Minus className="size-4" aria-hidden />
          </button>
        </div>
        <button type="button" className={controlClass} aria-label="Point north" title="Point north" onClick={() => mapRef.current?.resetNorth()}>
          <Compass className="size-4" aria-hidden />
        </button>
      </div>

      {explainMissingLocations && viewProps.locations.length === 0 && (
        <p
          role="status"
          className="absolute left-1/2 max-w-[80%] -translate-x-1/2 rounded-lg border bg-card/95 px-3 py-1.5 text-center text-xs text-muted-foreground shadow-sm"
          style={{ top: topPadding + 12 }}
        >
          None of these results have a verified map location yet.
        </p>
      )}

      <ul
        aria-label="Map legend"
        className="pointer-events-none absolute bottom-6 left-3 hidden gap-3 rounded-lg border bg-card/90 px-2.5 py-1.5 text-xs shadow-sm sm:flex"
      >
        {LEGEND.map((item) => (
          <li key={item.label} className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full" style={{ backgroundColor: item.color }} aria-hidden />
            {item.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
