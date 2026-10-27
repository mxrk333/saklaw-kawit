import type { RasterDEMSourceSpecification } from "maplibre-gl";
import type { Coordinates } from "@/types";

export const KAWIT_CENTER: Coordinates = { lat: 14.445, lng: 120.905 };

export interface ViewState {
  center: Coordinates;
  zoom: number;
  pitch: number;
  bearing: number;
}

/** Camera angle for the default (whole-of-Kawit) view. The extent comes from KAWIT_BOUNDS. */
export const DEFAULT_VIEW: Pick<ViewState, "pitch" | "bearing"> = {
  pitch: 50,
  bearing: -8,
};

export const FOCUS_ZOOM = 16.5;
/** Close enough to see the people at a live event. */
export const LIVE_FOCUS_ZOOM = 19;

export type TravelMode = "driving" | "walking";

export interface TerrainConfig {
  source: RasterDEMSourceSpecification;
  /** Vertical exaggeration. Kawit is a flat coastal plain, so relief needs a boost to read. */
  exaggeration: number;
}

export type Basemap = "map" | "satellite";

export interface SatelliteConfig {
  /** XYZ raster tile URL templates. */
  tiles: string[];
  maxzoom: number;
  attribution: string;
}

export interface MapConfig {
  styleUrl: string;
  /** Aerial imagery for the Satellite basemap. Undefined hides the toggle. */
  satellite?: SatelliteConfig;
  defaultBasemap: Basemap;
  /** Elevation data for 3D terrain and hillshade. Undefined disables terrain. */
  terrain?: TerrainConfig;
  /** Routing is only offered for modes with a configured OSRM-compatible base URL. */
  routingUrls: Partial<Record<TravelMode, string>>;
}

const OPEN_STYLE = "https://tiles.openfreemap.org/styles/liberty";

/** Keyless public elevation tiles (Terrarium encoding) from "Terrain Tiles on AWS". */
const OPEN_TERRAIN: RasterDEMSourceSpecification = {
  type: "raster-dem",
  tiles: ["https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png"],
  encoding: "terrarium",
  tileSize: 256,
  maxzoom: 14,
  attribution: "Terrain Tiles on AWS (Mapzen, USGS, NASA and others)",
};

const DEFAULT_EXAGGERATION = 2;

/**
 * Keyless aerial imagery from Esri World Imagery. It is free to display with
 * attribution but is governed by Esri's terms of use; for production, use your
 * own provider (a MapTiler key switches to MapTiler imagery automatically).
 */
const ESRI_IMAGERY: SatelliteConfig = {
  tiles: ["https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"],
  maxzoom: 19,
  attribution: "Imagery © Esri, Maxar, Earthstar Geographics, and the GIS User Community",
};

function trimSlash(url: string | undefined): string | undefined {
  const value = url?.trim();
  return value ? value.replace(/\/+$/, "") : undefined;
}

/**
 * Style: explicit URL, else MapTiler when a key is present, else a keyless open
 * style with 3D buildings. Terrain: explicit TileJSON, else MapTiler, else the
 * keyless AWS elevation tiles (set NEXT_PUBLIC_TERRAIN=off to disable).
 * NEXT_PUBLIC_* values are bundled into client code — only put public,
 * domain-restricted keys here, never secrets.
 */
export function getMapConfig(): MapConfig {
  const explicitStyle = process.env.NEXT_PUBLIC_MAP_STYLE_URL?.trim();
  const maptilerKey = process.env.NEXT_PUBLIC_MAPTILER_KEY?.trim();
  const explicitTerrain = process.env.NEXT_PUBLIC_TERRAIN_TILES_URL?.trim();
  const terrainOff = process.env.NEXT_PUBLIC_TERRAIN?.trim().toLowerCase() === "off";
  const exaggeration = Number(process.env.NEXT_PUBLIC_TERRAIN_EXAGGERATION) || DEFAULT_EXAGGERATION;

  const styleUrl =
    explicitStyle ||
    (maptilerKey ? `https://api.maptiler.com/maps/streets-v2/style.json?key=${maptilerKey}` : OPEN_STYLE);

  const terrainSource: RasterDEMSourceSpecification = explicitTerrain
    ? { type: "raster-dem", url: explicitTerrain, tileSize: 256 }
    : maptilerKey
      ? { type: "raster-dem", url: `https://api.maptiler.com/tiles/terrain-rgb-v2/tiles.json?key=${maptilerKey}`, tileSize: 256 }
      : OPEN_TERRAIN;

  const explicitSatellite = process.env.NEXT_PUBLIC_SATELLITE_TILES_URL?.trim();
  const satelliteOff = process.env.NEXT_PUBLIC_SATELLITE?.trim().toLowerCase() === "off";
  const satellite: SatelliteConfig = explicitSatellite
    ? {
        tiles: [explicitSatellite],
        maxzoom: 19,
        attribution: process.env.NEXT_PUBLIC_SATELLITE_ATTRIBUTION?.trim() || "Imagery provider",
      }
    : maptilerKey
      ? {
          tiles: [`https://api.maptiler.com/tiles/satellite-v2/{z}/{x}/{y}.jpg?key=${maptilerKey}`],
          maxzoom: 20,
          attribution: "© MapTiler © Maxar and other imagery providers",
        }
      : ESRI_IMAGERY;
  const defaultBasemap: Basemap = process.env.NEXT_PUBLIC_DEFAULT_BASEMAP?.trim().toLowerCase() === "satellite" ? "satellite" : "map";

  return {
    styleUrl,
    satellite: satelliteOff ? undefined : satellite,
    defaultBasemap: satelliteOff ? "map" : defaultBasemap,
    terrain: terrainOff ? undefined : { source: terrainSource, exaggeration },
    routingUrls: {
      driving: trimSlash(process.env.NEXT_PUBLIC_ROUTING_URL_DRIVING),
      walking: trimSlash(process.env.NEXT_PUBLIC_ROUTING_URL_WALKING),
    },
  };
}
