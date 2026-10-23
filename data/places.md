Places you add by hand (sari-sari stores, water stations, shops, services...).
Copy a block below, remove the example markers, and fill it in. One block per place.
Only list real places. Get coordinates by right-clicking the spot in any map and copying the
"lat, lng". Then run `pnpm build-sources` (it also runs on `pnpm dev` / `pnpm build`).

Format (each line after the heading is optional except geo, which puts it on the map):

    # Place name
    category: places        (places, shopping, food, health, stay, attractions, schools, government)
    type: sari-sari store   (free text; also searchable)
    tags: sari-sari, tindahan
    geo: 14.4458, 120.9052
    address: Street, Barangay, Kawit
    barangay: Poblacion
    phone: 0917 000 0000
    website: https://...
    source: https://maps.app.goo.gl/...   (where you found it)
    note: anything worth knowing

