# Equal Earth Base Map Layer (Experiment) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a self-hosted "Equal Earth" base map layer to MapView's layer switcher, selected by default, that visually reproduces the Equal Earth projection at low zoom by warping Natural Earth country geometry so it renders correctly through a standard Web Mercator (Leaflet/MapLibre) pipeline.

**Architecture:** A pure warp function in `core/geo/` (Equal Earth forward projection, then inverse Web Mercator) is applied once, offline, to a Natural Earth countries dataset to produce a static warped GeoJSON asset, served by Arena's own server. A new `EqualEarthBaseLayer.tsx` React component wraps `maplibre-gl` (via `@maplibre/maplibre-gl-leaflet`) using react-leaflet's `createLayerComponent` factory, rendering that asset through a self-hosted MapLibre style, and is registered as the first (default) entry in MapView's existing base layer list.

**Tech Stack:** React, react-leaflet 4.2.1, `@react-leaflet/core` 2.1.0, Leaflet 1.9, MapLibre GL JS 4.7.1, `@maplibre/maplibre-gl-leaflet` 0.1.4, TypeScript (new files), Node 24 (one-off generation script, run directly — no ts-node/build step needed).

## Global Constraints

- Branch: `feat/equal-earth-map` (already checked out).
- New frontend files must be TypeScript (`.ts`/`.tsx`), per explicit user instruction.
- No runtime dependency on `equal.bbox.earth` — self-hosted only.
- This is an experiment: manual browser verification is the acceptance bar for the UI behavior; no e2e/integration tests are added. One pure-function unit test is added for the warp math since it's cheaply and meaningfully testable.
- Design doc: `docs/superpowers/specs/2026-09-08-equal-earth-map-design.md` — out-of-scope items listed there (no labels/glyphs, no state boundaries, no smooth blend, no production cartographic accuracy) still apply.

---

### Task 1: Equal Earth warp math (`core/geo`)

**Files:**
- Create: `core/geo/equalEarthProjection.ts`
- Test: `test/unit/tests/equalEarthProjection.test.js`

**Interfaces:**
- Produces: `projectToEqualEarthMeters({ lon, lat }: { lon: number; lat: number }): { x: number; y: number }`, `unprojectWebMercatorMeters({ x, y }: { x: number; y: number }): { lon: number; lat: number }`, `warpLonLatToEqualEarthInMercator({ lon, lat }: { lon: number; lat: number }): { lon: number; lat: number }` — all exported from `@core/geo/equalEarthProjection`. Task 2 imports `warpLonLatToEqualEarthInMercator`.

- [ ] **Step 1: Write the failing test**

Create `test/unit/tests/equalEarthProjection.test.js`:

```js
import { projectToEqualEarthMeters, warpLonLatToEqualEarthInMercator } from '@core/geo/equalEarthProjection'

describe('equalEarthProjection', () => {
  test('projects the origin (0,0) to (0,0)', () => {
    const { x, y } = projectToEqualEarthMeters({ lon: 0, lat: 0 })
    expect(x).toBeCloseTo(0)
    expect(y).toBeCloseTo(0)
  })

  test('projects the antimeridian at the equator to the expected Equal Earth extent', () => {
    const { x, y } = projectToEqualEarthMeters({ lon: 180, lat: 0 })
    expect(x).toBeCloseTo(17263256.844, 0)
    expect(y).toBeCloseTo(0)
  })

  test('warping and unwarping the origin leaves it unchanged', () => {
    const warped = warpLonLatToEqualEarthInMercator({ lon: 0, lat: 0 })
    expect(warped.lon).toBeCloseTo(0)
    expect(warped.lat).toBeCloseTo(0)
  })

  test('warps a mid-latitude point to the known reference value and keeps it within valid ranges', () => {
    const warped = warpLonLatToEqualEarthInMercator({ lon: 45, lat: 45 })
    expect(warped.lon).toBeCloseTo(33.227383823930545, 6)
    expect(warped.lat).toBeCloseTo(44.13702534320391, 6)
    expect(warped.lon).toBeGreaterThan(-180)
    expect(warped.lon).toBeLessThan(180)
    expect(warped.lat).toBeGreaterThan(-90)
    expect(warped.lat).toBeLessThan(90)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `yarn build:test:unit`
Expected: FAIL — webpack build error, "Can't resolve '@core/geo/equalEarthProjection'" (the module doesn't exist yet).

- [ ] **Step 3: Write the implementation**

Create `core/geo/equalEarthProjection.ts`:

```ts
export interface LonLat {
  lon: number
  lat: number
}

