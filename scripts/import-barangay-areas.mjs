/**
 * Fetches each barangay's boundary from OpenStreetMap (via Nominatim) for every
 * barangay in data/generated/raw-sources.json. Writes data/generated/barangay-areas.json.
 *
 *   pnpm build-sources && pnpm import-barangay-areas
 *
 * Data © OpenStreetMap contributors (ODbL). One request per ~1.2s.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { geometryBounds, geometryCenter, pointInGeometry, roundGeometry } from "./osm-lib.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const { sources } = JSON.parse(readFileSync(resolve(root, "data/generated/raw-sources.json"), "utf8"));
const kawit = JSON.parse(readFileSync(resolve(root, "data/generated/kawit-boundary.json"), "utf8"));
const [west, south, east, north] = kawit.bounds;
const USER_AGENT = "saklaw-importer/0.1 (mark.christian@hytel.io)";
const KAWIT_RELATION = 1485548;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const normalize = (text) => text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

async function search(q) {
  const params = new URLSearchParams({
    q,
    format: "jsonv2",
    polygon_geojson: "1",
    polygon_threshold: "0.0002",
    viewbox: `${west},${north},${east},${south}`,
    bounded: "1",
    layer: "address", // administrative areas and places only, not buildings or shops
    limit: "8",
  });
  const response = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, { headers: { "User-Agent": USER_AGENT } });
  if (!response.ok) throw new Error(`Nominatim ${response.status}`);
  return response.json();
}

function variants(name) {
  const base = name.replace(/-/g, " ");
  const head = base.split(" ")[0];
  return [`Barangay ${name}, Kawit`, `Barangay ${base}, Kawit`, `${base}, Kawit, Cavite`, `${head}, Kawit, Cavite`];
}

const areas = [];
const missing = [];
for (const source of sources) {
  let found = null;
  let placePoint = null; // fallback: a mapped place node with no outline
  for (const q of variants(source.name)) {
    await sleep(1200);
    const results = await search(q);
    const first = normalize(source.name).split(" ")[0];
    found = results.find(
      (r) =>
        r.osm_id !== KAWIT_RELATION &&
        r.category === "boundary" &&
        (r.geojson?.type === "Polygon" || r.geojson?.type === "MultiPolygon") &&
        normalize(`${r.name} ${r.display_name}`).includes(first) &&
        pointInGeometry(Number(r.lon), Number(r.lat), kawit.geometry),
    );
    placePoint ??= results.find(
      (r) =>
        r.category === "place" &&
        normalize(`${r.name}`).includes(first) &&
        pointInGeometry(Number(r.lon), Number(r.lat), kawit.geometry),
    );
    if (found) break;
  }
  if (!found && placePoint) {
    areas.push({
      id: source.id,
      name: source.name,
      osmType: placePoint.osm_type,
      osmId: placePoint.osm_id,
      osmName: placePoint.name,
      center: { lat: Number(placePoint.lat), lng: Number(placePoint.lon) },
      bounds: null,
      geometry: null,
    });
    process.stdout.write(`  ${source.name}: point only ${placePoint.osm_type}/${placePoint.osm_id} "${placePoint.name}" (${placePoint.category}=${placePoint.type})\n`);
    continue;
  }
  if (!found) {
    missing.push(source.name);
    process.stdout.write(`  ${source.name}: nothing found\n`);
    continue;
  }
  const geometry = roundGeometry(found.geojson);
  areas.push({
    id: source.id,
    name: source.name,
    osmType: found.osm_type,
    osmId: found.osm_id,
    osmName: found.name,
    center: geometryCenter(geometry),
    bounds: geometryBounds(geometry),
    geometry,
  });
  process.stdout.write(`  ${source.name}: ${found.osm_type}/${found.osm_id} "${found.name}" (${found.category}=${found.type})\n`);
}

writeFileSync(
  resolve(root, "data/generated/barangay-areas.json"),
  `${JSON.stringify({ source: "OpenStreetMap contributors (ODbL)", fetchedAt: new Date().toISOString(), areas })}\n`,
);
process.stdout.write(`\n${areas.filter((a) => a.geometry).length} boundaries and ${areas.filter((a) => !a.geometry).length} point-only areas saved of ${sources.length}. Missing: ${missing.join(", ") || "none"}\n`);
