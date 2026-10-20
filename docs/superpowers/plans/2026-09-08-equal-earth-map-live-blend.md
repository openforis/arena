# Equal Earth Live Blend, UN Borders & Richer Style Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Equal Earth base layer's hard zoom-cap + flat style with a continuous zoom-driven blend from the Equal Earth warp to true positions, cross-fading into UN ClearMap's own tiles, using a richer bbox.earth-style vector look and UN-convention boundary data (Taiwan merged into China) — without ever touching the shared map's `maxZoom`, and without changing the record-editing coordinate picker's behavior.

**Architecture:** Pure blend math (`core/geo/equalEarthBlend.ts`) is shared between a richer MapLibre style (`equalEarthMapStyle.ts`, which cross-fades vector country layers against a UN ClearMap raster source via zoom-`interpolate` paint expressions) and the layer component (`EqualEarthBaseLayer.tsx`, which fetches true-position country data once and pushes zoom-blended coordinates into the running MapLibre instance via `setData()`, rAF-throttled). The generation script drops warping entirely (now a runtime concern) and instead applies UN-convention boundary adjustments once, offline. A new `equalEarthAsDefault` prop threads through `MapContainer` → `MapLayersControl` so only `MapView` gets Equal Earth pre-selected as the default base layer; the record-editing point picker is unaffected. (The map's initial zoom stays a single unconditional `3` for both consumers — an Equal-Earth-specific lower zoom was tried and dropped: at zoom 1-2 the world repeats horizontally in the viewport, which reads as broken rendering rather than a world overview.)

**Tech Stack:** Same as the first pass (React, react-leaflet, `@react-leaflet/core`, Leaflet, MapLibre GL JS, TypeScript for new/rewritten frontend files) plus a new dependency: `@turf/union` (matches the project's existing `@turf/*` sub-package convention).

## Global Constraints

- Branch: `feat/equal-earth-map` (already checked out, first pass already merged into it).
- New/rewritten frontend and core files stay TypeScript.
- No runtime dependency on `equal.bbox.earth` (style is ported, not fetched from them).
- No labels/text layers in the style.
- The map's `maxZoom` must never be set globally (`map.setMaxZoom()`/`map.options.maxZoom` must not be touched anywhere in this feature) — this is what broke `ClusterMarker`, `useFlyToPoint`, and `PreloadedLayer.fitBounds` in the first pass's final review; the whole point of this redesign is to avoid that class of bug structurally.
- `MapContainer`'s Equal-Earth-as-default behavior must be opt-in (only `MapView` opts in) — the record-editing coordinate picker (`mapTriggerButton.js`, `nodeDefGeo.js`) must keep its original default layer. (The initial zoom is `3` for both consumers, unconditionally — no zoom-level distinction between them.)
- Kashmir's boundary is explicitly left unchanged (Natural Earth's 110m admin-0 countries file has no disputed-boundary line data at this resolution) — documented as a known limitation, not silently guessed at.
- Design doc: `docs/superpowers/specs/2026-09-08-equal-earth-map-live-blend-design.md`.

---

### Task 1: Shared blend math (`core/geo/equalEarthBlend.ts`)

**Files:**
- Create: `core/geo/equalEarthBlend.ts`
- Test: `test/unit/tests/equalEarthBlend.test.js`

**Interfaces:**
- Consumes: `warpLonLatToEqualEarthInMercator({ lon, lat }): { lon, lat }` from `@core/geo/equalEarthProjection` (already exists from the first pass).
- Produces: `DEFAULT_BLEND_ZOOM_RANGE: { start: number; end: number }`, `getBlendFactor(zoom: number, range: { start: number; end: number }): number`, `blendLonLat(lonLat: { lon: number; lat: number }, blend: number): { lon: number; lat: number }`, `blendCountryFeatureCollection(trueData: CountryFeatureCollection, blend: number): CountryFeatureCollection`, and the `CoordinateTree`/`CountryFeature`/`CountryFeatureCollection` types — all exported from `@core/geo/equalEarthBlend`. Task 3 imports `DEFAULT_BLEND_ZOOM_RANGE`; Task 4 imports everything else.

- [ ] **Step 1: Write the failing test**

Create `test/unit/tests/equalEarthBlend.test.js`:

```js
import {
  DEFAULT_BLEND_ZOOM_RANGE,
  blendCountryFeatureCollection,
  blendLonLat,
  getBlendFactor,
} from '@core/geo/equalEarthBlend'

describe('equalEarthBlend', () => {
  test('getBlendFactor is 1 at or below the start zoom', () => {
    expect(getBlendFactor(0, { start: 1, end: 4 })).toBe(1)
    expect(getBlendFactor(1, { start: 1, end: 4 })).toBe(1)
  })

  test('getBlendFactor is 0 at or above the end zoom', () => {
    expect(getBlendFactor(4, { start: 1, end: 4 })).toBe(0)
    expect(getBlendFactor(10, { start: 1, end: 4 })).toBe(0)
  })

  test('getBlendFactor interpolates linearly in between', () => {
    expect(getBlendFactor(2.5, { start: 1, end: 4 })).toBeCloseTo(0.5)
  })

  test('DEFAULT_BLEND_ZOOM_RANGE is zoom 1 to 4', () => {
    expect(DEFAULT_BLEND_ZOOM_RANGE).toEqual({ start: 1, end: 4 })
  })

  test('blendLonLat at blend=0 returns the true position unchanged', () => {
    expect(blendLonLat({ lon: 45, lat: 45 }, 0)).toEqual({ lon: 45, lat: 45 })
  })

  test('blendLonLat at blend=1 returns the fully warped position', () => {
    const result = blendLonLat({ lon: 45, lat: 45 }, 1)
    expect(result.lon).toBeCloseTo(33.227383823930545, 6)
    expect(result.lat).toBeCloseTo(44.13702534320391, 6)
  })

  test('blendCountryFeatureCollection blends every coordinate in every feature, leaving structure and properties intact', () => {
    const trueData = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: { admin: 'XYZ', mapcolor7: 3 },
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [45, 45],
                [0, 0],
              ],
            ],
          },
        },
      ],
    }
    const blended = blendCountryFeatureCollection(trueData, 1)
    expect(blended.features[0].properties).toEqual({ admin: 'XYZ', mapcolor7: 3 })
    expect(blended.features[0].geometry.type).toBe('Polygon')
    expect(blended.features[0].geometry.coordinates[0][0][0]).toBeCloseTo(33.227383823930545, 6)
    expect(blended.features[0].geometry.coordinates[0][0][1]).toBeCloseTo(44.13702534320391, 6)
    expect(blended.features[0].geometry.coordinates[0][1]).toEqual([0, 0])
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `yarn build:test:unit`
Expected: FAIL — webpack build error, "Can't resolve '@core/geo/equalEarthBlend'" (the module doesn't exist yet).

- [ ] **Step 3: Write the implementation**

Create `core/geo/equalEarthBlend.ts`:

```ts
import { warpLonLatToEqualEarthInMercator, type LonLat } from './equalEarthProjection'

export interface BlendZoomRange {
  start: number
  end: number
}

/**
 * The zoom range the Equal Earth base layer blends over: fully warped at or below
 * `start`, fully true position at or above `end`.
 */
export const DEFAULT_BLEND_ZOOM_RANGE: BlendZoomRange = { start: 1, end: 4 }

export type Position = number[]
export type CoordinateTree = Position | CoordinateTree[]

export interface CountryFeature {
  type: 'Feature'
  properties: Record<string, unknown>
  geometry: { type: string; coordinates: CoordinateTree }
}

export interface CountryFeatureCollection {
  type: 'FeatureCollection'
  features: CountryFeature[]
}

const isPosition = (value: CoordinateTree): value is Position => Array.isArray(value) && typeof value[0] === 'number'

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t

/**
 * Returns how much of the Equal Earth warp should be applied at a given zoom level.
 * @param {number} zoom - The current map zoom level.
 * @param {BlendZoomRange} range - The zoom range the blend spans.
 * @returns {number} 1 at or below `range.start` (fully warped), 0 at or above
 * `range.end` (true position), linearly interpolated in between.
 */
export const getBlendFactor = (zoom: number, range: BlendZoomRange): number => {
  if (zoom <= range.start) return 1
  if (zoom >= range.end) return 0
  return (range.end - zoom) / (range.end - range.start)
}

/**
 * Blends a single true longitude/latitude toward its Equal Earth-warped position.
 * @param {LonLat} lonLat - The true (unwarped) longitude/latitude.
 * @param {number} blend - How much warp to apply, from 0 (true position) to 1 (fully warped).
 * @returns {LonLat} The blended longitude/latitude.
 */
export const blendLonLat = (lonLat: LonLat, blend: number): LonLat => {
  if (blend <= 0) return lonLat
  const warped = warpLonLatToEqualEarthInMercator(lonLat)
  return { lon: lerp(lonLat.lon, warped.lon, blend), lat: lerp(lonLat.lat, warped.lat, blend) }
}

const blendCoordinateTree = (coordinates: CoordinateTree, blend: number): CoordinateTree => {
  if (isPosition(coordinates)) {
    const [lon, lat] = coordinates
    const blended = blendLonLat({ lon, lat }, blend)
    return [blended.lon, blended.lat]
  }
  return coordinates.map((coordinate) => blendCoordinateTree(coordinate, blend))
}

/**
 * Blends every coordinate in a country FeatureCollection toward its Equal Earth-warped
 * position, by the given amount.
 * @param {CountryFeatureCollection} trueData - The true (unwarped) country FeatureCollection.
 * @param {number} blend - How much warp to apply, from 0 (true position) to 1 (fully warped).
 * @returns {CountryFeatureCollection} A new FeatureCollection with blended coordinates.
 */
export const blendCountryFeatureCollection = (
  trueData: CountryFeatureCollection,
  blend: number
): CountryFeatureCollection => ({
  ...trueData,
  features: trueData.features.map((feature) => ({
    ...feature,
    geometry: { ...feature.geometry, coordinates: blendCoordinateTree(feature.geometry.coordinates, blend) },
  })),
})
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `yarn build:test:unit && jest dist/__tests__/bundle.unit.js -t equalEarthBlend`
Expected: PASS, 7 tests passing under "equalEarthBlend".

- [ ] **Step 5: Commit**

```bash
git add core/geo/equalEarthBlend.ts test/unit/tests/equalEarthBlend.test.js
git commit -m "$(cat <<'EOF'
Add shared Equal Earth zoom-blend math

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: UN-convention boundary data, no more pre-warping

**Files:**
- Modify: `package.json` (add `@turf/union` dependency)
- Modify: `scripts/generate-equal-earth-geojson.ts`
- Modify (regenerated by running the script): `web-resources/geo/natural-earth-equal-earth-eq2merc.geojson`

**Interfaces:**
- Produces: the regenerated asset now contains **true** (not warped) coordinates, `properties: { admin, mapcolor7 }` per feature (an added `mapcolor7` field, integer 1-7), Taiwan merged into China as one feature. Task 3's style and Task 4's layer both depend on this shape (`mapcolor7` for styling, true coordinates for blending).

- [ ] **Step 1: Add the dependency**

Run: `yarn add @turf/union@^7.3.2`
Expected: added to `dependencies` in `package.json` (alongside the existing `@turf/area`, `@turf/bbox-polygon`, etc., same `^7.3.2` version style), `yarn.lock` updated.

- [ ] **Step 2: Rewrite the generation script**

Replace the full contents of `scripts/generate-equal-earth-geojson.ts` with:

```ts
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

import union from '@turf/union'

const SOURCE_URL =
  'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson'
const OUTPUT_PATH = resolve(
  import.meta.dirname,
  '..',
  'web-resources',
  'geo',
  'natural-earth-equal-earth-eq2merc.geojson'
)

// UN General Assembly Resolution 2758 - Taiwan is represented as part of China on UN
// maps, with no distinguishing international boundary between them.
const TAIWAN_ADM0_A3 = 'TWN'
const CHINA_ADM0_A3 = 'CHN'

// Western Sahara (ADM0_A3 'SAH') is already a standalone Natural Earth feature, distinct
// from Morocco, with TYPE 'Indeterminate' - this already matches the UN's treatment
// (listed as a non-self-governing territory, not merged into Morocco), so no edit is
// needed for it.

// Kashmir is NOT adjusted: the UN's actual convention there is to omit a definitive
// international boundary through the disputed area (typically a dashed/unresolved line
// sourced from a dedicated disputed-boundaries dataset), not to assign the territory to
// one country. Natural Earth's 110m admin-0 countries file (this script's only source)
// doesn't carry that boundary-line detail at this resolution - it's absorbed into
// India/Pakistan/China's ordinary polygons with no separate feature to adjust. Left as
// Natural Earth's de facto boundary; documented here as a known limitation rather than
// guessed at without the data to back a specific convention.

interface NaturalEarthFeature {
  type: 'Feature'
  properties: Record<string, unknown>
  geometry: { type: string; coordinates: unknown }
}

interface NaturalEarthFeatureCollection {
  type: 'FeatureCollection'
  features: NaturalEarthFeature[]
}

const mergeTaiwanIntoChina = (features: NaturalEarthFeature[]): NaturalEarthFeature[] => {
  const china = features.find((feature) => feature.properties.ADM0_A3 === CHINA_ADM0_A3)
  const taiwan = features.find((feature) => feature.properties.ADM0_A3 === TAIWAN_ADM0_A3)
  if (!china || !taiwan) {
    throw new Error('Expected to find both China (CHN) and Taiwan (TWN) features to merge')
  }

  const mergedGeometry = union({ type: 'FeatureCollection', features: [china, taiwan] } as any, {
    properties: china.properties,
  })
  if (!mergedGeometry) {
    throw new Error('Failed to merge Taiwan into China')
  }

  const otherFeatures = features.filter(
    (feature) => feature.properties.ADM0_A3 !== CHINA_ADM0_A3 && feature.properties.ADM0_A3 !== TAIWAN_ADM0_A3
  )
  return [mergedGeometry as unknown as NaturalEarthFeature, ...otherFeatures]
}

const run = async (): Promise<void> => {
  console.log(`Fetching Natural Earth countries data from ${SOURCE_URL}`)
  const response = await fetch(SOURCE_URL)
  if (!response.ok) {
    throw new Error(`Failed to fetch source data: ${response.status} ${response.statusText}`)
  }
  const data = (await response.json()) as NaturalEarthFeatureCollection

  const featuresWithTaiwanMerged = mergeTaiwanIntoChina(data.features)

  const outputFeatureCollection = {
    type: 'FeatureCollection',
    features: featuresWithTaiwanMerged.map((feature) => ({
      type: 'Feature',
      properties: { admin: feature.properties.ADM0_A3, mapcolor7: feature.properties.MAPCOLOR7 },
      geometry: feature.geometry,
    })),
  }

  mkdirSync(dirname(OUTPUT_PATH), { recursive: true })
  writeFileSync(OUTPUT_PATH, JSON.stringify(outputFeatureCollection))
  console.log(
    `Wrote ${outputFeatureCollection.features.length} true-position country features ` +
      `(Taiwan merged into China) to ${OUTPUT_PATH}`
  )
}

run().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
```

Note: `union(...)`'s TypeScript signature expects `FeatureCollection<Polygon | MultiPolygon>` from the `geojson` package; this script's own `NaturalEarthFeature` type is intentionally loose (`coordinates: unknown`), matching the rest of this script and the first pass's script — hence the `as any` / `as unknown as NaturalEarthFeature` casts at the union call site, rather than pulling in stricter GeoJSON types for one call.

- [ ] **Step 3: Run the script and verify the output**

Run: `node scripts/generate-equal-earth-geojson.ts`
Expected: prints `Fetching Natural Earth countries data from https://raw.githubusercontent.com/...` then `Wrote 176 true-position country features (Taiwan merged into China) to .../web-resources/geo/natural-earth-equal-earth-eq2merc.geojson` (176, not 177, since Taiwan and China's two features became one merged feature).

Then verify the file is valid JSON with the expected shape:

Run: `node -e "const fs=require('fs'); const d=JSON.parse(fs.readFileSync('web-resources/geo/natural-earth-equal-earth-eq2merc.geojson','utf8')); const twn=d.features.find(f=>f.properties.admin==='TWN'); const chn=d.features.find(f=>f.properties.admin==='CHN'); console.log(d.type, d.features.length, 'TWN separate feature:', !!twn, 'CHN present:', !!chn, chn && chn.geometry.type, chn && chn.properties.mapcolor7)"`
Expected: `FeatureCollection 176 TWN separate feature: false CHN present: true MultiPolygon 4` — confirms no standalone Taiwan feature remains, China is present as the merged (still `MultiPolygon`) feature with its original `mapcolor7` value (4), and no coordinate is pre-warped (verify a China coordinate value looks like a plausible true longitude/latitude, e.g. roughly in the range -180..180 / -90..90, not the much larger warped-meters-turned-degrees values the first pass produced).

- [ ] **Step 4: Commit**

```bash
git add package.json yarn.lock scripts/generate-equal-earth-geojson.ts web-resources/geo/natural-earth-equal-earth-eq2merc.geojson
git commit -m "$(cat <<'EOF'
Merge Taiwan into China per UN convention; stop pre-warping the generated asset

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Richer style, UN ClearMap cross-fade

**Files:**
- Modify: `webapp/components/MapContainer/equalEarthMapStyle.ts` (full rewrite)

**Interfaces:**
- Consumes: `DEFAULT_BLEND_ZOOM_RANGE` from `@core/geo/equalEarthBlend` (Task 1).
- Produces: `equalEarthMapStyle: StyleSpecification` — same export name/shape as before (a `StyleSpecification` object), so `baseLayers.js` and `MapLayersControl.js` (unchanged by this task) keep working. The `countries` GeoJSON source is still named `countries` (Task 4's `EqualEarthBaseLayer.tsx` looks it up by that id via `getSource('countries')`).

- [ ] **Step 1: Rewrite the style module**

Replace the full contents of `webapp/components/MapContainer/equalEarthMapStyle.ts` with:

```ts
import type { StyleSpecification } from 'maplibre-gl'

import { DEFAULT_BLEND_ZOOM_RANGE } from '@core/geo/equalEarthBlend'

const COUNTRIES_GEOJSON_URL = '/geo/natural-earth-equal-earth-eq2merc.geojson'

// Matches the "UN ClearMap" entry in ./baseLayers.js - duplicated here (rather than
// imported) to avoid a circular import between the two modules (baseLayers.js already
// imports this file).
const UN_CLEAR_MAP_TILE_URL =
  'https://pro-ags1.dfs.un.org/arcgis/rest/services/basemaps/clearmap_webtopo_nolabel_cvw/MapServer/tile/{z}/{y}/{x}'
const UN_CLEAR_MAP_ATTRIBUTION = 'Map data &copy; <a href="https://www.un.org/geospatial/">United Nations</a>'
const UN_CLEAR_MAP_MAX_ZOOM = 8

const { start: BLEND_START_ZOOM, end: BLEND_END_ZOOM } = DEFAULT_BLEND_ZOOM_RANGE

export const equalEarthMapStyle: StyleSpecification = {
  version: 8,
  name: 'equal-earth-experiment',
  sources: {
    countries: {
      type: 'geojson',
      data: COUNTRIES_GEOJSON_URL,
      attribution: 'Natural Earth',
    },
    unClearMap: {
      type: 'raster',
      tiles: [UN_CLEAR_MAP_TILE_URL],
      tileSize: 256,
      maxzoom: UN_CLEAR_MAP_MAX_ZOOM,
      attribution: UN_CLEAR_MAP_ATTRIBUTION,
    },
  },
  layers: [
    {
      id: 'background',
      type: 'background',
      paint: { 'background-color': '#ffffff' },
    },
    {
      id: 'un-clearmap-raster',
      type: 'raster',
      source: 'unClearMap',
      paint: {
        'raster-opacity': ['interpolate', ['linear'], ['zoom'], BLEND_START_ZOOM, 0, BLEND_END_ZOOM, 1],
      },
    },
    {
      id: 'country-glow-outer',
      type: 'line',
      source: 'countries',
      layout: { 'line-join': 'round' },
      paint: {
        'line-color': '#226688',
        'line-width': 5,
        'line-opacity': ['interpolate', ['linear'], ['zoom'], BLEND_START_ZOOM, 0.1, BLEND_END_ZOOM, 0],
      },
    },
    {
      id: 'country-glow-inner',
      type: 'line',
      source: 'countries',
      layout: { 'line-join': 'round' },
      paint: {
        'line-color': '#226688',
        'line-width': ['interpolate', ['linear'], ['zoom'], 0, 1.2, 1, 1.6, 2, 2, 3, 2.4],
        'line-opacity': ['interpolate', ['linear'], ['zoom'], BLEND_START_ZOOM, 0.8, BLEND_END_ZOOM, 0],
      },
    },
    {
      id: 'country-fill',
      type: 'fill',
      source: 'countries',
      paint: {
        'fill-color': [
          'match',
          ['get', 'mapcolor7'],
          1,
          '#fdaf6b',
          2,
          '#fdc663',
          3,
          '#fae364',
          4,
          '#d3e46f',
          5,
          '#aadb78',
          6,
          '#a3cec5',
          7,
          '#ceb5cf',
          /* fallback for any unexpected value */ '#cccccc',
        ],
        'fill-opacity': ['interpolate', ['linear'], ['zoom'], BLEND_START_ZOOM, 1, BLEND_END_ZOOM, 0],
      },
    },
    {
      id: 'country-fill-antarctica',
      type: 'fill',
      source: 'countries',
      filter: ['==', ['get', 'admin'], 'ATA'],
      paint: {
        'fill-color': '#f0f8ff',
        'fill-opacity': ['interpolate', ['linear'], ['zoom'], BLEND_START_ZOOM, 1, BLEND_END_ZOOM, 0],
      },
    },
  ],
}
```

Note on scope: the reference style (https://equal.bbox.earth/leaflet-eq2merc/) also has a white `land-border-country` line layer, a dashed `geo-lines` layer, and US/CAN/AUS `state` boundaries — these come from separate vector-tile source-layers in their tileset that this project's single-GeoJSON-source data model doesn't have equivalents for (no shared-border-line dataset, no disputed-boundary line dataset, no state/province boundaries in the 110m admin-0 countries file). They're intentionally omitted; `country-glow-outer`/`country-glow-inner` already draw an outline around every country polygon (coastlines and shared borders alike), which covers the same visual need with the data actually available.

- [ ] **Step 2: Verify types**

Run: `yarn typecheck`
Expected: no new errors from `equalEarthMapStyle.ts` (same baseline as established in earlier tasks — note the exact current count by running `yarn typecheck` once before this change if you want a precise before/after comparison).

- [ ] **Step 3: Commit**

```bash
git add webapp/components/MapContainer/equalEarthMapStyle.ts
git commit -m "$(cat <<'EOF'
Add richer country styling and UN ClearMap cross-fade to the Equal Earth style

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: Live blend in the layer component

**Files:**
- Modify: `webapp/components/MapContainer/EqualEarthBaseLayer.tsx` (full rewrite)

**Interfaces:**
- Consumes: `getBlendFactor`, `blendCountryFeatureCollection`, `DEFAULT_BLEND_ZOOM_RANGE`, `CountryFeatureCollection` from `@core/geo/equalEarthBlend` (Task 1); the `countries` GeoJSON source id from `equalEarthMapStyle.ts` (Task 3).
- Produces: `EqualEarthBaseLayer` — same exported component name/prop shape as before (`{ style: StyleSpecification } & LayerProps`), so `MapLayersControl.js` (unchanged by this task) keeps working.

- [ ] **Step 1: Rewrite the layer component**

Replace the full contents of `webapp/components/MapContainer/EqualEarthBaseLayer.tsx` with:

```tsx
import { createElementObject, createLayerComponent, type LayerProps } from '@react-leaflet/core'
import { maplibreGL } from '@maplibre/maplibre-gl-leaflet'
import type { MaplibreGL as MaplibreGLLayer } from 'leaflet'
import type { GeoJSONSource, StyleSpecification } from 'maplibre-gl'

import {
  DEFAULT_BLEND_ZOOM_RANGE,
  blendCountryFeatureCollection,
  getBlendFactor,
  type CountryFeatureCollection,
} from '@core/geo/equalEarthBlend'

const COUNTRIES_GEOJSON_URL = '/geo/natural-earth-equal-earth-eq2merc.geojson'
const COUNTRIES_SOURCE_ID = 'countries'

export interface EqualEarthBaseLayerProps extends LayerProps {
  style: StyleSpecification
}

export const EqualEarthBaseLayer = createLayerComponent<MaplibreGLLayer, EqualEarthBaseLayerProps>(
  function createEqualEarthBaseLayer({ style, ...options }, context) {
    const layer = maplibreGL({ style, ...options })

    let trueData: CountryFeatureCollection | null = null
    let pendingFrame: number | null = null

    const applyBlend = (): void => {
      pendingFrame = null
      if (!trueData) return
      const source = layer.getMaplibreMap().getSource(COUNTRIES_SOURCE_ID) as GeoJSONSource | undefined
      const blend = getBlendFactor(context.map.getZoom(), DEFAULT_BLEND_ZOOM_RANGE)
      // blendCountryFeatureCollection's return shape matches GeoJSON.GeoJSON structurally,
      // but isn't declared against the strict 'geojson' package types this project doesn't
      // otherwise depend on for this data - cast at this one boundary.
      source?.setData(blendCountryFeatureCollection(trueData, blend) as any)
    }

    const scheduleBlend = (): void => {
      if (pendingFrame !== null) return
      pendingFrame = requestAnimationFrame(applyBlend)
    }

    fetch(COUNTRIES_GEOJSON_URL)
      .then((response) => response.json())
      .then((data: CountryFeatureCollection) => {
        trueData = data
        scheduleBlend()
      })
      .catch(() => {
        // Fetch failed - the style's own static source URL (equalEarthMapStyle.ts) keeps
        // rendering the unblended, true-position countries as a fallback.
      })

    layer.on('add', () => {
      context.map.on('zoom', scheduleBlend)
      scheduleBlend()
    })
    layer.on('remove', () => {
      context.map.off('zoom', scheduleBlend)
      if (pendingFrame !== null) {
        cancelAnimationFrame(pendingFrame)
        pendingFrame = null
      }
    })

    return createElementObject(layer, context)
  }
)
```

- [ ] **Step 2: Verify types**

Run: `yarn typecheck`
Expected: no new errors from `EqualEarthBaseLayer.tsx`. If the `source?.setData(...)` call itself errors despite the `as any` cast (e.g. a different line), address the specific reported error — the cast above is the anticipated fix point, but confirm against the actual compiler output rather than assuming.

- [ ] **Step 3: Commit**

```bash
git add webapp/components/MapContainer/EqualEarthBaseLayer.tsx
git commit -m "$(cat <<'EOF'
Replace hard zoom cap with a continuous zoom-driven blend in EqualEarthBaseLayer

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: Scope the Equal Earth default to MapView only

**Files:**
- Modify: `webapp/components/MapContainer/MapContainer.js`
- Modify: `webapp/components/MapContainer/MapLayersControl.js`
- Modify: `webapp/views/App/views/Data/MapView/MapView.tsx`

**Interfaces:**
- Produces: a new `equalEarthAsDefault` boolean prop (default `false`) on both `MapContainer` and `MapLayersControl`. Only `MapView.tsx` passes `equalEarthAsDefault` (as `true`) to `MapContainer`; `mapTriggerButton.js` and `nodeDefGeo.js` (unchanged by this task) don't, so they keep the original non-Equal-Earth default and zoom-3 start.

- [ ] **Step 1: Add the prop to `MapContainer.js`**

Current:

```js
const INITIAL_ZOOM_LEVEL = 1
// MapLibre GL layers (used by the Equal Earth base layer) don't sync reliably at
// zoom 0, and MapLibre restricts max latitude more strictly than Leaflet - see
// https://github.com/maplibre/maplibre-gl-leaflet#readme
const MAP_MIN_ZOOM = 1
const MAP_MAX_BOUNDS = [
  [180, -Infinity],
  [-180, Infinity],
]
```

change to:

```js
const INITIAL_ZOOM_LEVEL = 3
// MapLibre GL layers (used by the Equal Earth base layer) don't sync reliably at
// zoom 0, and MapLibre restricts max latitude more strictly than Leaflet - see
// https://github.com/maplibre/maplibre-gl-leaflet#readme
// Applied unconditionally (not just when equalEarthAsDefault is set) since the Equal
// Earth layer stays selectable from the switcher either way.
const MAP_MIN_ZOOM = 1
const MAP_MAX_BOUNDS = [
  [180, -Infinity],
  [-180, Infinity],
]
```

Note: `INITIAL_ZOOM_LEVEL` stays a single, unconditional constant at `3` (not split into an Equal-Earth-specific lower value) — at zoom 1-2 the world repeats horizontally in the visible viewport, which reads as a rendering glitch rather than a world overview. Zoom 3 is also comfortably inside the "fully warped" part of the blend range (`DEFAULT_BLEND_ZOOM_RANGE` now starts blending at zoom 4, per Task 1's later adjustment), so the Equal Earth look is still fully shown on load.

Current:

```js
export const MapContainer = (props) => {
  const {
    baseLayersLabel,
    editable = false,
    geoJson = null,
    layers = [],
    markerPoint,
    markerTitle,
    overlayGroups,
    showOptions = true,
  } = props
```

change to:

```js
export const MapContainer = (props) => {
  const {
    baseLayersLabel,
    editable = false,
    equalEarthAsDefault = false,
    geoJson = null,
    layers = [],
    markerPoint,
    markerTitle,
    overlayGroups,
    showOptions = true,
  } = props
```

Current:

```js
        <RLMapContainer
          center={centerPositionLatLon}
          doubleClickZoom={false}
          zoomControl={false}
          zoom={INITIAL_ZOOM_LEVEL}
          minZoom={MAP_MIN_ZOOM}
          maxBounds={MAP_MAX_BOUNDS}
          maxBoundsViscosity={1}
        >
          <MapResizeHandler />
          <MapLayersControl layers={layers} baseLayersLabel={baseLayersLabel} overlayGroups={overlayGroups} />
```

change to:

```js
        <RLMapContainer
          center={centerPositionLatLon}
          doubleClickZoom={false}
          zoomControl={false}
          zoom={INITIAL_ZOOM_LEVEL}
          minZoom={MAP_MIN_ZOOM}
          maxBounds={MAP_MAX_BOUNDS}
          maxBoundsViscosity={1}
        >
          <MapResizeHandler />
          <MapLayersControl
            layers={layers}
            baseLayersLabel={baseLayersLabel}
            overlayGroups={overlayGroups}
            equalEarthAsDefault={equalEarthAsDefault}
          />
```

(`INITIAL_ZOOM_LEVEL` itself is unchanged by this edit — only the `<MapLayersControl>` props change. `equalEarthAsDefault` affects which base layer is pre-selected, via Step 2 below, not the zoom level.)

Current (end of file):

```js
MapContainer.propTypes = {
  baseLayersLabel: PropTypes.string,
  centerPoint: PropTypes.object,
  editable: PropTypes.bool,
  geoJson: PropTypes.object,
  layers: PropTypes.array,
  markerPoint: PropTypes.object,
  markerTitle: PropTypes.string,
  onMarkerPointChange: PropTypes.func,
  overlayGroups: PropTypes.array,
  showOptions: PropTypes.bool,
}
```

change to:

```js
MapContainer.propTypes = {
  baseLayersLabel: PropTypes.string,
  centerPoint: PropTypes.object,
  editable: PropTypes.bool,
  equalEarthAsDefault: PropTypes.bool,
  geoJson: PropTypes.object,
  layers: PropTypes.array,
  markerPoint: PropTypes.object,
  markerTitle: PropTypes.string,
  onMarkerPointChange: PropTypes.func,
  overlayGroups: PropTypes.array,
  showOptions: PropTypes.bool,
}
```

- [ ] **Step 2: Thread the prop through `MapLayersControl.js` and fix the default-layer computation**

Current:

```js
export const MapLayersControl = (props) => {
  const { layers = [], baseLayersLabel, overlayGroups = [] } = props
```

change to:

```js
export const MapLayersControl = (props) => {
  const { layers = [], baseLayersLabel, overlayGroups = [], equalEarthAsDefault = false } = props
```

Current:

```js
  const baseLayersControls = useMemo(() => {
    const result = []
    for (let index = 0; index < baseLayers.length; index++) {
      const baseLayer = baseLayers[index]
      const { key, apiKeyRequired, name, attribution, provider, maxZoom = 17, type, url, style } = baseLayer

      const checked = (!contextBaseLayer && index === 0) || contextBaseLayer?.name === name

      if (type === 'maplibre') {
        result.push(
          <LayersControl.BaseLayer key={key} name={name} checked={checked}>
            <EqualEarthBaseLayer style={style} attribution={attribution} />
          </LayersControl.BaseLayer>
        )
        continue
      }

      const tileUrl = getTileUrl({ url, apiKeyRequired, provider, user })
      if (!tileUrl) {
        continue
      }

      result.push(
        <LayersControl.BaseLayer key={key} name={name} checked={checked}>
          <TileLayer id={key} attribution={attribution} url={tileUrl} maxZoom={maxZoom} minZoom={3} />
        </LayersControl.BaseLayer>
      )
    }
    return result
  }, [contextBaseLayer, getTileUrl, user])
```

change to:

```js
  // The array itself keeps the Equal Earth entry first (so it's first in the switcher's
  // list everywhere), but only equalEarthAsDefault callers (MapView) should have it
  // pre-selected - other consumers (e.g. the record-editing coordinate picker) fall back
  // to the first non-maplibre entry, matching this app's pre-experiment default.
  const defaultBaseLayer = useMemo(
    () =>
      equalEarthAsDefault ? baseLayers[0] : (baseLayers.find((baseLayer) => baseLayer.type !== 'maplibre') ?? baseLayers[0]),
    [equalEarthAsDefault]
  )

  const baseLayersControls = useMemo(() => {
    const result = []
    for (let index = 0; index < baseLayers.length; index++) {
      const baseLayer = baseLayers[index]
      const { key, apiKeyRequired, name, attribution, provider, maxZoom = 17, type, url, style } = baseLayer

      const checked = (!contextBaseLayer && baseLayer === defaultBaseLayer) || contextBaseLayer?.name === name

      if (type === 'maplibre') {
        result.push(
          <LayersControl.BaseLayer key={key} name={name} checked={checked}>
            <EqualEarthBaseLayer style={style} attribution={attribution} />
          </LayersControl.BaseLayer>
        )
        continue
      }

      const tileUrl = getTileUrl({ url, apiKeyRequired, provider, user })
      if (!tileUrl) {
        continue
      }

      result.push(
        <LayersControl.BaseLayer key={key} name={name} checked={checked}>
          <TileLayer id={key} attribution={attribution} url={tileUrl} maxZoom={maxZoom} minZoom={3} />
        </LayersControl.BaseLayer>
      )
    }
    return result
  }, [contextBaseLayer, defaultBaseLayer, getTileUrl, user])
```

`index` (the loop variable) is still used for indexing into `baseLayers`, only the `checked` expression itself changes — leave the `for` loop otherwise as-is.

Current (end of file):

```js
MapLayersControl.propTypes = {
  baseLayersLabel: PropTypes.string,
  layers: PropTypes.array,
  overlayGroups: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      count: PropTypes.number.isRequired,
    })
  ),
}
```

change to:

```js
MapLayersControl.propTypes = {
  baseLayersLabel: PropTypes.string,
  equalEarthAsDefault: PropTypes.bool,
  layers: PropTypes.array,
  overlayGroups: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      count: PropTypes.number.isRequired,
    })
  ),
}
```

- [ ] **Step 3: Opt in from `MapView.tsx`**

In `webapp/views/App/views/Data/MapView/MapView.tsx`, current (inside `MapViewContent`):

```tsx
      <div className="map-view-content__map">
        <MapContainer layers={layers} baseLayersLabel={baseLayersLabel} overlayGroups={overlayGroups} />
      </div>
