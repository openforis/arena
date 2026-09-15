# Equal Earth base map layer (experiment)

## Context

The UN requires maps to be able to display the world in the Equal Earth
projection (https://en.wikipedia.org/wiki/Equal_Earth_projection), an
equal-area projection increasingly preferred over Web Mercator for world
overviews. Arena's MapView (`webapp/components/MapContainer`) is built on
Leaflet/react-leaflet, which is fundamentally a Web Mercator (EPSG:3857)
tile-based system — Leaflet's custom-CRS support only works for conformal,
rectangular-tileable projections, which Equal Earth (a pseudo-cylindrical,
non-conformal projection with curved meridians) is not. There is no way to
make the whole map "be" Equal Earth in Leaflet.

A known trick (demonstrated at https://equal.bbox.earth/leaflet-eq2merc/)
works around this for **low zoom levels only**: pre-warp geometry so that
when it's rendered through the standard Web Mercator forward projection, it
visually reproduces the Equal Earth projection. This only holds up for
roughly zoom 0–2, where a full world view fits in a few tiles; past that,
the warp and true Mercator converge and the distinction disappears, so
their demo switches to plain Web Mercator tiles above zoom 2.

The reference demo depends entirely on `equal.bbox.earth`-hosted assets:
a MapLibre GL style JSON, `.pbf` vector tiles (Natural Earth data,
reprojected offline via EPSG:8857 and re-encoded into an EPSG:3857 tile
grid), and a glyph server for labels. The user asked for a self-hosted
version instead, so this design does not call out to equal.bbox.earth at
runtime.

This is an **experiment**, done on branch `feat/equal-earth-map`, to prove
the concept and make it available as one selectable (and default) base
layer in MapView's existing layer switcher. It is explicitly not meant to
be production-ready cartography.

## Goal

Add a new base map layer to MapView's `LayersControl`, positioned first in
the list (and therefore selected by default), that shows an Equal
Earth-projected world view at low zoom, self-hosted with no runtime
dependency on equal.bbox.earth.

## The warp, explained

For a vertex at true `(lon, lat)`:

1. Project it through the closed-form Equal Earth forward equations
   (Šavrič, Patterson & Jenny, 2018) to get `(x, y)` in meters.
2. Run `(x, y)` backwards through the *inverse* Web Mercator formula to
   get a "fake" `(lon', lat')`.

Because `forwardMercator(inverseMercator(x, y)) = (x, y)`, any standard
Web Mercator renderer that projects `(lon', lat')` forward reproduces the
Equal Earth-projected shape. This is done once, offline, over a Natural
Earth countries dataset; the output is a static warped GeoJSON file with
no further runtime transform needed.

Above zoom ~2, this warped data no longer reads as Equal Earth (the effect
is only convincing near the world-overview scale), so the layer is capped
around there — same hard cutover the reference demo uses, no smooth blend.

## Approach

Render via **MapLibre GL** (through `@maplibre/maplibre-gl-leaflet`,
matching the mechanism used by the reference demo) pointed at a
**self-hosted static GeoJSON source** — not vector tiles. MapLibre
supports GeoJSON sources natively, and a 110m-resolution Natural Earth
countries dataset is small enough (~100–300KB) that tiling
(tippecanoe/`.pbf` generation + a tile-serving route) buys nothing here.
This avoids standing up new tile-serving or glyph-serving infrastructure
for an experiment. No labels (labels would need a self-hosted glyph
server) or state boundaries — simple country fill + outline only.

### Files

- `webapp/components/MapContainer/EqualEarthBaseLayer.tsx` (new, TS) —
  wraps `L.maplibreGL()` using react-leaflet's `createLayerComponent`
  factory so it behaves like any other react-leaflet layer and can sit
  inside `LayersControl.BaseLayer` alongside the existing `TileLayer`
  entries.
- `webapp/public/geo/natural-earth-equal-earth-eq2merc.geojson` (new,
  generated static asset, committed to the repo).
- `scripts/generate-equal-earth-geojson.js` (new, one-off/dev-only script,
  not part of the app build) — downloads Natural Earth 110m countries data
  and applies the warp, producing the asset above. Kept for
  reproducibility; not re-run automatically.
- `webapp/components/MapContainer/baseLayers.js` — add a new entry with
  `provider: 'equalEarth'` and `type: 'maplibre'`, placed first in the
  `baseLayers` array (making it `defaultBaseLayer` via the existing
  `baseLayers[0]` convention).
- `webapp/components/MapContainer/MapLayersControl.js` — branch on the new
  entry's `type` to render `<EqualEarthBaseLayer>` instead of the default
  `<TileLayer>` path.
- `webapp/components/MapContainer/MapContainer.js` — lower
  `INITIAL_ZOOM_LEVEL` from 3 to 1, so the Equal Earth effect is visible
  on load instead of requiring the user to zoom out manually. This is a
  global constant (affects all base layers, not just this one), which is
  acceptable for this experiment branch.

### New dependencies

- `maplibre-gl` and `@maplibre/maplibre-gl-leaflet` (runtime).
- No new runtime dependency for the warp math (implemented directly from
  the closed-form equations in the one-off generation script); Natural
  Earth data is fetched only at generation time, not shipped as a library.

## Out of scope

- Labels/glyphs, state/province boundaries.
- Smooth blending between the warp and true Mercator (hard cutover, as in
  the reference).
- Production-grade cartographic accuracy or a real EPSG:8857 CRS.
- Any correctness guarantee for markers/GeoJSON overlays plotted on top of
  this layer at zoom 0–2 — they are positioned via true Web Mercator and
  will not visually align with the warped basemap at those zoom levels
  (see caveat discussed with the user; acceptable for this experiment
  since the low-zoom view is a world overview, not a place to inspect
  individual points).

## Testing

Manual only — this is an experiment branch. Verify in the browser that:
the Equal Earth layer is selected by default on MapView load, it visually
resembles the Equal Earth projection at zoom 0–2, the layer switcher still
lists and can switch to the other existing base layers, and the map
transitions sensibly past zoom ~2.
