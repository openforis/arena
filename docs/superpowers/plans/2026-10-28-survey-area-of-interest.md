# Survey Area of Interest (AOI) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let survey designers define an Area of Interest (AOI) polygon in the survey info (Map section) and expose a new expression function `geoDistanceToAOIBoundary(coordinate)` returning the signed distance (meters) between a coordinate and the AOI boundary, usable in default values and validation rules, also offline in Arena Mobile.

**Requested by:** ASSEDEV (Alerte Environnement project): citizens report illegal waste dumping with Arena Mobile; reports outside the pilot area, or too close to its boundary for the GPS accuracy, must be flagged with non-blocking warnings and the result stored with each report. ASSEDEV must be credited in the changelog and in the "What's new" panel.

**Architecture:** The AOI is stored as a GeoJSON geometry (`Polygon` or `MultiPolygon`, WGS84) in the survey props (`props.areaOfInterest`), so it travels with the survey definition to the server, the web app and Arena Mobile (offline). The distance is computed synchronously in `@openforis/arena-core` with `@turf/point-to-polygon-distance` (pure JS), after converting the coordinate to WGS84 with `Points.toLatLong`. The function returns only a number: inside/outside/uncertain classification is left to the survey designer (read-only attributes + validation rules), keeping expressions simple.

**Tech Stack:** TypeScript, `@openforis/arena-core` (expression evaluator, geo utils), turf 7.4, React (Survey info form), Jest.

## Global Constraints

- Function name: `geoDistanceToAOIBoundary`, 1 argument (coordinate attribute or point / point string).
- Sign convention: **negative inside the AOI, positive outside**, in meters.
- Distance method: turf `planar` (edges are straight lines, as in GeoJSON and on the map, consistent with the inside/outside test).
- Returns `null` when the coordinate is empty/invalid, the survey has no AOI, or the AOI geometry is invalid (never throws during evaluation).
- AOI geometry: GeoJSON `Polygon` or `MultiPolygon` in WGS84 (EPSG:4326), stored in survey props key `areaOfInterest`.
- turf packages at `^7.4.0` (same as the ones already used in arena-core and arena).
- `@openforis/arena-core` must resolve to a single version in arena (`yarn dedupe @openforis/arena-core`).
- New arena files in TypeScript; cognitive complexity ≤ 15; `for...of` instead of `forEach`; no hard-coded colors.

## Intended usage (documentation for survey designers)

```
aoi_distance (read-only decimal, default value):  geoDistanceToAOIBoundary(location)
aoi_status (read-only code attribute, category codes inside/outside/uncertain), default values:
  'inside'     apply if  aoi_distance < -location.accuracy
  'outside'    apply if  aoi_distance > location.accuracy
  'uncertain'  apply if  Math.abs(aoi_distance) <= location.accuracy
validation rules on aoi_status (severity: warning):
  aoi_status != 'outside'     "Report outside the pilot area"
  aoi_status != 'uncertain'   "Improve the GPS accuracy of the location"
```

Notes: `location.accuracy` is already accessible in expressions (coordinate value prop); the coordinate attribute must have "include accuracy" enabled; do not use "apply once" on these attributes (the status must be updated when the location is improved).

---

## Part 1: arena-core (repo `openforis/arena-core`, branch `geo-distance-to-aoi-boundary`)

**Status:** implemented in openforis/arena-core#490 (waiting for review/merge and release).

### File structure

- Modify `package.json`: add `@turf/point-to-polygon-distance@^7.4.0`, `@types/geojson@^7946.0.16` (types used in the public API).
- Create `src/geo/areaOfInterest.ts`: `AreaOfInterest` type.
- Modify `src/geo/index.ts`: export `AreaOfInterest`.
- Create `src/geo/points/distanceToPolygonBoundary.ts`: signed distance helper.
- Modify `src/geo/points/index.ts`: add `Points.distanceToPolygonBoundary`.
- Modify `src/geo/points.test.ts`: tests for the helper.
- Modify `src/survey/survey.ts`: `SurveyProps.areaOfInterest?: AreaOfInterest`.
- Modify `src/survey/surveys/surveysGetters.ts` and `src/survey/surveys/index.ts`: `Surveys.getAreaOfInterest`.
- Modify `src/nodeDefExpressionEvaluator/functions.ts`: `geoDistanceToAOIBoundary` (inherited by `recordExpressionFunctions`).
- Create `src/record/recordExpressionEvaluator/geoDistanceToAOIBoundary.test.ts`: expression tests.