interface MercatorMeters {
  x: number
  y: number
}

// Sphere radius (meters) used by Web Mercator (EPSG:3857). Using the same radius
// for the Equal Earth projection below keeps both projections at a comparable
// scale, which is required for the warp trick in warpLonLatToEqualEarthInMercator.
const WEB_MERCATOR_RADIUS = 6378137

// Equal Earth projection coefficients (Šavrič, Patterson & Jenny, 2018).
const A1 = 1.340264
const A2 = -0.081106
const A3 = 0.000893
const A4 = 0.003796
const SQRT3 = Math.sqrt(3)

const toRadians = (degrees: number): number => (degrees * Math.PI) / 180
const toDegrees = (radians: number): number => (radians * 180) / Math.PI

/**
 * Projects a WGS84 longitude/latitude (degrees) to Equal Earth projected meters.
 */
export const projectToEqualEarthMeters = ({ lon, lat }: LonLat): MercatorMeters => {
  const lambda = toRadians(lon)
  const phi = toRadians(lat)
  const theta = Math.asin((SQRT3 / 2) * Math.sin(phi))
  const theta2 = theta * theta
  const theta6 = theta2 * theta2 * theta2
  const theta8 = theta6 * theta2
  const denominator = 3 * (9 * A4 * theta8 + 7 * A3 * theta6 + 3 * A2 * theta2 + A1)
  const x = (2 * SQRT3 * lambda * Math.cos(theta)) / denominator
  const y = theta * (A4 * theta8 + A3 * theta6 + A2 * theta2 + A1)
  return { x: x * WEB_MERCATOR_RADIUS, y: y * WEB_MERCATOR_RADIUS }
}

/**
 * Inverse Web Mercator (EPSG:3857): converts meters back to a WGS84 longitude/latitude.
 */
export const unprojectWebMercatorMeters = ({ x, y }: MercatorMeters): LonLat => ({
  lon: toDegrees(x / WEB_MERCATOR_RADIUS),
  lat: toDegrees(2 * Math.atan(Math.exp(y / WEB_MERCATOR_RADIUS)) - Math.PI / 2),
})

/**
 * Warps a true WGS84 longitude/latitude so that rendering it through a standard
 * Web Mercator forward projection reproduces the Equal Earth projection. Because
 * forwardMercator(inverseMercator(x, y)) === (x, y), any Mercator-only renderer
 * (Leaflet, MapLibre, etc.) that projects the warped coordinate forward will draw
 * it at the true Equal Earth-projected position.
 */
export const warpLonLatToEqualEarthInMercator = (lonLat: LonLat): LonLat =>
  unprojectWebMercatorMeters(projectToEqualEarthMeters(lonLat))
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `yarn build:test:unit && jest dist/__tests__/bundle.unit.js -t equalEarthProjection`
Expected: PASS, 4 tests passing under "equalEarthProjection".

- [ ] **Step 5: Commit**

