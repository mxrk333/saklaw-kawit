import type { Coordinates } from "@/types";

export const KAWIT_CENTER: Coordinates = { lat: 14.445, lng: 120.905 };

export interface ViewState {
  center: Coordinates;
  zoom: number;
  pitch: number;
  bearing: number;
}

export const DEFAULT_VIEW: ViewState = {
  center: KAWIT_CENTER,
  zoom: 14.2,
  pitch: 55,
  bearing: -12,
};

export const FOCUS_ZOOM = 16.5;

export type TravelMode = "driving" | "walking";

export interface MapConfig {
  styleUrl: string;
  /** Raster-DEM TileJSON URL. Terrain is disabled when undefined. */
  terrainUrl?: string;
  /** Routing is only offered for modes with a configured OSRM-compatible base URL. */
  routingUrls: Partial<Record<TravelMode, string>>;
}

const OPEN_STYLE = "https://tiles.openfreemap.org/styles/liberty";

function trimSlash(url: string | undefined): string | undefined {
  const value = url?.trim();
  return value ? value.replace(/\/+$/, "") : undefined;
}

/**
 * Resolution order for the style: explicit style URL, then MapTiler (with
 * terrain) when a key is present, then a keyless open style with 3D buildings.
 * NEXT_PUBLIC_* values are bundled into client code — only put public,
 * domain-restricted keys here, never secrets.
 */
export function getMapConfig(): MapConfig {
  const explicitStyle = process.env.NEXT_PUBLIC_MAP_STYLE_URL?.trim();
  const maptilerKey = process.env.NEXT_PUBLIC_MAPTILER_KEY?.trim();
  const explicitTerrain = process.env.NEXT_PUBLIC_TERRAIN_TILES_URL?.trim();

  const styleUrl =
    explicitStyle ||
    (maptilerKey ? `https://api.maptiler.com/maps/streets-v2/style.json?key=${maptilerKey}` : OPEN_STYLE);
  const terrainUrl =
    explicitTerrain ||
    (maptilerKey ? `https://api.maptiler.com/tiles/terrain-rgb-v2/tiles.json?key=${maptilerKey}` : undefined);

  return {
    styleUrl,
    terrainUrl,
    routingUrls: {
      driving: trimSlash(process.env.NEXT_PUBLIC_ROUTING_URL_DRIVING),
      walking: trimSlash(process.env.NEXT_PUBLIC_ROUTING_URL_WALKING),
    },
  };
}
