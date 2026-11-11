# Equal Earth base map layer — live blend, UN borders, richer style

## Context

This extends the Equal Earth base map layer experiment from
`docs/superpowers/specs/2026-09-08-equal-earth-map-design.md` (branch
`feat/equal-earth-map`, already implemented and reviewed once). That first
pass used a static pre-warped GeoJSON asset, a flat single-color style, and
a hard zoom cap (with a Leaflet-level "restore `map.options.maxZoom` on
layer removal" mechanism) to keep the warp from being used past the zoom
where it stops looking like Equal Earth.

The final whole-branch review of that work found a Critical bug: capping
`map.options.maxZoom` while the layer is active makes `map.getMaxZoom()`
capped **globally**, which breaks three other things elsewhere in MapView
that read it — `ClusterMarker`'s expansion-zoom calculation, `useFlyToPoint`'s
"fly to this record" zoom target, and `PreloadedLayer`'s `fitBounds`. It also
found that the shared `MapContainer` component (used by both MapView and the
unrelated record-editing "pick a coordinate" screen) picked up the Equal
Earth default and zoom-1 start unconditionally, and that attribution wasn't
actually rendering (`@maplibre/maplibre-gl-leaflet` reads attribution from
the MapLibre style's *source*, not the Leaflet layer's `attribution` option).

Rather than patch that mechanism, this spec replaces it: the hard cap and
the Leaflet-level layer swap are removed entirely. This also directly
resolves the Critical/Important findings above, since the new mechanism
never touches `map.options.maxZoom`.

## Goal

1. Make the low-zoom view visually match the reference
   (https://equal.bbox.earth/leaflet-eq2merc/) — glow outlines, categorical
   country fill colors, white internal borders, dashed geographic/disputed
   lines, Antarctica styled separately, no labels.
2. Adjust the underlying boundary data to follow UN cartographic convention
   for specific disputed territories (Taiwan; Western Sahara and Kashmir
   pending verification against the actual source data — see below).
3. Replace the static warp + hard cutover with a **continuous** zoom-driven
   blend from the Equal Earth warp to true positions, cross-fading into UN
   ClearMap's own tiles — so zooming in feels like one continuous motion,
   not a snap.
4. Fix the two independent bugs the final review found that aren't about
   the blend mechanism: attribution, and the shared `MapContainer` picking
   up MapView-specific defaults.

## Approach

### 1. Style

Port the actual bbox.earth style (already fetched and inspected during
design) into `equalEarthMapStyle.ts`: a `background` layer, a two-pass glow
outline per country (`line`, low opacity, wide, then narrower/more opaque),
a `fill` layer colored by a `mapcolor7`-style categorical property (7-color
palette, so no two adjacent countries share a color), a `land-border-country`
white line layer, a `geo-lines` dashed layer for non-country boundaries, and
a distinct fill for Antarctica. No `symbol`/text layers — no labels, per the
explicit requirement.

This requires the generated GeoJSON asset to carry a `mapcolor7` property
per feature (from Natural Earth's own `MAPCOLOR7` field), not just `admin`
as the first pass did.

### 2. UN-convention boundary adjustments

Applied once, in the generation script, to the source data before anything
else:

- **Taiwan**: geometrically merged into China (`@turf/union`) — one
  polygon, one fill color, no internal border between them. Matches the
  UN's One-China convention (UN General Assembly Resolution 2758);
  unambiguous.
- **Western Sahara**: Natural Earth's standard admin-0 countries file
  already carries Western Sahara as its own separate feature (distinct from
  Morocco) — this needs confirming against the actual downloaded data
  during implementation, but if so, no edit is needed; it already matches
  the UN's treatment (listed as a non-self-governing territory, not merged
  into Morocco).
- **Kashmir**: the UN's actual convention isn't "assign it to a country" —
  it's "don't draw a definitive international boundary through the
  disputed area" (typically a dashed/unresolved line, sourced from a
  dedicated disputed-boundaries dataset rather than the country-boundaries
  file). Natural Earth's 110m admin-0 countries file (our current source)
  is unlikely to carry that boundary-line detail at all — it's usually a
  separate, finer-resolution product. During implementation: check whether
  a suitable disputed-boundaries source is readily available at a
  comparable simplification level; if not, leave Kashmir's boundary as
  Natural Earth's current de facto line and document that explicitly as a
  known limitation, rather than guess at a convention without the data to
  back it.

### 3. Live blend architecture

**Data:** the generated asset now stores **true, UN-adjusted coordinates**
(no pre-warping at generation time). `core/geo/equalEarthProjection.ts`'s
warp becomes a runtime dependency in the browser bundle (it's already
isomorphic TypeScript, so this needs no new code, just a new caller).

**Blend:** on the client, `EqualEarthBaseLayer` fetches the asset once,
keeping the parsed true-coordinate `FeatureCollection` in memory. On every
zoom change (see throttling below), it computes a blend factor:

```
blend = clamp((BLEND_END_ZOOM - currentZoom) / (BLEND_END_ZOOM - BLEND_START_ZOOM), 0, 1)
```

with `BLEND_START_ZOOM = 1` (blend = 1.0, fully warped) and
`BLEND_END_ZOOM = 4` (blend = 0.0, fully true position). For each vertex,
the rendered position is a direct per-coordinate linear interpolation
between its true `(lon, lat)` and its warped `(lon, lat)` (computed via
`warpLonLatToEqualEarthInMercator`), weighted by `blend`. This is a
simple, deliberately unsophisticated interpolation (no geodesic path, no
antimeridian-unwrap handling) — acceptable for this experiment; noted as a
known edge-case limitation rather than engineered around.

The interpolated `FeatureCollection` is pushed to the running MapLibre
instance via `map.getSource('countries').setData(...)`.

**Throttling:** recomputing ~29,000 coordinate pairs per zoom-changed event
is cheap (single-digit milliseconds), but zoom animation can fire many
`zoom` events per second — updates are coalesced to at most once per
animation frame (a pending-update flag checked/cleared inside
`requestAnimationFrame`), not on every individual event.

**Cross-fade to UN ClearMap:** UN ClearMap's existing tile URL and
attribution (already defined in `baseLayers.js`'s `UN ClearMap` entry) are
added as a **second source in the same MapLibre style** — a `raster`
source, `tileSize: 256`, `maxzoom: 8` (UN ClearMap's own limit; beyond that
it clamps the same way the existing standalone "UN ClearMap" switcher entry
already does today). Its `raster-opacity` and the country vector layers'
`fill-opacity`/`line-opacity` are driven by MapLibre's built-in
`interpolate`/`["zoom"]` style expressions over the same `[1, 4]` band —
UN ClearMap fades in as the country layers fade out.

**Net effect:** exactly one Leaflet layer is ever active (the MapLibre GL
layer) across the entire zoom range. There is no `map.setMaxZoom()` call,
no Leaflet-level layer swap, and no global mutation of
`map.options.maxZoom` — so `map.getMaxZoom()` stays whatever the map's own
default is for the whole session, and `ClusterMarker`, `useFlyToPoint`, and
`PreloadedLayer.fitBounds` are unaffected. This is how the Critical finding
from the prior review is resolved by construction, not patched.

`EqualEarthBaseLayer.tsx` loses its `add`/`remove` zoom-cap-capture-restore
logic entirely (that whole mechanism goes away) and gains: an initial
fetch of the true-coordinate asset, a zoom-change listener that recomputes
and pushes blended data, and cleanup of that listener on `remove`.

### 4. Scoping the default to MapView only

`MapContainer` gains an optional prop (e.g. `preferEqualEarthDefault` or
similar — exact name decided during planning) that MapView passes and the
record-editing coordinate picker (`mapTriggerButton.js`, `nodeDefGeo.js`)
does not. When not set, `baseLayers.js`'s existing `defaultBaseLayer`
(now whichever entry was first before this experiment) and the original
`INITIAL_ZOOM_LEVEL` behavior apply unchanged for the point-picker use case.
This directly fixes the review's finding #4.

### 5. Attribution fix

`equalEarthMapStyle.ts`'s `countries` source gains an `attribution` field
(`'Natural Earth'`) — `@maplibre/maplibre-gl-leaflet` reads attribution from
the style's source objects, not from the Leaflet layer's `attribution`
option, so that's the field that actually needs it. The `countries` raster
UN-ClearMap source added in this spec also carries its own attribution
(the same string already used by the existing `UN ClearMap` `baseLayers.js`
entry).

## Files/changes (indicative — finalized during planning)

- `scripts/generate-equal-earth-geojson.ts` — simplified: no longer warps;
  applies the UN-convention adjustments (Taiwan merge via `@turf/union`,
  Western Sahara/Kashmir per the investigation above); keeps `admin` and
  adds `mapcolor7` to each feature's properties.
- `web-resources/geo/natural-earth-equal-earth-eq2merc.geojson` —
  regenerated: true coordinates (UN-adjusted), not warped; `mapcolor7`
  property added. (Filename kept for continuity even though it's no longer
  pre-warped — reconsider during planning if a rename reads better.)
- `webapp/components/MapContainer/equalEarthMapStyle.ts` — rewritten:
  richer vector styling (glow/fill/borders/dashed lines, no labels,
  `mapcolor7`-driven categorical fill, Antarctica special-cased), plus the
  new UN ClearMap raster source and the zoom-`interpolate` cross-fade
  expressions, plus source-level attribution.
- `webapp/components/MapContainer/EqualEarthBaseLayer.tsx` — rewritten:
  drop the maxZoom cap/capture/restore logic; add the fetch-once +
  zoom-driven blend-and-`setData()` logic, rAF-throttled.
- `webapp/components/MapContainer/MapContainer.js` — add the new prop;
  make the Equal-Earth-as-default / `INITIAL_ZOOM_LEVEL` change conditional
  on it instead of global.
- `webapp/views/App/views/Data/MapView/index.js` (or wherever MapView
  renders `MapContainer` — confirmed during planning) — pass the new prop.
- New dependency: `@turf/union` (the project already depends on several
  other `@turf/*` packages, so this fits the existing pattern rather than
  introducing a new library).

## Out of scope

- Kashmir's boundary treatment, if suitable disputed-boundary data isn't
  reasonably available at generation time (documented as a limitation
  rather than guessed).
- Any UN-convention adjustment beyond Taiwan, Western Sahara, and Kashmir.
- Geodesically-correct or antimeridian-aware interpolation for the blend
  (direct lon/lat lerp only).
- Making the blend zoom band (`[1, 4]`) or the handoff target user
  configurable — both are fixed constants for this experiment.
- Performance work beyond the single rAF-throttling described above (e.g.
  no Web Worker offload, no partial/viewport-culled recompute).

## Testing

Manual only, as with the first pass — verify in the browser that: the
style visually resembles the reference (colors, glow, borders, no labels),
Taiwan renders as part of China with no internal border, zooming from 1 to
4+ shows a continuous (not snapping) transition into UN ClearMap tiles,
`map.getMaxZoom()` is never artificially capped (spot check: cluster
expansion and "fly to record" still work normally while Equal Earth is the
active/default layer), and the record-editing coordinate picker is
unaffected (still opens on its original default layer/zoom).
