# Category GeoPackage Export

## Purpose

Categories can already carry geolocation data via an extra-property
`dataType` of `geometryPoint` (`core/survey/extraPropDef.js`), and category
CSV/XLSX export already knows how to flatten such a property into
`<name>_x`, `<name>_y`, `<name>_srs` columns
(`core/survey/categoryExportFile.js`). The `sampling_point_data` category
convention (a category literally named `sampling_point_data`, with a
`location` extra prop of that type) already relies on this. None of that
data can currently be exported as a GIS file usable directly in QGIS or
QField — CSV with flattened x/y/srs columns requires a manual re-join step
in GIS software. This spec adds a `.gpkg` (OGC GeoPackage) export for a
single category, plus a category-creation/conversion UX that makes it easy
to set a category up with the right extra-property shape in the first
place.

## Scope

1. Generalize the "locked extra prop" mechanism already used (in one
   hardcoded form) for `reportingData` categories, so it can protect the
   `location` extra prop on the two new category templates too.
2. Add a category-creation menu (Simple / Sampling point data /
   GeoPackage) plus later "convert existing category to X" actions for the
   two special templates, mirroring the existing "convert to reporting
   data" flow.
3. Add a `.gpkg` export action for any category carrying a `location`
   extra prop, implemented as a background Job producing a downloadable
   GeoPackage file with one feature layer, geometry reprojected to
   EPSG:4326.

## Non-goals

- No change to how `sampling_point_data` categories are consumed
  downstream (map layer, record creation from sampling points) — this
  spec only touches how such categories can be *created* and *exported*.
- No support for exporting multiple categories to one `.gpkg` (each
  export produces one file for one category, matching the existing
  single-category CSV/XLSX export, not the all-categories ZIP job).
- No support for non-point geometry types (line/polygon) — `geometryPoint`
  is the only extra-prop geometry `dataType` that exists today.
- No PostGIS involvement — this app stores geometry as text/JSONB
  everywhere already (see `core/geo/srs.ts`,
  `server/modules/geo/service/GeoJsonDataExportJob.js`); the GeoPackage
  file itself is the only place real OGC geometry gets constructed.

## 1. Generalized locked extra-prop flag

`core/survey/extraPropDef.js`: add a `locked` boolean field to an
extra-prop-def entry (alongside `dataType`/`index`), default `false`, with
a `isLocked` accessor.

`core/survey/category.js`: replace the hardcoded

```js
export const isExtraPropDefReadOnly = (extraPropDef) => (category) =>
  isReportingData(category) && ExtraPropDef.getName(extraPropDef) === reportingDataItemExtraDefKeys.area
```

with a check against the flag itself:

```js
export const isExtraPropDefReadOnly = (extraPropDef) => () => ExtraPropDef.isLocked(extraPropDef)
```

`categoryManager.convertCategoryToReportingData` (the existing conversion
function, `server/modules/category/manager/categoryManager.js`) sets
`locked: true` when it injects the `area` extra prop def, so existing
behavior for reporting-data categories is unchanged. The webapp already
wires `isExtraPropDefReadOnly` generically through
`ExtraPropDefsEditorPanel`/`ExtraPropDefEditor.js` (disables name/dataType
editing and delete) — no UI change needed there beyond it now also firing
for the new templates' `location` prop when locked.

A category is not tagged with a persistent "type" enum. Whether a category
is usable as a "GeoPackage category" is fully derived: it has an extra-prop
def named `location` with `dataType: geometryPoint`. This can't drift out
of sync the way a stored flag could (e.g. if the prop is later deleted).
`sampling_point_data` identity remains name-based, unchanged from today.

## 2. Category creation menu