```bash
git add core/geo/equalEarthProjection.ts test/unit/tests/equalEarthProjection.test.js
git commit -m "$(cat <<'EOF'
Add Equal Earth / Web Mercator warp projection math

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Generate the self-hosted warped GeoJSON asset and serve it

**Files:**
- Create: `scripts/generate-equal-earth-geojson.ts`
- Create (generated by running the script, then committed): `web-resources/geo/natural-earth-equal-earth-eq2merc.geojson`
- Modify: `server/system/appCluster.js:61-62`
- Modify: `webpack.config.babel.js` (devServer proxy `context` array)

**Interfaces:**
- Consumes: `warpLonLatToEqualEarthInMercator` from `@core/geo/equalEarthProjection` (Task 1). The script uses a relative import (`../core/geo/equalEarthProjection.ts`) since it's run directly with `node`, not through webpack's `@core` alias.
- Produces: a static file served at `/geo/natural-earth-equal-earth-eq2merc.geojson` in both dev (`yarn watch`, port 9000) and prod. Task 3's MapLibre style references this exact URL.

- [ ] **Step 1: Write the generation script**

Create `scripts/generate-equal-earth-geojson.ts`:

```ts
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

import { warpLonLatToEqualEarthInMercator } from '../core/geo/equalEarthProjection.ts'

const SOURCE_URL =
  'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson'
const OUTPUT_PATH = resolve(
  import.meta.dirname,
  '..',
  'web-resources',
  'geo',
  'natural-earth-equal-earth-eq2merc.geojson'
)

type Position = number[]
type CoordinateTree = Position | CoordinateTree[]

const isPosition = (value: CoordinateTree): value is Position =>
  Array.isArray(value) && typeof value[0] === 'number'

const warpCoordinateTree = (coordinates: CoordinateTree): CoordinateTree => {
  if (isPosition(coordinates)) {
    const [lon, lat] = coordinates
    const warped = warpLonLatToEqualEarthInMercator({ lon, lat })
    return [warped.lon, warped.lat]
  }
  return coordinates.map(warpCoordinateTree)
}

interface NaturalEarthFeature {
  type: 'Feature'
  properties: Record<string, unknown>
  geometry: { type: string; coordinates: CoordinateTree }
}

interface NaturalEarthFeatureCollection {
  type: 'FeatureCollection'
  features: NaturalEarthFeature[]
}

const run = async (): Promise<void> => {
  console.log(`Fetching Natural Earth countries data from ${SOURCE_URL}`)
  const response = await fetch(SOURCE_URL)
  if (!response.ok) {
    throw new Error(`Failed to fetch source data: ${response.status} ${response.statusText}`)
  }
  const data = (await response.json()) as NaturalEarthFeatureCollection

  const warpedFeatureCollection = {
    type: 'FeatureCollection',
    features: data.features.map((feature) => ({
      type: 'Feature',
      properties: { admin: feature.properties.ADM0_A3 },
      geometry: {
        type: feature.geometry.type,
        coordinates: warpCoordinateTree(feature.geometry.coordinates),
      },
    })),
  }

  mkdirSync(dirname(OUTPUT_PATH), { recursive: true })
  writeFileSync(OUTPUT_PATH, JSON.stringify(warpedFeatureCollection))
  console.log(`Wrote ${warpedFeatureCollection.features.length} warped country features to ${OUTPUT_PATH}`)
}

run().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
```

- [ ] **Step 2: Run the script and verify the output**

Run: `node scripts/generate-equal-earth-geojson.ts`
Expected: prints `Fetching Natural Earth countries data from https://raw.githubusercontent.com/...` then `Wrote 177 warped country features to .../web-resources/geo/natural-earth-equal-earth-eq2merc.geojson`.

Then verify the file is valid JSON with the expected shape:

Run: `node -e "const fs=require('fs'); const d=JSON.parse(fs.readFileSync('web-resources/geo/natural-earth-equal-earth-eq2merc.geojson','utf8')); console.log(d.type, d.features.length, d.features[0].properties, d.features[0].geometry.type)"`
Expected: `FeatureCollection 177 { admin: '<some ISO A3 code>' } <Polygon or MultiPolygon>`

- [ ] **Step 3: Serve the asset from the server**

In `server/system/appCluster.js`, right after the existing `/img` static mount (currently lines 61-62):

