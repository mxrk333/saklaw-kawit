import { haversineMeters } from "@/lib/utils/geo";
import type { Business } from "@/types";
import { rawSourceNames } from "./barangays";
import { ALL_OSM_PLACES, OSM_FETCHED_AT, findBarangayHall, type OsmPlace } from "./osm-match";

const LABELS: Record<string, string> = {
  "amenity=pharmacy": "Pharmacy",
  "shop=chemist": "Pharmacy",
  "amenity=marketplace": "Public market",
  "shop=convenience": "Convenience store",
  "shop=variety_store": "Sari-sari / variety store",
  "shop=general": "General store",
  "shop=kiosk": "Kiosk",
  "shop=supermarket": "Supermarket",
  "shop=grocery": "Grocery",
  "shop=beverages": "Water station / beverages",
  "shop=water": "Water station",
  "amenity=dentist": "Dental clinic",
  "amenity=clinic": "Clinic",
  "amenity=hospital": "Hospital",
  "amenity=doctors": "Doctor's clinic",
  "amenity=restaurant": "Restaurant",
  "amenity=fast_food": "Fast food",
  "amenity=cafe": "Cafe",
  "amenity=school": "School",
  "amenity=kindergarten": "School",
  "amenity=townhall": "Government office",
  "shop=wholesale": "Wholesale club",
  "shop=department_store": "Department store",
  "amenity=bank": "Bank",
  "amenity=fuel": "Gas station",
  "shop=laundry": "Laundry",
  "shop=bakery": "Bakery",
  "shop=hardware": "Hardware store",
  "tourism=hotel": "Hotel",
  "tourism=motel": "Motel",
  "tourism=guest_house": "Guest house",
  "tourism=hostel": "Hostel",
  "tourism=resort": "Resort",
  "leisure=resort": "Resort",
  "tourism=museum": "Museum",
  "leisure=park": "Park",
  "shop=mall": "Shopping mall",
  "historic=monument": "Historic monument",
  "historic=memorial": "Historic memorial",
};

const FALLBACK_LABELS: Partial<Record<OsmPlace["category"], string>> = {
  stay: "Place to stay",
  attractions: "Tourist attraction",
  places: "Service",
  shopping: "Store",
};

function toBusiness(place: OsmPlace): Business {
  const label = LABELS[place.osmTag] ?? FALLBACK_LABELS[place.category] ?? "Place";
  return {
    kind: "business",
    id: `osm-${place.osmType}-${place.osmId}`,
    title: place.name,
    description: `${label}${place.barangay ? ` in ${place.barangay}` : ""}, Kawit. Listed from OpenStreetMap; ${
      place.hours ? "hours are from OpenStreetMap and may be out of date." : "hours and details are not confirmed."
    }`,
    category: place.category,
    barangay: place.barangay || "Kawit",
    address: place.address,
    coordinates: { lat: place.lat, lng: place.lng },
    phone: place.phone,
    website: place.website,
    images: [],
    hours: place.hours,
    hoursVerified: false,
    hoursSource: place.hours ? "osm" : undefined,
    recommendations: [],
    tags: [...place.tags, label.toLowerCase(), place.name.toLowerCase()],
    verification: "community",
    source: {
      name: "OpenStreetMap contributors (ODbL)",
      url: `https://www.openstreetmap.org/${place.osmType}/${place.osmId}`,
    },
    isDemo: false,
    updatedAt: OSM_FETCHED_AT,
  };
}

/** Halls already shown as one of the barangays in rawsources.md are not listed twice. */
const mergedIds = new Set(
  rawSourceNames.flatMap((name) => {
    const hall = findBarangayHall(name);
    return hall ? [`${hall.osmType}/${hall.osmId}`] : [];
  }),
);

const DUPLICATE_RADIUS_M = 200;

/** OSM often maps one place twice (e.g. a museum and a memorial). Keep the first of same-name neighbours. */
function dropDuplicates(places: readonly OsmPlace[]): OsmPlace[] {
  const kept: OsmPlace[] = [];
  for (const place of places) {
    const name = place.name.toLowerCase();
    const duplicate = kept.some(
      (other) => other.name.toLowerCase() === name && haversineMeters(other, place) < DUPLICATE_RADIUS_M,
    );
    if (!duplicate) kept.push(place);
  }
  return kept;
}

export const OSM_BUSINESSES: readonly Business[] = dropDuplicates(
  ALL_OSM_PLACES.filter((p) => !mergedIds.has(`${p.osmType}/${p.osmId}`)),
).map(toBusiness);