`webapp/components/survey/CategoryList/TableHeaderLeft/TableHeaderLeft.js`
currently renders a single `ButtonMetaItemAdd` for categories. Replace it
with a `ButtonMenu` (same component already used in
`CategoryDetails.js`'s gear menu) offering three items:

- **Simple category** — today's behavior unchanged: `API.createCategory`
  with no extra props.
- **Sampling point data category** — disabled (with a tooltip) if
  `Survey.getSamplingPointDataCategory(survey)` already returns one. On
  click, opens a confirm dialog with a "Lock fixed properties" checkbox
  (default checked), then calls a new endpoint that creates the category
  named `sampling_point_data` with a `location` (`geometryPoint`) extra
  prop, `locked` per the checkbox.
- **GeoPackage category** — always enabled, multiple per survey allowed.
  Same confirm dialog, then creates a category the same way "Simple" does
  today (same default name/rename flow, unchanged), plus a `location`
  (`geometryPoint`) extra prop, `locked` per the checkbox.

Both special-case creations reuse the existing category-creation call
followed by the same server-side update path the extra-props editor
already uses to add an extra-prop def to a category (whatever that turns
out to be at implementation time — the point is no new "create" primitive
is needed, just create-then-add-one-extra-def); the client-observable
difference from "Simple" is just that these two pre-populate the extra
def before returning.

## 3. Convert existing category

`webapp/components/survey/CategoryDetails/CategoryDetails.js`'s gear
`ButtonMenu` currently offers "convert to reporting data" only (hidden
once already reporting data). Add two more conditional items:

- **Convert to sampling point data** — hidden if this category is already
  named `sampling_point_data`, or if another category in the survey
  already has that name.
- **Convert to GeoPackage category** — hidden if this category already has
  a `location` extra prop of type `geometryPoint`.

Both reuse the existing confirm-dialog pattern
(`useConvertToReportingDataCategory.js` is the template to copy) with the
same lock checkbox, calling two new endpoints:

```
PUT /survey/:surveyId/categories/:categoryUuid/convertToSamplingPointData
PUT /survey/:surveyId/categories/:categoryUuid/convertToGeoPackage
```

Server-side (`categoryManager.js`, alongside
`convertCategoryToReportingData`):

- `convertCategoryToGeoPackage({ user, surveyId, categoryUuid, locked })`:
  add the `location` extra prop def (`geometryPoint`, `locked`) if not
  already present; no rename, no level normalization (unlike
  `convertCategoryToReportingData`, which also renames levels — that
  behavior is specific to reporting data and not replicated here).
- `convertCategoryToSamplingPointData({ user, surveyId, categoryUuid, locked })`:
  same extra-prop-def injection, plus renames the category to
  `sampling_point_data`. Rejected (400) if another category in the survey
  already has that name.

Both log an activity-log entry, matching
`categoryConvertToReportingData`'s convention
(`categoryConvertToSamplingPointData`, `categoryConvertToGeoPackage`).

There is no "convert back" action for either (matches: reporting data's
own revert is a simple prop flip client-side with no server call and no
extra-def removal; the new templates have no persistent flag to flip, so
"reverting" is just deleting the `location` extra prop via the existing
extra-props editor, once unlocked).

## 4. GeoPackage file export

### Trigger and availability

`CategoryDetails.js`'s existing export menu (currently CSV/XLSX via
`fileFormat`) gets a third option, **GeoPackage**, enabled only when
`Category.getItemExtraDefsArray(category)` contains a `location` /
`geometryPoint` entry. Add `gpkg` to `core/fileFormats.ts`'s `FileFormats`.

### Why a background Job, not the direct-stream path

`categoryService.exportCategory` today streams CSV/XLSX straight to the
HTTP response. A `.gpkg` file is a binary SQLite database that must be
fully assembled (its own internal tables/indexes) before it's valid, so it
follows the existing job + temp-file + download-endpoint pattern used by
`CategoriesExportJob` (zip) and `GeoJsonDataExportJob` (the closest
existing analog — same reprojection step, same temp-file/download
mechanics).

### New job: `CategoryGeoPackageExportJob`

`server/modules/category/service/CategoryGeoPackageExportJob.js`:

1. Fetch the category and its `location` extra-prop def; 400 via the API
   layer beforehand if absent (mirrors today's validation style — checked
   at the API/service boundary, not inside the job).