```js
  const imgDir = `${arenaRoot}/web-resources/img`
  app.use('/img', express.static(imgDir))
```

change to:

```js
  const imgDir = `${arenaRoot}/web-resources/img`
  app.use('/img', express.static(imgDir))
  const geoDir = `${arenaRoot}/web-resources/geo`
  app.use('/geo', express.static(geoDir))
```

- [ ] **Step 4: Proxy the new static path in the dev server**

In `webpack.config.babel.js`, find the `devServer.proxy` entry that proxies server-served routes:

```js
      {
        // Proxy all server-served routes:
        context: ['/img', '/api', '/auth', '/socket.io', 'sockjs-node'],
        target: 'http://localhost:9090',
      },
```

change the `context` array to include `/geo`:

```js
      {
        // Proxy all server-served routes:
        context: ['/img', '/geo', '/api', '/auth', '/socket.io', 'sockjs-node'],
        target: 'http://localhost:9090',
      },
```

- [ ] **Step 5: Commit**

```bash
git add scripts/generate-equal-earth-geojson.ts web-resources/geo/natural-earth-equal-earth-eq2merc.geojson server/system/appCluster.js webpack.config.babel.js
git commit -m "$(cat <<'EOF'
Generate and self-host warped Natural Earth GeoJSON for Equal Earth layer

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

(Live verification that `/geo/natural-earth-equal-earth-eq2merc.geojson` is actually reachable over HTTP happens in Task 5, once the server is running.)

---

### Task 3: `EqualEarthBaseLayer` component and MapLibre style

**Files:**
- Modify: `package.json` (add `maplibre-gl` and `@maplibre/maplibre-gl-leaflet` dependencies)
- Create: `webapp/components/MapContainer/equalEarthMapStyle.ts`
- Create: `webapp/components/MapContainer/EqualEarthBaseLayer.tsx`
- Modify: `webapp/components/MapContainer/Map.scss`

**Interfaces:**
- Produces: `EqualEarthBaseLayer` — a react-leaflet layer component (default export style props: `{ style: StyleSpecification } & LayerProps`), usable as the sole child of `<LayersControl.BaseLayer>`, from `@webapp/components/MapContainer/EqualEarthBaseLayer`. `equalEarthMapStyle` — a `StyleSpecification` object — from `@webapp/components/MapContainer/equalEarthMapStyle`. Task 4 imports both.

- [ ] **Step 1: Add the dependencies**

Run: `yarn add maplibre-gl@4.7.1 @maplibre/maplibre-gl-leaflet@0.1.4`
Expected: both added to `dependencies` in `package.json`, `yarn.lock` updated, install succeeds with no peer-dependency errors (`@maplibre/maplibre-gl-leaflet@0.1.4` declares `maplibre-gl: ^2.4.0 || ^3.3.1 || ^4.3.2 || ^5.0.0 || ^6.0.0`, and `4.7.1` satisfies that range).

- [ ] **Step 2: Add the MapLibre style module**

Create `webapp/components/MapContainer/equalEarthMapStyle.ts`:

```ts
import type { StyleSpecification } from 'maplibre-gl'

const COUNTRIES_GEOJSON_URL = '/geo/natural-earth-equal-earth-eq2merc.geojson'

export const equalEarthMapStyle: StyleSpecification = {
  version: 8,
  name: 'equal-earth-experiment',
  sources: {
    countries: {
      type: 'geojson',
      data: COUNTRIES_GEOJSON_URL,
    },
  },
  layers: [
    {
      id: 'background',
      type: 'background',
      paint: { 'background-color': '#eef6fb' },
    },
    {
      id: 'countries-fill',
      type: 'fill',
      source: 'countries',
      paint: { 'fill-color': '#a3cec5', 'fill-opacity': 0.9 },
    },
    {
      id: 'countries-outline',
      type: 'line',
      source: 'countries',
      paint: { 'line-color': '#226688', 'line-width': 0.75 },
    },
  ],
}
```

- [ ] **Step 3: Write the layer component**

Create `webapp/components/MapContainer/EqualEarthBaseLayer.tsx`:

```tsx
import { createElementObject, createLayerComponent, type LayerProps } from '@react-leaflet/core'
import { maplibreGL } from '@maplibre/maplibre-gl-leaflet'
import type { MaplibreGL as MaplibreGLLayer } from 'leaflet'
import type { StyleSpecification } from 'maplibre-gl'