### Task 1: Signed distance from a point to a polygon boundary

**Interfaces:**

- Produces: `type AreaOfInterest = Polygon | MultiPolygon` (from `geojson`), exported from `src/geo`;
  `Points.distanceToPolygonBoundary(point: Point, polygon: AreaOfInterest, srsIndex?: SRSIndex): number | null`.

- [x] **Step 1: Write the failing tests** in `src/geo/points.test.ts`

```ts
describe('Points.distanceToPolygonBoundary', () => {
  // square around Rome (lon 12.4..12.6, lat 41.8..42.0)
  const polygon: AreaOfInterest = {
    type: 'Polygon',
    coordinates: [
      [
        [12.4, 41.8],
        [12.6, 41.8],
        [12.6, 42.0],
        [12.4, 42.0],
        [12.4, 41.8],
      ],
    ],
  }

  test('negative distance for a point inside', () => {
    const point = PointFactory.createInstance({ x: 12.401, y: 41.9 })
    const distance = Points.distanceToPolygonBoundary(point, polygon)
    // 0.001 degrees of longitude at lat 41.9 ≈ 83 m
    expect(distance).toBeLessThan(-80)
    expect(distance).toBeGreaterThan(-86)
  })

  test('positive distance for a point outside', () => {
    const point = PointFactory.createInstance({ x: 12.5, y: 42.001 })
    const distance = Points.distanceToPolygonBoundary(point, polygon)
    // 0.001 degrees of latitude ≈ 111 m
    expect(distance).toBeGreaterThan(108)
    expect(distance).toBeLessThan(114)
  })

  test('multi polygon: distance to the nearest polygon', () => {
    const multiPolygon: AreaOfInterest = {
      type: 'MultiPolygon',
      coordinates: [
        polygon.coordinates as any,
        [
          [
            [13, 41.8],
            [13.2, 41.8],
            [13.2, 42],
            [13, 42],
            [13, 41.8],
          ],
        ],
      ],
    }
    const point = PointFactory.createInstance({ x: 13.001, y: 41.9 })
    expect(Points.distanceToPolygonBoundary(point, multiPolygon)).toBeLessThan(0)
  })

  test('point in a different SRS is converted to lat/long', () => {
    const point = Points.transform(PointFactory.createInstance({ x: 12.401, y: 41.9 }), utm33N.code, srsIndex)!
    const distance = Points.distanceToPolygonBoundary(point, polygon, srsIndex)
    expect(distance).toBeLessThan(-80)
    expect(distance).toBeGreaterThan(-86)
  })

  test('invalid polygon or point => null', () => {
    const point = PointFactory.createInstance({ x: 12.5, y: 41.9 })
    expect(Points.distanceToPolygonBoundary(point, { type: 'Polygon', coordinates: [] })).toBeNull()
    expect(Points.distanceToPolygonBoundary({ ...point, srs: '99999' }, polygon)).toBeNull()
  })
})
```

(`utm33N` / `srsIndex`: move the constants of the existing `Points.transform` describe block to file level so both blocks use them.)

- [x] **Step 2: Run** `yarn jest src/geo/points.test.ts` → FAIL (`distanceToPolygonBoundary` is not a function).

- [x] **Step 3: Implement**

`src/geo/areaOfInterest.ts`:

```ts
import type { MultiPolygon, Polygon } from 'geojson'

/**
 * Area of interest of a survey: GeoJSON polygon or multi polygon geometry in WGS84 (EPSG:4326).
 */
export type AreaOfInterest = Polygon | MultiPolygon
```

`src/geo/points/distanceToPolygonBoundary.ts`:

```ts
import pointToPolygonDistance from '@turf/point-to-polygon-distance'

import { DEFAULT_SRS_INDEX, SRSIndex } from '../../srs'
import { AreaOfInterest } from '../areaOfInterest'
import { Point } from '../point'
import { toLatLong } from './toLatLong'

/**
 * Returns the distance (in meters) between a point and the boundary of a polygon: negative inside, positive outside.
 *
 * @param {!Point} point - The point.
 * @param {!AreaOfInterest} polygon - Polygon or multi polygon in WGS84.
 * @param {!SRSIndex} srsIndex - SRSs indexed by SRS code.
 * @returns {number|null} - The signed distance in meters, or null if the point or the polygon are not valid.
 */
export const distanceToPolygonBoundary = (
  point: Point,
  polygon: AreaOfInterest,
  srsIndex: SRSIndex = DEFAULT_SRS_INDEX
): number | null => {
  const pointLatLong = toLatLong(point, srsIndex)
  if (!pointLatLong) return null
  try {
    // turf expects [longitude, latitude]; planar: polygon edges are straight lines (as in GeoJSON and on the map),
    // consistent with the inside/outside check (geodesic would measure to great-circle edges)
    return pointToPolygonDistance([pointLatLong.x, pointLatLong.y], polygon, { units: 'meters', method: 'planar' })
  } catch {
    // invalid polygon geometry
    return null
  }
}
```

