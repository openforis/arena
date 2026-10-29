# Multiple areas of interest per survey — design

Follow-up of the single area of interest (AOI) of PR #4588 (plan: `docs/superpowers/plans/2026-10-28-survey-area-of-interest.md`).

## Goal

A survey can define several areas of interest (e.g. one per municipality). Expressions can:

- compute the signed distance from a location to the boundary of a named area;
- find which area contains a location.

The geometries are never embedded in the survey: the survey info only holds descriptors, the geometries are stored as
survey files and fetched on demand, through a provider passed in the expression context.

Out of scope: distance to the union of all the areas; areas defined by the features of a single file; reusing the
preloaded map layers.

## arena-core

### Descriptors

New type `AreaOfInterestDescriptor`:

| prop        | type     | notes                                                                      |
| ----------- | -------- | -------------------------------------------------------------------------- |
| `name`      | string   | identifier used in expressions, unique in the survey, node def name rules |
| `labels`    | Labels   | optional                                                                   |
| `fileUuid`  | string   | uuid of the survey file with the geometry                                  |
| `fileName`  | string   | name of the file uploaded                                                  |
| `size`      | number   | file size (bytes)                                                          |
| `polygons`  | number   | summary                                                                    |
| `vertices`  | number   | summary                                                                    |

- `SurveyProps.areasOfInterest?: AreaOfInterestDescriptor[]`; the list order is the priority of the areas.
- `Surveys.getAreasOfInterest(survey)`: reads `survey.props.areasOfInterest`, falling back to
  `survey.info.props.areasOfInterest` (Arena); `[]` when not defined.
- Removed (never released in Arena): `SurveyProps.areaOfInterest` and `Surveys.getAreaOfInterest`.
  The `AreaOfInterest` type (`Polygon | MultiPolygon`) stays.

### Provider

```ts
export interface AreaOfInterestProvider {
  getAreaOfInterest: (params: { survey: Survey; name: string }) => Promise<AreaOfInterest | undefined>
}
```

- Added as optional `areaOfInterestProvider` to `NodeDefExpressionContext` and to the record expression evaluation
  context, next to `categoryItemProvider` / `taxonProvider`, and passed through the same paths: record nodes updater
  (default values, applicability, enumerated entities, code attributes), record validator (attribute validations).
- The custom function executors may return a Promise: the call evaluator awaits it.

### Functions

- `geoDistanceToAOIBoundary(coordinate, areaName)` (arity 2): signed distance in meters to the boundary of the area,
  negative inside. `null` when the provider is missing, the area is unknown / not available, or the coordinate is
  invalid.
- `geoAOIContaining(coordinate)` (arity 1): name of the first area (descriptors order) whose geometry contains the
  coordinate (distance ≤ 0); `null` when none, when the provider is missing or the coordinate is invalid.

### Expression validation

When the `areaName` argument of `geoDistanceToAOIBoundary` is a string literal not matching any descriptor name, the
expression validator reports an error (new message key, e.g. `expression.areaOfInterestNotFound`). Renaming an area
does not rewrite the expressions: they become invalid and the designer fixes them.

### Tests

Functions with a fake provider: inside / outside / near boundary, unknown area, missing provider, invalid coordinate,
overlapping areas (first in list wins), no area containing the coordinate; validation of an unknown area name.

## Arena

### Survey info

- Info prop `areasOfInterest`: list of `AreaOfInterestDescriptor` (replaces `areaOfInterestFile`).
- Each area is a survey file of type `areaOfInterest` (as now).
- Validation (`surveyInfoValidator`): names required, valid identifiers, unique; file required.
- The temporary flag of every referenced file is cleared on survey props save; the unreferenced files are deleted on
  publish (`deleteUnusedSurveyFilesByType`, as now).

### Server provider

`server/modules/survey/manager/areaOfInterestProviderDefault.ts`:

- resolves the descriptor by name (`Surveys.getAreasOfInterest`), loads the file content
  (`SurveyFileManager.fetchFileContentAsBuffer`) and parses it (`parseAreaOfInterestJson`);
- caches the parsed geometry by `surveyId` + `fileUuid` (LRU, bounded): a file is never modified (a new upload gets a
  new uuid), so the cache needs no invalidation;
- logs a warning and returns `undefined` when the file is missing or invalid.

It is passed wherever `CategoryItemProviderDefault` is passed for record evaluation (`nodeUpdateManager`,
`recordValidationManager`, `recordCreationManager`, `recordUpdateManager`, `recordService`, `recordsCombiner`, data
imports: flat data, Arena Mobile, Collect, ODK; `PersistResultsJob`, ...).

Removed: the `includeAreaOfInterest` option of the survey fetch, `surveyAreaOfInterestManager` and the in-memory
injection of the geometry into the survey info.

### Export / import / clone / mobile package / compare / fingerprint

- Export / import / clone: every AOI file (type `areaOfInterest`), as now.
- Mobile package: every AOI file as `surveyfiles/<fileUuid>.bin`.
- Survey compare: AOIs become a list kind (like the preloaded map layers), matched by area name; the normalized value
  is labels + size + polygons + vertices (not the file uuid); the apply plan sets `areasOfInterest` with the new file
  uuids.
- Fingerprint: the descriptors without `fileUuid`.

### Webapp

- Survey info → Map: "Areas of interest" table (name, label, file, polygons, vertices; add, edit, delete, download),
  like `PreloadedMapLayersEditor`. Add / edit dialog: name, labels, GeoJSON dropzone (max 10 MB); the GeoJSON is
  validated and normalized in the browser and uploaded as a temporary survey file (as now).
- Expression editor:
  - `geoDistanceToAOIBoundary`: coordinate attribute + area name (dropdown of the descriptor names); warning when the
    survey has no areas;
  - `geoAOIContaining`: coordinate attribute.
  - Function names, examples and descriptions in all the languages.

### Tests

- Unit: survey compare (AOI list diff, rename, apply plan), fingerprint, mobile package with two areas, info validator.
- Integration: two areas evaluated through the server provider (`geoDistanceToAOIBoundary` and `geoAOIContaining`,
  overlap order); invalid upload rejected; export / import / clone of two AOI files.
- E2E: `areaOfInterest.spec.ts` updated (area name in the expression; add / edit / delete of an area in the table).

## Arena Mobile (follow-up PR, after openforis/arena-mobile#289)

Provider reading `surveyfiles/<fileUuid>.bin` from the survey package folder, parsed and cached by file uuid, passed in
the record update / validation context. Nothing is added to the survey JSON.

## Order of work

1. arena-core PR (descriptors, provider, functions, validation) and release.
2. Arena: update #4588 (depends on the arena-core release).
3. Arena Mobile follow-up.
