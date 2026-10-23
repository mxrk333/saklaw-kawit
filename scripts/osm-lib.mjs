/**
 * Pure helpers for importing OpenStreetMap places into SAKLAW.
 * Data © OpenStreetMap contributors, ODbL: https://www.openstreetmap.org/copyright
 */

/** Ray-casting point-in-polygon for a GeoJSON Polygon / MultiPolygon. Coordinates are [lng, lat]. */
export function pointInGeometry(lng, lat, geometry) {
  const polygons = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
  return polygons.some(([outer, ...holes]) => inRing(lng, lat, outer) && !holes.some((hole) => inRing(lng, lat, hole)));
}

function inRing(lng, lat, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/** Bounding box [west, south, east, north] of a Polygon / MultiPolygon. */
export function geometryBounds(geometry) {
  const rings = geometry.type === "Polygon" ? geometry.coordinates : geometry.coordinates.flat();
  const points = rings.flat();
  const lngs = points.map((p) => p[0]);
  const lats = points.map((p) => p[1]);
  return [Math.min(...lngs), Math.min(...lats), Math.max(...lngs), Math.max(...lats)];
}

const SARI_SARI = /sari[\s-]?sari|variety|mini[\s-]?mart|convenience/i;
const WATER = /water\s*(refill|station|station)|refilling|purified|mineral/i;

/**
 * Maps an OSM tag pair (plus name) to a SAKLAW category and search tags.
 * Returns null for anything we don't list (roads, buildings, unrelated POIs).
 */
export function classifyPlace({ category, type, name }) {
  const key = `${category}=${type}`;
  const lowerName = String(name ?? "");

  if (key === "amenity=pharmacy" || key === "shop=chemist" || key === "healthcare=pharmacy") {
    return { category: "shopping", tags: ["pharmacy", "botika", "drugstore", "medicine"] };
  }
  if (key === "amenity=marketplace") {
    return { category: "shopping", tags: ["market", "palengke", "talipapa"] };
  }
  if (category === "shop" && (WATER.test(lowerName) || type === "water")) {
    return { category: "shopping", tags: ["water", "water station", "water refilling"] };
  }
  if (["shop=convenience", "shop=general", "shop=variety_store", "shop=kiosk"].includes(key)) {
    const tags = ["store", "convenience"];
    if (SARI_SARI.test(lowerName) || type === "general" || type === "variety_store") tags.push("sari-sari", "sari sari store");
    return { category: "shopping", tags };
  }
  if (["shop=supermarket", "shop=grocery", "shop=greengrocer", "shop=butcher", "shop=seafood"].includes(key)) {
    return { category: "shopping", tags: ["grocery", "supermarket", "market"] };
  }
  if (key === "amenity=dentist" || key === "healthcare=dentist") {
    return { category: "health", tags: ["dentist", "dental", "clinic", "teeth"] };
  }
  if (["amenity=clinic", "amenity=doctors", "amenity=hospital", "healthcare=clinic", "healthcare=doctor", "healthcare=hospital"].includes(key)) {
    return { category: "health", tags: ["clinic", "doctor", "medical", "health"] };
  }
  if (["amenity=restaurant", "amenity=fast_food", "amenity=cafe", "amenity=food_court", "amenity=canteen"].includes(key)) {
    return { category: "food", tags: ["restaurant", "food", type.replace(/_/g, " ")] };
  }
  if (["amenity=school", "amenity=kindergarten", "amenity=college"].includes(key)) {
    return { category: "schools", tags: ["school", "eskwela"] };
  }
  if (["amenity=townhall", "office=government", "amenity=police", "amenity=fire_station"].includes(key)) {
    return { category: "government", tags: ["government", "office"] };
  }
  return null;
}

/** Turns one Nominatim jsonv2 result into a place record, or null if unusable. */
export function toPlace(result, boundary) {
  const lat = Number(result.lat);
  const lng = Number(result.lon);
  const name = (result.name ?? "").trim();
  if (!name || Number.isNaN(lat) || Number.isNaN(lng)) return null;
  if (!pointInGeometry(lng, lat, boundary)) return null;

  const classified = classifyPlace({ category: result.category, type: result.type, name });
  if (!classified) return null;

  const extra = result.extratags ?? {};
  const address = result.address ?? {};
  const street = [address.house_number, address.road].filter(Boolean).join(" ");
  const area = address.suburb ?? address.neighbourhood ?? address.village ?? address.quarter ?? "";

  return {
    osmType: result.osm_type,
    osmId: result.osm_id,
    name,
    category: classified.category,
    tags: classified.tags,
    osmTag: `${result.category}=${result.type}`,
    lat,
    lng,
    barangay: area,
    address: [street, area, "Kawit, Cavite"].filter(Boolean).join(", "),
    phone: extra.phone ?? extra["contact:phone"],
    website: extra.website ?? extra["contact:website"],
  };
}

/** Area-weighted centroid of the largest outer ring; falls back to the bbox centre if it lands outside. */
export function geometryCenter(geometry) {
  const polygons = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
  const ring = polygons.map(([outer]) => outer).sort((a, b) => Math.abs(ringArea(b)) - Math.abs(ringArea(a)))[0];
  let area = 0;
  let cx = 0;
  let cy = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const cross = ring[j][0] * ring[i][1] - ring[i][0] * ring[j][1];
    area += cross;
    cx += (ring[j][0] + ring[i][0]) * cross;
    cy += (ring[j][1] + ring[i][1]) * cross;
  }
  const lng = cx / (3 * area);
  const lat = cy / (3 * area);
  if (Number.isFinite(lng) && Number.isFinite(lat) && pointInGeometry(lng, lat, geometry)) return { lat, lng };
  const [w, s, e, n] = geometryBounds(geometry);
  return { lat: (s + n) / 2, lng: (w + e) / 2 };
}

function ringArea(ring) {
  let area = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) area += ring[j][0] * ring[i][1] - ring[i][0] * ring[j][1];
  return area / 2;
}

/** Rounds coordinates to ~1 m so the generated file stays small. */
export function roundGeometry(geometry, decimals = 5) {
  const factor = 10 ** decimals;
  const round = (node) => (typeof node[0] === "number" ? node.map((n) => Math.round(n * factor) / factor) : node.map(round));
  return { type: geometry.type, coordinates: round(geometry.coordinates) };
}
