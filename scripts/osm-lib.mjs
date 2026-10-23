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

/** Names that mark a coffee or milk-tea place even when OSM tags it as fast food or a restaurant. */
const COFFEE_NAME = /coffee|caf[eé]|kape|espresso|brew|barista|roastery|milk\s?tea|boba|bubble tea|dunkin|tim hortons|gong cha|tiger sugar|macao imperial|\btea\b/i;
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
  if (key === "amenity=hospital" || key === "healthcare=hospital") {
    return { category: "health", tags: ["hospital", "ospital", "emergency", "medical", "health", "clinic", "doctor"] };
  }
  if (["amenity=clinic", "amenity=doctors", "healthcare=clinic", "healthcare=doctor"].includes(key)) {
    return { category: "health", tags: ["clinic", "doctor", "medical", "health"] };
  }
  if (key === "amenity=police") {
    return { category: "government", tags: ["police", "police station", "pulis", "pnp", "emergency", "government", "office"] };
  }
  if (key === "amenity=fire_station") {
    return { category: "government", tags: ["fire", "fire station", "bumbero", "emergency", "government", "office"] };
  }
  if (key === "amenity=cafe") {
    return { category: "food", tags: ["coffee", "coffee shop", "cafe", "kape", "food"] };
  }
  if (key === "shop=coffee" || key === "shop=tea") {
    return { category: "food", tags: ["coffee", "coffee shop", "kape", "tea", "food"] };
  }
  if (["amenity=restaurant", "amenity=fast_food", "amenity=food_court", "amenity=canteen"].includes(key)) {
    const tags = ["restaurant", "food", type.replace(/_/g, " ")];
    // Chains and local shops that serve coffee or milk tea but are tagged fast_food/restaurant.
    if (COFFEE_NAME.test(lowerName)) tags.push("coffee", "coffee shop", "kape");
    return { category: "food", tags };
  }
  if (category === "tourism" && ["hotel", "guest_house", "hostel", "motel", "resort", "apartment", "chalet"].includes(type)) {
    return { category: "stay", tags: ["hotel", "stay", "accommodation", "lodging", "matutuluyan", type.replace(/_/g, " ")] };
  }
  if (category === "tourism" && ["attraction", "museum", "gallery", "viewpoint", "theme_park", "zoo", "aquarium"].includes(type)) {
    return { category: "attractions", tags: ["attraction", "tourist spot", "landmark", "pasyalan", type.replace(/_/g, " ")] };
  }
  if (category === "historic") {
    return { category: "attractions", tags: ["attraction", "tourist spot", "historic", "heritage", "landmark", "pasyalan", type.replace(/_/g, " ")] };
  }
  if (key === "leisure=park" || key === "leisure=garden" || key === "leisure=resort") {
    return { category: "attractions", tags: ["attraction", "park", "pasyalan", type.replace(/_/g, " ")] };
  }
  if (key === "shop=mall") {
    return { category: "shopping", tags: ["mall", "shopping mall", "shopping"] };
  }
  if (["amenity=school", "amenity=kindergarten", "amenity=college"].includes(key)) {
    return { category: "schools", tags: ["school", "eskwela"] };
  }
  if (["amenity=townhall", "office=government"].includes(key)) {
    return { category: "government", tags: ["government", "office"] };
  }
  if (key === "shop=wholesale" || key === "shop=department_store") {
    return { category: "shopping", tags: ["wholesale", "warehouse", "supermarket", "store", "shopping", type.replace(/_/g, " ")] };
  }
  const SERVICES = new Set([
    "amenity=bank", "amenity=post_office", "amenity=fuel", "amenity=car_wash", "amenity=cinema", "amenity=pawnbroker",
    "shop=laundry", "shop=hairdresser", "shop=beauty", "shop=barber", "shop=car_repair", "shop=motorcycle_repair",
    "shop=bakery", "shop=hardware", "shop=copyshop", "shop=mobile_phone", "shop=books", "shop=clothes", "shop=electronics",
    "leisure=fitness_centre", "leisure=sports_centre",
  ]);
  if (SERVICES.has(key)) {
    return { category: "places", tags: ["service", "store", type.replace(/_/g, " ")] };
  }
  // Any other named shop is still a place people look for.
  if (category === "shop") {
    return { category: "shopping", tags: ["store", "shop", type.replace(/_/g, " ")] };
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
    openingHours: extra.opening_hours,
    hours: parseOpeningHours(extra.opening_hours) ?? undefined,
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

const DAY_INDEX = { Su: 0, Mo: 1, Tu: 2, We: 3, Th: 4, Fr: 5, Sa: 6 };
const WEEK_ORDER = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const TIME_RANGE = /^(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})$/;
const pad = (n) => String(n).padStart(2, "0");

/** Expands "Mo-Fr", "Sa", "Mo,We,Fr" into day indexes (0 = Sunday). Returns null if unsupported. */
function expandDays(spec) {
  const days = [];
  for (const token of spec.split(",").map((t) => t.trim()).filter(Boolean)) {
    const range = /^([A-Z][a-z])(?:-([A-Z][a-z]))?$/.exec(token);
    if (!range || !(range[1] in DAY_INDEX) || (range[2] && !(range[2] in DAY_INDEX))) return null;
    const from = WEEK_ORDER.indexOf(range[1]);
    const to = range[2] ? WEEK_ORDER.indexOf(range[2]) : from;
    for (let i = from; ; i = (i + 1) % 7) {
      days.push(DAY_INDEX[WEEK_ORDER[i]]);
      if (i === to) break;
    }
  }
  return days.length > 0 ? days : null;
}

/**
 * Parses the common subset of OpenStreetMap's opening_hours syntax into a week
 * (index 0 = Sunday, each day a list of { open, close } "HH:mm" ranges):
 * "24/7", "Mo-Sa 08:00-20:00", "Mo-Fr 08:00-17:00; Sa 08:00-12:00", "Su off".
 * Returns null for anything it does not fully understand (public holidays,
 * sunrise/sunset, month rules...), because a wrong "open now" is worse than none.
 */
export function parseOpeningHours(text) {
  const value = String(text ?? "").trim();
  if (!value) return null;
  const week = Array.from({ length: 7 }, () => []);

  if (value === "24/7") return week.map(() => [{ open: "00:00", close: "24:00" }]);

  for (const rule of value.split(";").map((r) => r.trim()).filter(Boolean)) {
    const split = /^(.*?)\s*(off|closed|\d.*)$/i.exec(rule);
    if (!split) return null;
    const days = split[1] ? expandDays(split[1]) : [0, 1, 2, 3, 4, 5, 6];
    if (!days) return null;

    let ranges = [];
    if (!/^(off|closed)$/i.test(split[2])) {
      for (const part of split[2].split(",").map((t) => t.trim())) {
        const m = TIME_RANGE.exec(part);
        if (!m) return null;
        ranges.push({ open: `${pad(Number(m[1]))}:${m[2]}`, close: `${pad(Number(m[3]))}:${m[4]}` });
      }
    }
    for (const day of days) week[day] = ranges; // later rules override earlier ones
  }
  return week;
}
