/**
 * Helpers for importing every tagged shop/service inside Kawit from OpenStreetMap
 * via the Overpass API (complete tag-based coverage, unlike text search).
 * Data © OpenStreetMap contributors, ODbL.
 */

/** Overpass area ids are 3600000000 + the relation id. */
export function buildQuery(relationId) {
  const area = 3_600_000_000 + relationId;
  const amenities =
    "pharmacy|marketplace|bank|post_office|fuel|car_wash|cinema|pawnbroker|dentist|clinic|hospital|doctors|restaurant|fast_food|cafe|food_court|school|kindergarten|college|townhall|police|fire_station";
  return `[out:json][timeout:120];
area(${area})->.k;
(
  nwr["shop"](area.k);
  nwr["amenity"~"^(${amenities})$"](area.k);
  nwr["tourism"~"^(hotel|guest_house|hostel|motel|resort|apartment|chalet|attraction|museum|gallery|viewpoint|theme_park|zoo|aquarium)$"](area.k);
  nwr["leisure"~"^(park|garden|resort|fitness_centre|sports_centre)$"](area.k);
  nwr["historic"](area.k);
);
out center tags;`;
}

const KEYS = ["shop", "amenity", "tourism", "leisure", "historic", "healthcare", "office"];

/** Shop types people look for even when nobody has typed a name into OSM. */
const UNNAMED_OK = {
  convenience: "Convenience store",
  variety_store: "Sari-sari / variety store",
  general: "General store",
  kiosk: "Kiosk",
  water: "Water station",
  beverages: "Water station / beverages",
};

/**
 * Converts one Overpass element into the Nominatim-style result that toPlace()
 * understands. Returns null if it has no usable tag or no position. Unnamed
 * entries are kept only for the shop types in UNNAMED_OK.
 */
export function elementToResult(element) {
  const tags = element.tags ?? {};
  const key = KEYS.find((k) => tags[k]);
  const lat = element.lat ?? element.center?.lat;
  const lon = element.lon ?? element.center?.lon;
  if (!key || lat === undefined || lon === undefined) return null;

  const type = tags[key];
  const name = (tags.name ?? tags["name:en"] ?? "").trim() || (key === "shop" ? UNNAMED_OK[type] : undefined);
  if (!name) return null;

  return {
    osm_type: element.type,
    osm_id: element.id,
    name,
    category: key,
    type,
    lat: String(lat),
    lon: String(lon),
    address: {
      house_number: tags["addr:housenumber"],
      road: tags["addr:street"],
      suburb: tags["addr:suburb"] ?? tags["addr:barangay"] ?? tags["addr:neighbourhood"],
    },
    extratags: {
      phone: tags.phone ?? tags["contact:phone"],
      website: tags.website ?? tags["contact:website"],
      opening_hours: tags.opening_hours,
    },
  };
}
