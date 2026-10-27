export interface Credit {
  name: string;
  /** SPDX id or short licence name. */
  license: string;
  by: string;
  url: string;
  /** Link to the licence or terms, when it is not obvious from `url`. */
  licenseUrl?: string;
  /** What SAKLAW uses it for. */
  use: string;
}

/** Direct runtime dependencies. tests/credits.test.ts fails if one is missing here. */
export const SOFTWARE_CREDITS: readonly (Credit & { pkg: string })[] = [
  { pkg: "next", name: "Next.js", license: "MIT", by: "Vercel", url: "https://github.com/vercel/next.js", use: "Web framework" },
  { pkg: "react", name: "React", license: "MIT", by: "Meta and contributors", url: "https://react.dev", use: "User interface" },
  { pkg: "react-dom", name: "React DOM", license: "MIT", by: "Meta and contributors", url: "https://react.dev", use: "User interface" },
  { pkg: "tailwindcss", name: "Tailwind CSS", license: "MIT", by: "Tailwind Labs", url: "https://github.com/tailwindlabs/tailwindcss", use: "Styling" },
  { pkg: "shadcn", name: "shadcn/ui", license: "MIT", by: "shadcn", url: "https://github.com/shadcn-ui/ui", use: "Component patterns" },
  { pkg: "@base-ui/react", name: "Base UI", license: "MIT", by: "MUI Team", url: "https://github.com/mui/base-ui", use: "Accessible dialog and form primitives" },
  { pkg: "maplibre-gl", name: "MapLibre GL JS", license: "BSD-3-Clause", by: "MapLibre contributors", url: "https://github.com/maplibre/maplibre-gl-js", use: "Interactive 3D map" },
  { pkg: "three", name: "three.js", license: "MIT", by: "three.js authors", url: "https://github.com/mrdoob/three.js", use: "The small 3D people shown at live events" },
  { pkg: "lucide-react", name: "Lucide", license: "ISC", by: "Lucide Contributors (includes work by Cole Bemis / Feather, MIT)", url: "https://github.com/lucide-icons/lucide", use: "Icons" },
  { pkg: "class-variance-authority", name: "class-variance-authority", license: "Apache-2.0", by: "Joe Bell", url: "https://github.com/joe-bell/cva", use: "Component variants" },
  { pkg: "clsx", name: "clsx", license: "MIT", by: "Luke Edwards", url: "https://github.com/lukeed/clsx", use: "Class names" },
  { pkg: "tailwind-merge", name: "tailwind-merge", license: "MIT", by: "Dany Castillo", url: "https://github.com/dcastil/tailwind-merge", use: "Class names" },
  { pkg: "tw-animate-css", name: "tw-animate-css", license: "MIT", by: "Luca Bosin", url: "https://github.com/Wombosvideo/tw-animate-css", use: "Animations" },
  { pkg: "next-themes", name: "next-themes", license: "MIT", by: "Paco Coursey", url: "https://github.com/pacocoursey/next-themes", use: "Light and dark theme" },
  { pkg: "sonner", name: "Sonner", license: "MIT", by: "Emil Kowalski", url: "https://github.com/emilkowalski/sonner", use: "Toast notifications" },
  { pkg: "zod", name: "Zod", license: "MIT", by: "Colin McDonnell", url: "https://github.com/colinhacks/zod", use: "Input validation" },
  { pkg: "nodemailer", name: "Nodemailer", license: "MIT-0", by: "Andris Reinman", url: "https://github.com/nodemailer/nodemailer", use: "Emailing reports and suggestions" },
];

/** Fonts, map data, imagery and services. These have their own terms; see each link. */
export const DATA_CREDITS: readonly Credit[] = [
  {
    name: "Geist and Geist Mono fonts",
    license: "SIL OFL 1.1",
    by: "Vercel",
    url: "https://vercel.com/font",
    licenseUrl: "https://openfontlicense.org",
    use: "Typefaces, served through Google Fonts",
  },
  {
    name: "OpenStreetMap",
    license: "ODbL 1.0",
    by: "OpenStreetMap contributors",
    url: "https://www.openstreetmap.org/copyright",
    use: "Map data, Kawit boundary and many place listings (database rights; attribution required)",
  },
  {
    name: "OpenFreeMap and OpenMapTiles",
    license: "CC BY 4.0 (OpenMapTiles), data from OpenStreetMap",
    by: "OpenFreeMap, OpenMapTiles and OpenStreetMap contributors",
    url: "https://openfreemap.org",
    licenseUrl: "https://openmaptiles.org",
    use: "Default map style and vector tiles",
  },
  {
    name: "Terrain Tiles (Terrarium)",
    license: "Public data, see attribution list",
    by: "Mapzen, USGS, NASA SRTM, and other elevation sources",
    url: "https://github.com/tilezen/joerd/blob/master/docs/attribution.md",
    use: "3D terrain relief",
  },
  {
    name: "Esri World Imagery",
    license: "Esri terms of use",
    by: "Esri, Maxar, Earthstar Geographics, and the GIS User Community",
    url: "https://www.esri.com",
    licenseUrl: "https://www.esri.com/en-us/legal/terms/full-master-agreement",
    use: "Optional satellite basemap",
  },
  {
    name: "MapTiler",
    license: "MapTiler terms (only when an API key is configured)",
    by: "MapTiler",
    url: "https://www.maptiler.com/copyright/",
    use: "Optional alternative map style, terrain and imagery",
  },
  {
    name: "Nominatim and Overpass API",
    license: "OSM data under ODbL; each service has a usage policy",
    by: "OpenStreetMap Foundation and Overpass API operators",
    url: "https://operations.osmfoundation.org/policies/nominatim/",
    use: "Importing places and boundaries (not called by visitors)",
  },
  {
    name: "Open Location Code (Plus Codes)",
    license: "Apache-2.0",
    by: "Google",
    url: "https://github.com/google/open-location-code",
    use: "Converting Plus Codes into map coordinates",
  },
];

export const TRADEMARK_NOTICE =
  "Google Maps, Apple Maps, Facebook and every business, brand and organisation name shown belong to their respective owners. They are used only to identify places and link to them, with no endorsement implied.";
