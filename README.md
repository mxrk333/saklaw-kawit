# SAKLAW

Local search and community discovery for Filipinos. Launches with **Kawit, Cavite**; the data model and map
config are location-agnostic so other municipalities can be added later.

Search places, services, announcements and events, see results on an interactive 3D map, open a listing, and
get directions.

## Run it

```bash
pnpm install
pnpm dev          # http://localhost:3000
pnpm typecheck && pnpm lint && pnpm test && pnpm build
```

It works with no configuration (keyless open map style with 3D buildings; directions open in Google/Apple Maps).
Copy `.env.example` to `.env.local` to enable terrain (MapTiler key) or in-app routes (OSRM-compatible server).

`pnpm dev` / `pnpm build` first run `copy-map-worker`, which copies MapLibre's worker into `public/` because
the bundler does not resolve it.

## Where the data comes from

The mock data is gone. Listings are built from `data/rawsources.md`, one block per barangay:

```
# Gahak
https://www.facebook.com/...        <- page URL
Barangay Hall Landline: (046) ...   <- optional phone (the text before the number is kept as a note)
geo: 14.4458, 120.9052              <- optional map location you have confirmed
No Facebook page                    <- any other line is kept as a note
```

`pnpm dev`, `pnpm build` and `pnpm test` run `build-sources`, which parses that file into
`data/generated/raw-sources.json` and prints warnings for anything it can't use. Nothing is invented:
no street address, hours or coordinates are added, and every entry is "Unverified". A listing only gets a map
pin and directions once you add a `geo:` line for it.

### OpenStreetMap places

`pnpm import-osm` (run manually, not on every build) fetches Kawit's boundary and common places from
OpenStreetMap via Nominatim: pharmacies, markets (talipapa), convenience / sari-sari stores, supermarkets, water
stations, clinics, dentists, restaurants, schools and government offices. It keeps only named places inside Kawit's
boundary and writes `data/generated/kawit-boundary.json` and `osm-places.json`. Barangay halls that match a barangay
in `rawsources.md` supply that barangay's coordinates instead of being listed twice.

Data © OpenStreetMap contributors, [ODbL](https://www.openstreetmap.org/copyright). Listings are shown as
"Community submitted" with a link to the OSM element; hours are never assumed. Coverage depends on what mappers
have added, so small shops are under-represented. Google Maps is deliberately not scraped (its terms prohibit it).

Basemaps: the map opens on aerial imagery with road and place labels; the layers button switches to the vector map
with 3D buildings. Imagery defaults to Esri World Imagery (keyless, attribution shown, subject to Esri's terms; use a
MapTiler key or your own tiles for production). Google Maps imagery is not used: its terms don't allow it here.

Terrain: 3D relief, hillshade and a sky are on by default using keyless public elevation tiles (Terrain Tiles on
AWS). Kawit is a flat coastal plain, so relief is exaggerated (`NEXT_PUBLIC_TERRAIN_EXAGGERATION`, default 2); set
`NEXT_PUBLIC_TERRAIN=off` to disable, or provide a MapTiler key / your own DEM in `.env.local`.

Location: the locate button on the map starts live tracking (blue dot with accuracy ring). Tap again to follow, drag
the map to stop following, tap once more to stop tracking. Nothing is requested until you tap it, and the map only
follows you while you are inside Kawit.

The map is limited to Kawit: panning is restricted to the municipality and everything outside the boundary is dimmed.

Barangay areas: `pnpm build-sources && pnpm import-barangay-areas` fetches each listed barangay's outline from OpenStreetMap
into `data/generated/barangay-areas.json` (8 have outlines, the rest only a mapped center point). Selecting a barangay
highlights and zooms to its area; tapping inside an area on the map selects it. A point that only marks a barangay's middle
is drawn as a hollow pin and has no directions, because it is not an address. Re-run both commands after adding barangays
to `data/rawsources.md`.

Announcements and events (`data/announcements.ts`, `data/events.ts`) are empty until real, attributed posts are
added. Facebook pages are linked, not scraped.

Rules the code enforces (see `lib/utils/verification.ts`, `lib/utils/hours.ts`, tests in `tests/`):

- "Official" is shown only when the source carries `verifiedBy` + `verifiedAt`; otherwise it downgrades.
- Expired announcements and past events never appear as current.
- Open/closed is shown only for verified hours (Asia/Manila time); otherwise "Hours unconfirmed".
- Route distance/time come only from a routing server response, never estimated.

## Structure

- `app/` routes: `/` explorer, `/places`, `/places/[id]`, `/announcements`, `/announcements/[id]`, `/events`
- `components/{layout,search,map,places,listing,directions,announcements,contribute,ui}`
- `scripts/` (raw-source parser, OSM importer), `lib/search` (engine, synonyms, suggestions), `lib/map` (config, layers, routing), `lib/data/repository.ts`
- `data/` source data and generated JSON, `types/` shared models, `hooks/`

## Moving to Firebase

UI code talks to `lib/data/repository.ts` only. Implement `ListingsRepository` against Firestore and swap it in.
Reports (`submitReport`) are validated with Zod and stored as `pending`; they must not change a listing until a
moderator approves them (add a moderator-only write path and Firestore security rules when connecting).
