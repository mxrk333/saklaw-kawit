/**
 * One-off importer: Kawit's boundary and common local places from OpenStreetMap
 * (via Nominatim). Writes data/generated/kawit-boundary.json and osm-places.json.
 *
 *   pnpm import-osm
 *
 * Be polite to the public service: one request per ~1.2s, a handful of queries,
 * results cached in the generated files. Data © OpenStreetMap contributors (ODbL).
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { geometryBounds, toPlace } from "./osm-lib.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = resolve(root, "data/generated");
const USER_AGENT = "saklaw-importer/0.1 (https://github.com/saklaw; mark.christian@hytel.io)";
const BASE = "https://nominatim.openstreetmap.org/search";
const KAWIT_RELATION = 1485548;

const QUERIES = [
  "pharmacy", "drugstore", "botika",
  "marketplace", "talipapa", "public market",
  "sari-sari store", "convenience store", "variety store", "grocery", "supermarket",
  "water refilling station", "water station",
  "dentist", "clinic", "hospital",
  "restaurant", "carinderia", "fast food",
  "school", "barangay hall", "municipal hall",
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(params) {
  const url = `${BASE}?${new URLSearchParams(params)}`;
  const response = await fetch(url, { headers: { "User-Agent": USER_AGENT, "Accept-Language": "en" } });
  if (!response.ok) throw new Error(`Nominatim ${response.status} for ${url}`);
  return response.json();
}

async function fetchBoundary() {
  const results = await get({ q: "Kawit, Cavite, Philippines", format: "jsonv2", polygon_geojson: "1", limit: "5" });
  const match = results.find((r) => r.osm_type === "relation" && r.osm_id === KAWIT_RELATION) ?? results.find((r) => r.category === "boundary");
  if (!match?.geojson) throw new Error("Could not find the Kawit boundary.");
  return { relation: match.osm_id, name: match.display_name, geometry: match.geojson };
}

mkdirSync(outDir, { recursive: true });
const boundary = await fetchBoundary();
const bounds = geometryBounds(boundary.geometry);
writeFileSync(
  resolve(outDir, "kawit-boundary.json"),
  `${JSON.stringify({ source: "OpenStreetMap contributors (ODbL)", relation: boundary.relation, name: boundary.name, bounds, geometry: boundary.geometry })}\n`,
);
process.stdout.write(`boundary: relation ${boundary.relation}, bounds ${bounds.map((n) => n.toFixed(4)).join(", ")}\n`);

const [west, south, east, north] = bounds;
const places = new Map();
const perQuery = {};

for (const q of QUERIES) {
  await sleep(1200);
  const results = await get({
    q,
    format: "jsonv2",
    viewbox: `${west},${north},${east},${south}`,
    bounded: "1",
    limit: "40",
    addressdetails: "1",
    extratags: "1",
  });
  let kept = 0;
  for (const result of results) {
    const place = toPlace(result, boundary.geometry);
    const id = `${result.osm_type}/${result.osm_id}`;
    if (place && !places.has(id)) {
      places.set(id, place);
      kept += 1;
    }
  }
  perQuery[q] = `${results.length} found, ${kept} new`;
  process.stdout.write(`  ${q}: ${perQuery[q]}\n`);
}

const list = [...places.values()].sort((a, b) => a.name.localeCompare(b.name));
writeFileSync(
  resolve(outDir, "osm-places.json"),
  `${JSON.stringify({ source: "OpenStreetMap contributors (ODbL)", licenseUrl: "https://www.openstreetmap.org/copyright", fetchedAt: new Date().toISOString(), places: list }, null, 2)}\n`,
);

const byCategory = list.reduce((acc, p) => ({ ...acc, [p.osmTag]: (acc[p.osmTag] ?? 0) + 1 }), {});
process.stdout.write(`\n${list.length} places inside Kawit\n${JSON.stringify(byCategory, null, 2)}\n`);
