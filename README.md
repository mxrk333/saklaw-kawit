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
- `lib/search` (engine, synonyms, suggestions), `lib/map` (config, layers, routing), `lib/data/repository.ts`
- `data/` source data and generated JSON, `types/` shared models, `hooks/`

## Moving to Firebase

UI code talks to `lib/data/repository.ts` only. Implement `ListingsRepository` against Firestore and swap it in.
Reports (`submitReport`) are validated with Zod and stored as `pending`; they must not change a listing until a
moderator approves them (add a moderator-only write path and Firestore security rules when connecting).