```

change to:

```tsx
      <div className="map-view-content__map">
        <MapContainer
          layers={layers}
          baseLayersLabel={baseLayersLabel}
          overlayGroups={overlayGroups}
          equalEarthAsDefault
        />
      </div>
```

- [ ] **Step 4: Verify types**

Run: `yarn typecheck`
Expected: no new errors (the two edited `.js` files aren't type-checked; `MapView.tsx` is — confirm no new error there).

- [ ] **Step 5: Commit**

```bash
git add webapp/components/MapContainer/MapContainer.js webapp/components/MapContainer/MapLayersControl.js webapp/views/App/views/Data/MapView/MapView.tsx
git commit -m "$(cat <<'EOF'
Scope Equal Earth default base layer to MapView only

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: Manual verification

**Files:** none (verification only).

- [ ] **Step 1: Start the app**

Run: `yarn watch` (or confirm it's already running — check `curl -s -o /dev/null -w "%{http_code}" http://localhost:9000/` returns a response first, since this branch was previously verified with a dev server already running).
Expected: no compile errors.

- [ ] **Step 2: Verify the regenerated asset is served correctly**

Run: `curl -s http://localhost:9000/geo/natural-earth-equal-earth-eq2merc.geojson | node -e "const fs=require('fs'); let d=''; process.stdin.on('data',c=>d+=c); process.stdin.on('end',()=>{ const j=JSON.parse(d); const twn=j.features.find(f=>f.properties.admin==='TWN'); console.log(j.features.length, 'TWN present:', !!twn) })"`
Expected: `176 TWN present: false`

- [ ] **Step 3: Open MapView and check the style and Taiwan merge**

Log in (e2e test account, per this branch's existing conventions), open a survey's Data → Map view. Confirm:
- The map loads at zoom 3 on the "Equal Earth (experimental)" layer, showing the richer style (glow outlines, multi-color country fill, white/pale Antarctica) rather than the flat single-color look from the first pass. Since the blend now starts at zoom 4, the countries should still look fully Equal Earth-warped at this zoom, not partway blended.
- Taiwan renders as part of China — same fill color, no visible internal border between them.
- No text labels appear anywhere on this layer.

- [ ] **Step 4: Verify the continuous blend and handoff**

Zoom in slowly from 1 to past 4-5. Confirm:
- The transition looks continuous (countries visibly move/warp smoothly toward their true positions) rather than snapping instantly at some threshold.
- By around zoom 4-5, UN ClearMap's own tiles are visibly present (more cartographic detail than the flat country fill) and the country vector layers have faded out.
- Zoom in further, past 8 (UN ClearMap's own `maxzoom`) — should behave like a normal over-zoomed raster layer (tiles stretch/pixelate), not break or blank out.

- [ ] **Step 5: Verify the Critical-bug fix (no global maxZoom side effect)**

While the Equal Earth layer is active/default, open the sampling-point or geo-attribute data layers panel if the current survey has one, and click a marker cluster to confirm it still expands into individual markers (not a no-op), and/or use a "fly to record" action if available in the current survey's data. Also confirm the map can be zoomed in/out freely with no artificial ceiling while Equal Earth is selected (mousewheel/±buttons keep working past zoom 4).

- [ ] **Step 6: Verify the record-editing point picker is unaffected**

Open a record with a coordinate/geopoint attribute (in the Data view's record editor, or via the `mapTriggerButton`/`nodeDefGeo` UI) and open its map picker. Confirm it opens on its original default base layer (not "Equal Earth (experimental)") — zoom is unconditionally `3` for both consumers now, so there's no zoom distinction to check here, only the default layer. Confirm Equal Earth is still present and selectable from that picker's own layer switcher (just not the default).

- [ ] **Step 7: Verify attribution**

With the Equal Earth layer active, check the map's attribution control (bottom-right, the small text/"i" control Leaflet renders) includes "Natural Earth" and, once zoomed into the UN ClearMap portion of the blend, the UN Geospatial attribution text.

- [ ] **Step 8: Note results**

No commit for this task (verification only). If any step fails, fix the underlying issue in the relevant earlier task's files and re-commit there before continuing.
