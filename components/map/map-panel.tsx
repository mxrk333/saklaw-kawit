"use client";

import { Box, Crosshair, Home } from "lucide-react";
import dynamic from "next/dynamic";
import { useMemo, useRef } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { getMapConfig } from "@/lib/map/config";
import { TYPE_COLORS } from "@/lib/map/geojson";
import type { Coordinates } from "@/types";
import type { MapViewHandle, MapViewProps } from "./map-view";

// MapLibre needs WebGL and `window`, so it is never rendered on the server.
const MapView = dynamic(() => import("./map-view").then((m) => m.MapView), {
  ssr: false,
  loading: () => <Skeleton className="size-full rounded-none" />,
});

type MapPanelProps = Omit<MapViewProps, "ref" | "config"> & {
  /** Where the recenter control flies to; falls back to the Kawit default view. */
  recenterTarget: Coordinates | null;
};

const LEGEND = [
  { label: "Places", color: TYPE_COLORS.business },
  { label: "Updates", color: TYPE_COLORS.announcement },
  { label: "Events", color: TYPE_COLORS.event },
] as const;

const controlClass =
  "grid size-9 place-items-center rounded-lg border bg-card text-foreground shadow-sm hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none";

export function MapPanel({ recenterTarget, ...viewProps }: MapPanelProps) {
  const mapRef = useRef<MapViewHandle>(null);
  const config = useMemo(() => getMapConfig(), []);

  return (
    <div className="relative size-full">
      <MapView ref={mapRef} config={config} {...viewProps} />

      <div className="absolute top-3 left-3 flex flex-col gap-2">
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
        <button type="button" className={controlClass} aria-label="Toggle 3D tilt" title="Toggle 3D tilt" onClick={() => mapRef.current?.toggleTilt()}>
          <Box className="size-4" aria-hidden />
        </button>
      </div>

      {viewProps.locations.length === 0 && (
        <p
          role="status"
          className="absolute top-3 left-1/2 max-w-[80%] -translate-x-1/2 rounded-lg border bg-card/95 px-3 py-1.5 text-center text-xs text-muted-foreground shadow-sm"
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
