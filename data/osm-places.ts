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
};

function toBusiness(place: OsmPlace): Business {
  const label = LABELS[place.osmTag] ?? "Place";
  return {
    kind: "business",
    id: `osm-${place.osmType}-${place.osmId}`,
    title: place.name,
    description: `${label}${place.barangay ? ` in ${place.barangay}` : ""}, Kawit. Listed from OpenStreetMap; hours and details are not confirmed.`,
    category: place.category,
    barangay: place.barangay || "Kawit",
    address: place.address,
    coordinates: { lat: place.lat, lng: place.lng },
    phone: place.phone,
    website: place.website,
    images: [],
    hoursVerified: false,
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

export const OSM_BUSINESSES: readonly Business[] = ALL_OSM_PLACES.filter(
  (p) => !mergedIds.has(`${p.osmType}/${p.osmId}`),
).map(toBusiness);
