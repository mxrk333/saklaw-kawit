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

Waiting for a location pin (add a geo line, then un-indent to publish):

    # Hobbean Café
    category: food
    type: coffee shop
    tags: coffee, cafe
    address: Lot 4 Advincula Ave, Kawit, Cavite
    note: In LI-BU Azure's Commercial Building. Dine-in and takeout. Open until 10 PM. Location pin still needed.

    # Erlbrew Cafe
    category: food
    type: cafe
    tags: coffee, cafe
    address: Masaito, Lot 4 Azalea St cor Advincula Ave, Kawit, Cavite
    phone: 0927 330 0854
    website: https://erlbrew.codigital.services
    note: Dine-in, takeout and delivery. Open daily 8 AM to 9 PM.

    # Heart Flowers and Coffee
    category: food
    type: cafe
    tags: coffee, cafe, flowers
    address: 2F KNJ Building, Toclong-San Sebastian Rd, San Sebastian, Kawit, Cavite
    barangay: San Sebastian
    website: https://linktr.ee/heartflowersandcoffee
    note: Dine-in and takeout. Open 10:30 AM to 8 PM (to 7 PM Tue to Thu), closed Mondays.

Example for a coffee shop (it then appears under the Coffee & Tea chip):

    # Kapehan ni Juan
    category: food
    type: coffee shop
    geo: 14.4458, 120.9052
    address: Street, Barangay, Kawit


# Commonbrew Signature - Lancaster Kawit
category: food
type: coffee shop
tags: coffee, cafe, commonbrew
geo: 14.408938, 120.902812
address: 2640-C Advincula Ave, San Sebastian, Kawit, Cavite
barangay: San Sebastian
phone: 0917 112 8791
note: Dine-in and takeout. Open until 11 PM. Location from Plus Code CW53+H4.

# Coffee Spot - Kawit
category: food
type: coffee shop
tags: coffee, cafe
geo: 14.409063, 120.902188
address: Advincula Ave, San Sebastian, Kawit, Cavite
barangay: San Sebastian
phone: 0951 867 5303
note: Dine-in, curbside pickup and delivery. Open until 11 PM. LGBTQ+ friendly. Location from Plus Code CW52+JV.

# Sage & Grounds
category: food
type: coffee shop
tags: coffee, cafe
geo: 14.409563, 120.902188
address: Lot 1 (Stall 34-35) Advincula Rd, Lancaster Blvd, Kawit, Cavite
note: Location from Plus Code CW52+RV.

# Hiwaga Cafe
category: food
type: coffee shop
tags: coffee, cafe
geo: 14.410188, 120.900937
address: Advincula St cor Azalea St, Kawit, Cavite
phone: 0976 460 9995
website: https://www.facebook.com/hiwagacafe
note: Dine-in and drive-through, with online ordering. Open Fri to Sun 11 AM to 11 PM, Mon to Thu 1 PM to 11 PM. Location from Plus Code CW62+39.

# CAKAO
category: food
type: coffee shop
tags: coffee, cafe
geo: 14.409563, 120.903063
address: Kawit, Cavite
note: Dine-in, drive-through and delivery. Open daily 8 AM to 10 PM. Exact street address still needed. Location from Plus Code CW53+R6.

# INAM Coffee
category: food
type: coffee stand
tags: coffee, kape
geo: 14.410312, 120.902062
address: Kinamot Market, beside MFB Bldg, Advincula Ave, Kawit, Cavite
phone: 0906 677 0972
note: Dine-in and takeout. Open daily 6 PM to 12 AM. Location from Plus Code CW62+4R.

# PB Coffee
category: food
type: coffee shop
tags: coffee, cafe
geo: 14.428138, 120.888547
address: 466 Magdalo, Kawit, Cavite (in Jardin De La Vida Pavilion)
barangay: Magdalo
note: Dine-in, takeout and delivery. Open 1 PM to 9 PM; Mondays 11 AM to 7 PM. Location from Plus Code CVHQ+7C3.

# Cafe 506
category: food
type: cafe
tags: coffee, cafe
geo: 14.426388, 120.889797
address: EPZA Diversion Rd, Kawit, Cavite
phone: (046) 443 7581
note: Dine-in, takeout and delivery. Open daily 10 AM to 9 PM. Location from Plus Code CVGQ+HW3.

# Sunday Coffee
category: food
type: coffee shop
tags: coffee, cafe
geo: 14.437313, 120.891937
address: 704 Panamitan, Magdiwang Hwy, Kawit, Cavite
phone: 0976 026 8235
website: https://www.facebook.com/sundaycoffee.cavite
note: Dine-in, takeout, delivery and online ordering. Open 1 PM to 10 PM, closed Wednesdays. LGBTQ+ friendly. Menu at menu-sundaycoffee.my.canva.site. Location from Plus Code CVPR+WQ.

# Che Sari-Sari Store
category: places
type: sari-sari store
tags: sari-sari, tindahan, convenience store
geo: 14.435563, 120.907438
address: Ph3 Blk7 Lot1, Waterfield Village, Kawit, Cavite
phone: 0994 480 0720
note: Open 24 hours, every day. Location from Plus Code CWP4+6X.

# S&R Kawit
category: shopping
type: supermarket
tags: supermarket, grocery, groceries, S&R
geo: 14.432688, 120.899937
address: Centennial Road, Batong Dalig, Kawit, Cavite (in Evo City by Ayala Land)
barangay: Batong Dalig
phone: (046) 476 1888
note: Delivery available. Open until 9 PM. Location from Plus Code CVMX+3X.
