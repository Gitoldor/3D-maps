# Sho1re1 3D Map

A mobile-first MapLibre 3D map centred on Sawantwadi, backed by Cloudflare D1 through a Cloudflare Worker API.

## Live app
https://gitoldor.github.io/3D-maps/

## Architecture
- GitHub Pages serves `index.html`.
- MapLibre GL JS + OpenFreeMap provide the interactive basemap.
- PMTiles global building-height layer and Terrarium DEM provide 3D buildings/terrain.
- Cloudflare Worker `sho1re1-map-api` exposes read-only `/api/posts`, `/api/categories`, and `/api/health`.
- Worker D1 binding `DB` points to the `sho1re1` database.

## Deploy API changes
Upload `worker.js` as a module Worker named `sho1re1-map-api`, with D1 binding:
- Variable name: `DB`
- Database: `sho1re1`
- Database ID: `64640c85-2e90-45de-acaa-ff6a4f981cfa`

Allowed browser origin: `https://gitoldor.github.io`.

## Notes
Current records are clearly marked mock/demo data. The public API only returns published listing fields; it does not expose payment rows or contact details.