// The warped GeoJSON this layer renders only reads as an Equal Earth
// projection near the world-overview scale; past this zoom the fixed warp
// increasingly diverges from true geography, so zooming further in is capped.
const EQUAL_EARTH_MAX_ZOOM = 2

export interface EqualEarthBaseLayerProps extends LayerProps {
  style: StyleSpecification
}

export const EqualEarthBaseLayer = createLayerComponent<MaplibreGLLayer, EqualEarthBaseLayerProps>(
  function createEqualEarthBaseLayer({ style, ...options }, context) {
    const layer = maplibreGL({ style, ...options })

    layer.on('add', () => {
      const { map } = context
      map.setMaxZoom(EQUAL_EARTH_MAX_ZOOM)
      if (map.getZoom() > EQUAL_EARTH_MAX_ZOOM) {
        map.setZoom(EQUAL_EARTH_MAX_ZOOM)
      }
    })
    layer.on('remove', () => {
      context.map.setMaxZoom(Infinity)
    })

    return createElementObject(layer, context)
  }
)
```

- [ ] **Step 4: Import the MapLibre CSS**

In `webapp/components/MapContainer/Map.scss`, current first line:

```scss
@import 'leaflet/dist/leaflet.css';
```

change to:

```scss
@import 'leaflet/dist/leaflet.css';
@import 'maplibre-gl/dist/maplibre-gl.css';
```

- [ ] **Step 5: Verify types**

Run: `yarn typecheck`
Expected: no new errors from `equalEarthMapStyle.ts` or `EqualEarthBaseLayer.tsx` (pre-existing errors elsewhere in the codebase, if any, are unrelated and unaffected — `strict` is off, so only structural mismatches introduced by these two files matter here).

- [ ] **Step 6: Commit**

```bash
git add package.json yarn.lock webapp/components/MapContainer/equalEarthMapStyle.ts webapp/components/MapContainer/EqualEarthBaseLayer.tsx webapp/components/MapContainer/Map.scss
git commit -m "$(cat <<'EOF'
Add EqualEarthBaseLayer MapLibre GL layer component

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: Register the layer as the default base layer in MapView

**Files:**
- Modify: `webapp/components/MapContainer/baseLayers.js`
- Modify: `webapp/components/MapContainer/MapLayersControl.js`
- Modify: `webapp/components/MapContainer/MapContainer.js`

**Interfaces:**
- Consumes: `EqualEarthBaseLayer` and `equalEarthMapStyle` from Task 3.

- [ ] **Step 1: Add the base layer entry**

In `webapp/components/MapContainer/baseLayers.js`, add the import and provider key. Current top of file:

```js
import * as StringUtils from '@core/stringUtils'

const baseLayerProviders = {
  esri: 'ESRI',
  carto: 'Carto',
  openTopoMap: 'OpenTopoMap',
  openStreetMap: 'OpenStreetMap',
  planet: 'planet',
  un: 'UN',
}
```

change to:

```js
import * as StringUtils from '@core/stringUtils'

import { equalEarthMapStyle } from './equalEarthMapStyle'

const baseLayerProviders = {
  esri: 'ESRI',
  carto: 'Carto',
  openTopoMap: 'OpenTopoMap',
  openStreetMap: 'OpenStreetMap',
  planet: 'planet',
  un: 'UN',
  equalEarth: 'EqualEarth',
}
```

Then, at the start of the `baseLayers` array (current first entry is `key: 'ESRI World Imagery'`), insert a new first entry:

```js
export const baseLayers = [
  {
    key: 'Equal Earth',
    name: 'Equal Earth (experimental)',
    provider: baseLayerProviders.equalEarth,
    type: 'maplibre',
    attribution: 'Natural Earth',
    style: equalEarthMapStyle,
  },
  {
    key: 'ESRI World Imagery',
    ...
```

(leave the rest of the array, including `export const defaultBaseLayer = baseLayers[0]` at the end, unchanged — it now picks up the new entry automatically).

- [ ] **Step 2: Render the MapLibre layer for this entry**

In `webapp/components/MapContainer/MapLayersControl.js`, add the import:

```js
import { baseLayers } from './baseLayers'
```

change to:

```js
import { baseLayers } from './baseLayers'
import { EqualEarthBaseLayer } from './EqualEarthBaseLayer'
```

Then replace the `baseLayersControls` memo body. Current:

```js
  const baseLayersControls = useMemo(() => {
    const result = []
    for (let index = 0; index < baseLayers.length; index++) {
      const baseLayer = baseLayers[index]
      const { key, apiKeyRequired, name, attribution, provider, maxZoom = 17, url } = baseLayer

      const tileUrl = getTileUrl({ url, apiKeyRequired, provider, user })
      if (!tileUrl) {
        continue
      }

      const checked = (!contextBaseLayer && index === 0) || contextBaseLayer?.name === name

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

(Note: the `checked` computation was moved above the `type === 'maplibre'` branch so it applies to both branches; it's otherwise unchanged.)

- [ ] **Step 3: Lower the initial zoom and add MapLibre-recommended map options**

In `webapp/components/MapContainer/MapContainer.js`, current:

```js
const INITIAL_ZOOM_LEVEL = 3
```

change to:

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

and current:

```js
        <RLMapContainer
          center={centerPositionLatLon}
          doubleClickZoom={false}
          zoomControl={false}
          zoom={INITIAL_ZOOM_LEVEL}
        >
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
```

- [ ] **Step 4: Verify types**

Run: `yarn typecheck`
Expected: no new errors.

- [ ] **Step 5: Commit**

```bash
git add webapp/components/MapContainer/baseLayers.js webapp/components/MapContainer/MapLayersControl.js webapp/components/MapContainer/MapContainer.js
git commit -m "$(cat <<'EOF'
Register Equal Earth layer as MapView's default base layer

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: Manual verification

**Files:** none (verification only).

- [ ] **Step 1: Start the app**

Run: `yarn watch`
Expected: webpack dev server starts on port 9000, backend on port 9090, no compile errors.

- [ ] **Step 2: Verify the asset is actually served**

With `yarn watch` running, in another terminal:
Run: `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:9000/geo/natural-earth-equal-earth-eq2merc.geojson`
Expected: `200`

- [ ] **Step 3: Open MapView in the browser and check the default layer**

Log in, open a survey's Data view, switch to Map view (or open a record's geo-point field map). Confirm:
- The map loads at zoom 1, already showing a visibly Equal Earth-shaped world (compressed/curved continent outlines, not the rectangular Mercator look) — not a blank or broken map.
- The layer switcher (top-right) lists "Equal Earth (experimental)" as the checked/selected entry.

- [ ] **Step 4: Verify zoom capping**

Zoom in on the Equal Earth layer past level 2. Confirm the map does not zoom further (stays capped), rather than zooming into a meaningless distorted close-up.

- [ ] **Step 5: Verify switching to other base layers still works**

Select "ESRI World Imagery" (or another existing layer) from the switcher. Confirm it loads normally, and that zoom is no longer capped at 2 (can zoom in past level 2 again). Switch back to "Equal Earth (experimental)" and confirm it re-caps zoom and still renders.

- [ ] **Step 6: Note results**

No commit for this task (verification only). If any step fails, fix the underlying issue in the relevant earlier task's files and re-commit there before continuing.