2. Stream category items via the existing
   `categoryExportRepository.generateCategoryExportQuery` (reused
   as-is — same query already used by CSV/XLSX export), filtered to leaf
   level only (`Category.getLevelsArray` last level) — GeoPackage export
   targets flat point layers, consistent with how `sampling_point_data`
   categories are always single-level in practice; ancestor-level data (if
   the category has levels above the leaf) is not included as separate
   features, only the leaf item's own code/labels/extra props.
3. For each item:
   - Parse the `location` value with `Points.parse` (from
     `@openforis/arena-core`, same package used by
     `GeoJsonDataExportJob`/`categoryExportManager`).
   - Reproject to EPSG:4326 via `Points.toLatLong(point, srsIndex)` (same
     helper `GeoJsonDataExportJob` already calls, `srsIndex` from
     `Survey.getSRSIndex(survey)`).
   - Skip the item (increment a `skippedItems` counter on the job) if the
     value is missing or `Points.parse`/`toLatLong` throws — export
     continues for the remaining items.
   - Attribute columns: item `code`, one column per survey language for
     the item label, then every other extra prop def — reusing
     `CategoryExportFile.getExtraPropHeaders` for column naming, so any
     *other* `geometryPoint` extra prop on the same category (unusual, but
     not disallowed) is flattened to `<name>_x/_y/_srs` attribute columns
     exactly as CSV export does, rather than becoming a second geometry
     column (GeoPackage feature tables have exactly one geometry column).
4. Write a single feature table, named after the category (sanitized to a
   valid GeoPackage table identifier), geometry type `POINT`, SRS
   `EPSG:4326`, using `@ngageoint/geopackage` (new dependency — see
   below) to a temp file (`FileUtils.newTempFileName`/`tempFilePath`,
   same convention as `CategoriesExportJob`).
5. `beforeSuccess()` sets `{ tempFileName, skippedItems }` as the job
   result, so the webapp can surface a "N items skipped (missing
   location)" note alongside the download button.

### New dependency: `@ngageoint/geopackage`

No GeoPackage/shapefile/GDAL library exists in this repo today (confirmed
by dependency search). `@ngageoint/geopackage` is added to
`package.json`: pure JS/TS, no native binary, so it fits the existing
Node/Docker deployment without adding GDAL to the image (the alternative,
shelling out to `ogr2ogr`, was considered and rejected for that reason —
no precedent for a native GIS toolchain dependency in this codebase).

### Routes

`server/modules/category/api/categoryApi.js`, mirroring the all-categories
export job's start/download pair:

```
POST /survey/:surveyId/categories/:categoryUuid/export/geopackage
  → CategoryService.exportCategoryToGeoPackage enqueues the job, returns { job }

GET  /survey/:surveyId/categories/:categoryUuid/export/geopackage/download
  → downloads the temp file; Response.contentTypes gets a new `gpkg` entry
    (`application/geopackage+sqlite3`)
```

### Webapp

`webapp/service/api/categories/index.js` gets
`startExportCategoryToGeoPackageJob`; the export menu's GeoPackage item
follows the same `JobActions.showJobMonitor` + `ButtonDownload` pattern as
`useExportAll.js`, scoped to the single category.

## Testing

- Unit: `ExtraPropDef.isLocked`, generalized `Category.isExtraPropDefReadOnly`.
- Unit: the point-parsing/reprojection/skip-counting step of
  `CategoryGeoPackageExportJob`, extracted as a pure function taking a row
  and returning either a feature or `null`, so it's testable without a
  real database or GeoPackage file.
- Integration: `convertCategoryToGeoPackage` /
  `convertCategoryToSamplingPointData` endpoints — extra prop injected
  correctly, locked flag respected, sampling-point-data rename conflict
  rejected with 400.
- Integration: export job produces a valid `.gpkg` — validated by reading
  it back with `@ngageoint/geopackage`'s own reader API and asserting
  feature count and attribute columns against a fixture category.
- Manual: create a GeoPackage category via the UI, add items with
  `location` values, export, open the resulting file in QGIS to confirm
  points render correctly.