Export it in `Points` (`src/geo/points/index.ts`) and `AreaOfInterest` in `src/geo/index.ts` (`export type { AreaOfInterest } from './areaOfInterest'`).

- [x] **Step 4: Run** `yarn jest src/geo/points.test.ts` → PASS.
- [x] **Step 5: Commit** `feat: Points.distanceToPolygonBoundary (signed distance to a polygon boundary)`.

### Task 2: AOI in survey props + `geoDistanceToAOIBoundary` expression function

**Interfaces:**

- Consumes: `AreaOfInterest`, `Points.distanceToPolygonBoundary` (Task 1).
- Produces: `SurveyProps.areaOfInterest?: AreaOfInterest`; `Surveys.getAreaOfInterest(survey: Survey): AreaOfInterest | undefined`;
  expression function `geoDistanceToAOIBoundary(coordinate)` → `number | null`.

- [x] **Step 1: Write the failing tests** in `src/record/recordExpressionEvaluator/geoDistanceToAOIBoundary.test.ts`.
      Test survey/record from `src/tests/data` (`cluster_location` = 41.883012, 12.489056; `plot[2].plot_location` = 42.00548, 12.89963),
      survey with `props.areaOfInterest` = square lon 41.8..42.0, lat 12.4..12.6. Cases:
  - `geoDistanceToAOIBoundary(cluster_location)` → negative (≈ -9 km: nearest edge is lon 41.8);
  - `geoDistanceToAOIBoundary(plot[2].plot_location)` → positive (≈ 33 km north of lat 12.6);
  - `geoDistanceToAOIBoundary('SRID=EPSG:4326;POINT(41.9 12.5)')` → negative;
  - `geoDistanceToAOIBoundary(cluster_location) < -cluster_location.accuracy` style comparisons evaluate without errors;
  - survey without AOI → `null`; `geoDistanceToAOIBoundary(remarks)` (not a coordinate) → `null`;
  - `geoDistanceToAOIBoundary()` → error (missing parameters, arity).
- [x] **Step 2: Run** `yarn jest src/record/recordExpressionEvaluator/geoDistanceToAOIBoundary.test.ts` → FAIL.
- [x] **Step 3: Implement**

`src/survey/survey.ts` (`SurveyProps`): `areaOfInterest?: AreaOfInterest`.

`src/survey/surveys/surveysGetters.ts`:

```ts
export const getAreaOfInterest = (survey: Survey): AreaOfInterest | undefined => survey?.props?.areaOfInterest
```

add to `Surveys` in `src/survey/surveys/index.ts`.

`src/nodeDefExpressionEvaluator/functions.ts`:

```ts
  geoDistanceToAOIBoundary: {
    minArity: 1,
    maxArity: 1,
    executor:
      (context: NodeDefExpressionContext) =>
      (coordinate: Point | string): number | null => {
        const { survey } = context
        const areaOfInterest = getAreaOfInterest(survey)
        const point = Points.parse(coordinate)
        if (!areaOfInterest || !point) return null
        return Points.distanceToPolygonBoundary(point, areaOfInterest, getSRSIndex(survey))
      },
  },
```

- [x] **Step 4: Run** the new test file and the whole suite (`yarn test`), plus `yarn build` (tsc) → PASS.
- [x] **Step 5: Commit** `feat: geoDistanceToAOIBoundary expression function and survey areaOfInterest prop`.
- [x] **Step 6: Push and open the PR** (`gh pr create`), crediting ASSEDEV in the description. After merge, the CI bumps the version (expected 2.13.0) and publishes the package.

---

## Part 2: arena (repo `openforis/arena`, branch `survey-area-of-interest`)

### Task 3: arena-core bump and survey info prop

**Files:** `package.json`, `yarn.lock`, `core/survey/_survey/surveyInfo.ts`, `core/survey/survey.js`, `core/survey/surveyCompare/surveyFingerprint.ts`.

