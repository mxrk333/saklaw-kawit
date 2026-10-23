/**
 * Complete OpenStreetMap import for Kawit via Overpass. Replaces
 * data/generated/osm-places.json with every tagged shop and service inside the
 * town boundary (including unnamed convenience / sari-sari stores).
 *
 *   pnpm import-overpass
 *
 * Needs access to an Overpass server (set OVERPASS_URL to use another mirror).
 * Run `pnpm import-osm` instead if Overpass is unreachable.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { toPlace } from "./osm-lib.mjs";
import { buildQuery, elementToResult } from "./overpass-lib.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const kawit = JSON.parse(readFileSync(resolve(root, "data/generated/kawit-boundary.json"), "utf8"));
const url = process.env.OVERPASS_URL ?? "https://overpass-api.de/api/interpreter";

const response = await fetch(url, {
  method: "POST",
  headers: { "User-Agent": "saklaw-importer/0.1 (mark.christian@hytel.io)", "Content-Type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({ data: buildQuery(kawit.relation) }),
  signal: AbortSignal.timeout(150_000),
});
if (!response.ok) throw new Error(`Overpass ${response.status}: ${(await response.text()).slice(0, 200)}`);
const { elements } = await response.json();

const places = new Map();
for (const element of elements) {
  const result = elementToResult(element);
  const place = result && toPlace(result, kawit.geometry);
  if (place) places.set(`${place.osmType}/${place.osmId}`, place);
}

const list = [...places.values()].sort((a, b) => a.name.localeCompare(b.name));
writeFileSync(
  resolve(root, "data/generated/osm-places.json"),
  `${JSON.stringify({ source: "OpenStreetMap contributors (ODbL)", licenseUrl: "https://www.openstreetmap.org/copyright", fetchedAt: new Date().toISOString(), places: list }, null, 2)}\n`,
);
process.stdout.write(`${elements.length} OSM elements -> ${list.length} places inside Kawit\n`);