- [ ] Bump `@openforis/arena-core` to the released version (and `@openforis/arena-server` if it requires it), `yarn dedupe @openforis/arena-core`.
- [ ] `surveyInfo.ts`: `keys.areaOfInterest: 'areaOfInterest'`; `export const getAreaOfInterest = ObjectUtils.getProp(keys.areaOfInterest, null)`; expose `Survey.getAreaOfInterest` in `core/survey/survey.js`.
- [ ] `surveyFingerprint.ts`: add `infoKeys.areaOfInterest` to the compared info keys, so survey compare / publish warnings detect AOI changes.
- [ ] Check the survey export/import (Arena format) and Arena Mobile survey download keep `props.areaOfInterest` (props are copied as a whole: verify with an integration test of export → import).
- [ ] Commit `Survey info: areaOfInterest prop, arena-core bump`.

### Task 4: AOI editor in Survey info → Map

**Files:**

- Create `core/geo/areaOfInterestParser.ts`: `parseAreaOfInterest(geoJson: unknown): AreaOfInterest | null` — accepts a `Polygon`/`MultiPolygon` geometry, a `Feature`, or a `FeatureCollection` of polygon features (merged into a `MultiPolygon`); returns null for anything else.
- Create `test/unit/geo/areaOfInterestParser.test.ts`: polygon, multipolygon, feature, feature collection (mixed with points → only polygons kept), invalid input → null.
- Create `webapp/views/App/views/Home/SurveyInfo/AreaOfInterestEditor.tsx`: Dropzone (`.geojson`, max 1 MB, like `PreloadedMapLayerEditor`), shows the number of polygons / vertices, a small map preview (reuse `MapContainer` with a GeoJSON layer), "Remove" button; read-only when the user cannot edit the survey.
- Modify `SurveyInfoMap.js`, `store/useSurveyInfoForm.js`: `areaOfInterest` value and `setAreaOfInterest = (value) => setObjectField(Survey.infoKeys.areaOfInterest, value)`.
- Modify `core/i18n/resources/en/homeView.js` (+ other languages): labels `surveyInfo.areaOfInterest.*` (title, upload hint, invalid file, remove, info text explaining `geoDistanceToAOIBoundary`).
- Server: validate the prop on survey info update (`server/modules/survey/...` validator): must parse with `parseAreaOfInterest`, size limit.

- [ ] Write the parser unit tests (failing), implement the parser, run `yarn test:unit` → PASS, commit.
- [ ] Implement the editor + form wiring, check with `yarn watch` (upload, preview, remove, save, reload), run `yarn typecheck` and eslint, commit.
- [ ] (Follow-up, optional) KML upload, converting with the existing Leaflet KML support (`webapp/components/MapContainer/L.KML.js`) to GeoJSON.

### Task 5: Expression editor support

**Files:** `core/expressionParser/helpers/functions.ts`, `webapp/components/expression/functionExamples.js`, `core/i18n/resources/*/nodeDefEdit.js`.

- [ ] Add `geoDistanceToAOIBoundary: 'geoDistanceToAOIBoundary'` to the function names.
- [ ] Example: `geoDistanceToAOIBoundary(coordinate_attribute) (negative inside the area of interest, positive outside)`.
- [ ] Description (en): `Returns the distance in meters between a coordinate and the boundary of the survey area of interest (negative inside, positive outside)`; translate in the other languages.
- [ ] Verify the function is offered in the advanced expression editor (autocomplete) and in the simple editor function list, if applicable (`webapp/components/expression/nodes/call/functions.js`).
- [ ] Commit.

### Task 6: Release notes, credit to ASSEDEV

- [ ] `CHANGELOG.md`: entry like "survey info: area of interest (AOI) polygon and new expression function `geoDistanceToAOIBoundary`, to check if a location is inside the area also offline in Arena Mobile (requested by ASSEDEV – Alerte Environnement) (#PR)".
- [ ] `core/whatsNew/whatsNewItems.ts`: new item with the same content and the credit to ASSEDEV; translations.
- [ ] Commit, open the PR, address the GitHub findings.

---

## Part 3: arena-mobile

### Task 7: arena-core bump

- [ ] Bump `@openforis/arena-core` to the release containing `geoDistanceToAOIBoundary`.
- [ ] Test offline: download a survey with AOI + the attributes of "Intended usage", turn off the connection, enter locations inside / outside / near the boundary, check the warnings and the stored values, then sync and check them in Arena.
- [ ] (Optional) show the AOI on the location map.
