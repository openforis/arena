# Multiple areas of interest per survey Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A survey defines several named areas of interest (AOIs); expressions compute the distance to a named area
(`geoDistanceToAOIBoundary(location, 'name')`) and find the area containing a location (`geoAOIContaining(location)`).

**Architecture:** The survey info only holds AOI descriptors (name, labels, file uuid, summary). The geometries are
survey files, fetched on demand by an `AreaOfInterestProvider` passed in the arena-core expression context, like the
existing `categoryItemProvider`. The server provider caches the parsed geometries by file uuid.

**Tech Stack:** arena-core (TypeScript, Jest), Arena (Node/Express, React, pg-promise, Jest bundled with webpack,
Playwright).

Spec: `docs/superpowers/specs/2026-10-29-survey-multiple-areas-of-interest-design.md`.

## Global Constraints

- arena-core changes go first (repo `../arena-core`, new branch `areas-of-interest` from `origin/master`); Arena
  (branch `survey-area-of-interest`, PR #4588) is updated after the arena-core release.
- `@openforis/arena-core` must resolve to a single version in Arena: align the range with arena-server and run
  `yarn dedupe @openforis/arena-core`.
- New Arena files in TypeScript; JSDoc on every function (description ending with period, `@param`, `@returns`).
- Cognitive complexity ≤ 15 per function; `for...of` instead of `forEach`; short "why" comments.
- No hard-coded colors; no `console.log` on the server (use `@server/log/log`).
- i18n: every new key in all 8 languages (en, es, fr, ja, mn, pt, ru, sr).
- Do not run `yarn build` in the main Arena checkout (the user's `yarn watch` runs from `dist/`): run e2e from the
  worktree `../arena-wt-mobile-survey-package` on `PORT=9091`, `PGDATABASE=arena_e2e`.
- AOI max file size: 10 MB. AOI geometry: GeoJSON `Polygon | MultiPolygon`, WGS84.

---

## Part A: arena-core

### Task 1: AOI descriptors in the survey

**Files:**
- Modify: `src/geo/areaOfInterest.ts`, `src/geo/index.ts`, `src/index.ts`
- Modify: `src/survey/survey.ts:109` (`areaOfInterest` prop)
- Modify: `src/survey/surveys/surveysGetters.ts:95-99`, `src/survey/surveys/index.ts:74,110`
- Test: `src/survey/surveys/surveysGetters.test.ts`

**Interfaces:**
- Produces: type `AreaOfInterestDescriptor`; `SurveyProps.areasOfInterest?: AreaOfInterestDescriptor[]`;
  `Surveys.getAreasOfInterest(survey): AreaOfInterestDescriptor[]`;
  `Surveys.getAreaOfInterestByName({ survey, name }): AreaOfInterestDescriptor | undefined`.
- Removes: `SurveyProps.areaOfInterest`, `Surveys.getAreaOfInterest`.

- [ ] **Step 1: Write the failing tests** (replace the `getAreaOfInterest` tests in `surveysGetters.test.ts`)

```ts
describe('getAreasOfInterest', () => {
  const areasOfInterest: AreaOfInterestDescriptor[] = [
    { name: 'area_a', fileUuid: 'uuid-a', fileName: 'a.geojson', size: 100, polygons: 1, vertices: 5 },
    { name: 'area_b', fileUuid: 'uuid-b', fileName: 'b.geojson', size: 200, polygons: 2, vertices: 10 },
  ]
  test('from survey props (Arena Mobile)', () => {
    const survey = { props: { areasOfInterest } } as unknown as Survey
    expect(Surveys.getAreasOfInterest(survey)).toEqual(areasOfInterest)
  })
  test('from survey info props (Arena)', () => {
    const survey = { props: {}, info: { props: { areasOfInterest } } } as unknown as Survey
    expect(Surveys.getAreasOfInterest(survey)).toEqual(areasOfInterest)
  })
  test('not defined => empty array', () => {
    expect(Surveys.getAreasOfInterest({ props: {} } as unknown as Survey)).toEqual([])
  })
  test('by name', () => {
    const survey = { props: { areasOfInterest } } as unknown as Survey
    expect(Surveys.getAreaOfInterestByName({ survey, name: 'area_b' })?.fileUuid).toBe('uuid-b')
    expect(Surveys.getAreaOfInterestByName({ survey, name: 'area_c' })).toBeUndefined()
  })
})
```

- [ ] **Step 2: Run the tests**: `yarn jest src/survey/surveys/surveysGetters.test.ts` → FAIL (`getAreasOfInterest` not a function).

- [ ] **Step 3: Implement**

`src/geo/areaOfInterest.ts`:

```ts
import type { MultiPolygon, Polygon } from 'geojson'

import { Labels } from '../language'

/**
 * Area of interest geometry: GeoJSON polygon or multi polygon in WGS84 (EPSG:4326).
 */
export type AreaOfInterest = Polygon | MultiPolygon

/**
 * Area of interest defined in a survey; the geometry is stored in a separate file (fetched by AreaOfInterestProvider).
 */
export interface AreaOfInterestDescriptor {
  // identifier used in expressions
  name: string
  labels?: Labels
  fileUuid: string
  fileName: string
  size: number
  polygons: number
  vertices: number
}
```

`src/geo/index.ts`: `export type { AreaOfInterest, AreaOfInterestDescriptor } from './areaOfInterest'`;
`src/index.ts:109`: `export type { AreaOfInterest, AreaOfInterestDescriptor, Point } from './geo'`.

`src/survey/survey.ts`: replace `areaOfInterest?: AreaOfInterest` with
`areasOfInterest?: AreaOfInterestDescriptor[]` (import the type from `'../geo'`).

`src/survey/surveys/surveysGetters.ts` (replace `getAreaOfInterest`):

```ts
export const getAreasOfInterest = (survey: Survey): AreaOfInterestDescriptor[] =>
  survey?.props?.areasOfInterest ??
  // backwards compatibility with Arena: survey info props stored in info
  (survey as any)?.info?.props?.areasOfInterest ??
  []

export const getAreaOfInterestByName = (params: {
  survey: Survey
  name: string
}): AreaOfInterestDescriptor | undefined =>
  getAreasOfInterest(params.survey).find((areaOfInterest) => areaOfInterest.name === params.name)
```

`src/survey/surveys/index.ts`: replace both `getAreaOfInterest` entries with `getAreasOfInterest,
getAreaOfInterestByName`.

- [ ] **Step 4: Run the tests**: same command → PASS. `yarn tsc --noEmit` reports the remaining use in
  `src/nodeDefExpressionEvaluator/functions.ts` (fixed in Task 3); leave it.

- [ ] **Step 5: Commit**: `git commit -am "feat: area of interest descriptors in the survey (geometry stored separately)"`

### Task 2: AreaOfInterestProvider in the expression context

**Files:**
- Create: `src/nodeDefExpressionEvaluator/areaOfInterestProvider.ts`
- Modify: `src/nodeDefExpressionEvaluator/index.ts`, `src/nodeDefExpressionEvaluator/context.ts`, `src/index.ts`
- Modify: `src/record/recordExpressionEvaluator/context.ts`,
  `src/record/recordExpressionEvaluator/recordExpressionEvaluator.ts:17-24` (`ExpressionEvaluateParams`)
- Modify: `src/record/recordNodesUpdater/recordExpressionEvaluationContext.ts`
- Modify: `src/record/recordValidator/attributeValidator.ts` (`RecordValidatorParams`, `_validateNodeValidations`
  and its callers)

**Interfaces:**
- Produces:

```ts
export interface AreaOfInterestProvider {
  getAreaOfInterest: (params: { survey: Survey; name: string }) => Promise<AreaOfInterest | undefined>
}
```

  as optional `areaOfInterestProvider` in `NodeDefExpressionContext`, `RecordExpressionContext`,
  `RecordExpressionEvaluationContext` (so in `NodesUpdateParams`) and `RecordValidatorParams`.

- [ ] **Step 1: Create the provider type** (`areaOfInterestProvider.ts`), export it from
  `src/nodeDefExpressionEvaluator/index.ts` (`export type { AreaOfInterestProvider } from './areaOfInterestProvider'`)
  and from `src/index.ts` next to `CategoryItemProvider`.

- [ ] **Step 2: Add `areaOfInterestProvider?: AreaOfInterestProvider`** next to `taxonProvider` in the 4 interfaces
  above and in `ExpressionEvaluateParams`. The record updaters spread their params into the evaluation context
  (`...params`), so the provider reaches the default values, applicability, required/editable/visible and count
  evaluations without other changes.

- [ ] **Step 3: Pass it to the validation expressions**: in `attributeValidator.ts`, `_validateNodeValidations` only
  forwards `user, survey, record`: add `areaOfInterestProvider` to its params type, destructure it and pass it to
  `expressionEvaluator.evalApplicableExpressions({ ..., areaOfInterestProvider })`; pass it where
  `_validateNodeValidations` is called (from the `AttributeValidatorParams`).

- [ ] **Step 4: Verify**: `yarn tsc --noEmit` (only the Task 3 error remains); `yarn jest src/record` → PASS.

- [ ] **Step 5: Commit**: `git commit -am "feat: AreaOfInterestProvider in the expression evaluation context"`

### Task 3: `geoDistanceToAOIBoundary(coordinate, areaName)`

**Files:**
- Modify: `src/nodeDefExpressionEvaluator/functions.ts:11,178-190`
- Test: `src/record/recordExpressionEvaluator/geoDistanceToAOIBoundary.test.ts` (rewrite)
- Create: `src/tests/areaOfInterestTestUtils.ts` (shared by Tasks 3-5)

**Interfaces:**
- Consumes: `Surveys.getAreaOfInterestByName`, `AreaOfInterestProvider` (Tasks 1-2).
- Produces: `createTestAreaOfInterestProvider(geometriesByName): AreaOfInterestProvider`,
  `withAreasOfInterest(survey, names): Survey` in `src/tests/areaOfInterestTestUtils.ts`.

- [ ] **Step 1: Test utils** (`src/tests/areaOfInterestTestUtils.ts`)

```ts
import { AreaOfInterest } from '../geo'
import { AreaOfInterestProvider } from '../nodeDefExpressionEvaluator'
import { Survey } from '../survey'

/**
 * Provider returning the specified geometries, by area name.
 */
export const createTestAreaOfInterestProvider = (
  geometriesByName: Record<string, AreaOfInterest>
): AreaOfInterestProvider => ({
  getAreaOfInterest: async ({ name }) => geometriesByName[name],
})

/**
 * Survey with the descriptors of the specified areas of interest (in the specified order).
 */
export const withAreasOfInterest = (survey: Survey, names: string[]): Survey => ({
  ...survey,
  props: {
    ...survey.props,
    areasOfInterest: names.map((name) => ({
      name,
      fileUuid: `${name}-file`,
      fileName: `${name}.geojson`,
      size: 100,
      polygons: 1,
      vertices: 5,
    })),
  },
})
```

- [ ] **Step 2: Rewrite the test file** (keep `areaOfInterest`, `createRecordNearBoundary` and the assertions of the
  current tests; the area is now named and passed by the provider):

```ts
const pilotArea = 'pilot_area'
const areaOfInterestProvider = createTestAreaOfInterestProvider({ [pilotArea]: areaOfInterest })

const evaluate = (
  expression: string,
  params: { survey?: Survey; record?: ArenaRecord; provider?: AreaOfInterestProvider | null } = {}
) => {
  const { survey = surveyWithAOI, record: recordToEvaluate = record, provider = areaOfInterestProvider } = params
  const nodeContext = Records.getRoot(recordToEvaluate)!
  const context: RecordExpressionContext = {
    user,
    survey,
    record: recordToEvaluate,
    nodeContext,
    nodeCurrent: nodeContext,
    object: nodeContext,
    areaOfInterestProvider: provider ?? undefined,
  }
  return new RecordExpressionEvaluator().evaluate(expression, context)
}
```

`beforeAll`: `surveyWithAOI = withAreasOfInterest(surveyWithoutAOI, [pilotArea])`.
Expressions: `geoDistanceToAOIBoundary(cluster_location, 'pilot_area')` (and `plot[2].plot_location`, the WKT string,
the accuracy comparisons). Keep the existing tests and add:

```ts
test('unknown area => null', async () => {
  expect(await evaluate(`geoDistanceToAOIBoundary(cluster_location, 'other_area')`)).toBeNull()
})
test('provider missing => null', async () => {
  expect(await evaluate(`geoDistanceToAOIBoundary(cluster_location, 'pilot_area')`, { provider: null })).toBeNull()
})
test('area defined but geometry not available => null', async () => {
  const provider = createTestAreaOfInterestProvider({})
  expect(await evaluate(`geoDistanceToAOIBoundary(cluster_location, 'pilot_area')`, { provider })).toBeNull()
})
test('area name missing => error', async () => {
  await expect(evaluate('geoDistanceToAOIBoundary(cluster_location)')).rejects.toEqual(
    new SystemError('expression.functionHasTooFewArguments')
  )
})
```

(`survey without area of interest => null` uses `surveyWithoutAOI` with the 2-argument expression.)

- [ ] **Step 3: Run**: `yarn jest src/record/recordExpressionEvaluator/geoDistanceToAOIBoundary.test.ts` → FAIL.

- [ ] **Step 4: Implement** in `functions.ts` (import `getAreaOfInterestByName` instead of `getAreaOfInterest`):

```ts
const fetchAreaOfInterest = async (params: {
  context: NodeDefExpressionContext
  name: string
}): Promise<AreaOfInterest | undefined> => {
  const { context, name } = params
  const { survey, areaOfInterestProvider } = context
  if (!areaOfInterestProvider || !getAreaOfInterestByName({ survey, name })) return undefined
  return areaOfInterestProvider.getAreaOfInterest({ survey, name })
}

const distanceToAreaOfInterestBoundary = async (params: {
  context: NodeDefExpressionContext
  point: Point
  name: string
}): Promise<number | null> => {
  const { context, point, name } = params
  const areaOfInterest = await fetchAreaOfInterest({ context, name })
  if (!areaOfInterest) return null
  return Points.distanceToPolygonBoundary(point, areaOfInterest, getSRSIndex(context.survey))
}
```

```ts
  geoDistanceToAOIBoundary: {
    minArity: 2,
    maxArity: 2,
    executor:
      (context: NodeDefExpressionContext) =>
      async (coordinate: Point | string, name: string): Promise<number | null> => {
        const point = Points.parse(coordinate)
        if (!point || typeof name !== 'string') return null
        return distanceToAreaOfInterestBoundary({ context, point, name })
      },
  },
```

- [ ] **Step 5: Run** the test → PASS; `yarn tsc --noEmit` → clean; `yarn lint`.

- [ ] **Step 6: Commit**: `git commit -am "feat: geoDistanceToAOIBoundary with area name, geometry fetched by the provider"`

### Task 4: `geoAOIContaining(coordinate)`

**Files:**
- Modify: `src/nodeDefExpressionEvaluator/functions.ts`
- Test: `src/record/recordExpressionEvaluator/geoAOIContaining.test.ts`

**Interfaces:**
- Consumes: `distanceToAreaOfInterestBoundary` (Task 3), `getAreasOfInterest` (Task 1), test utils (Task 3).

- [ ] **Step 1: Failing test** (same `evaluate` helper as Task 3; test record locations: `cluster_location` at
  ≈ lon 41.9, lat 12.49; `plot[2].plot_location` north of lat 12.6)

```ts
// west half and whole square around the cluster location: they overlap
const westArea: AreaOfInterest = { type: 'Polygon', coordinates: [[[41.8, 12.4], [41.95, 12.4], [41.95, 12.6], [41.8, 12.6], [41.8, 12.4]]] }
const square: AreaOfInterest = { type: 'Polygon', coordinates: [[[41.8, 12.4], [42.0, 12.4], [42.0, 12.6], [41.8, 12.6], [41.8, 12.4]]] }
const provider = createTestAreaOfInterestProvider({ west: westArea, square })

test('first area (in the survey order) containing the coordinate', async () => {
  const surveyWestFirst = withAreasOfInterest(survey, ['west', 'square'])
  expect(await evaluate('geoAOIContaining(cluster_location)', { survey: surveyWestFirst })).toBe('west')
  const surveySquareFirst = withAreasOfInterest(survey, ['square', 'west'])
  expect(await evaluate('geoAOIContaining(cluster_location)', { survey: surveySquareFirst })).toBe('square')
})
test('no area containing the coordinate => null', async () => {
  const surveyWithAreas = withAreasOfInterest(survey, ['west', 'square'])
  expect(await evaluate('geoAOIContaining(plot[2].plot_location)', { survey: surveyWithAreas })).toBeNull()
})
test('provider missing => null', async () => {
  const surveyWithAreas = withAreasOfInterest(survey, ['west'])
  expect(await evaluate('geoAOIContaining(cluster_location)', { survey: surveyWithAreas, provider: null })).toBeNull()
})
test('not a coordinate => null', async () => {
  expect(await evaluate('geoAOIContaining(remarks)', { survey: withAreasOfInterest(survey, ['west']) })).toBeNull()
})
```

Check the cluster location longitude in `src/tests/data/record.ts` and set the `westArea` east edge so that the
location is inside it (e.g. 41.95 if the longitude is 41.9).

- [ ] **Step 2: Run** → FAIL (`functionNotFound` or similar).

- [ ] **Step 3: Implement** (in `functions.ts`, `import { getAreasOfInterest } ...`)

```ts
  geoAOIContaining: {
    minArity: 1,
    maxArity: 1,
    executor:
      (context: NodeDefExpressionContext) =>
      async (coordinate: Point | string): Promise<string | null> => {
        const point = Points.parse(coordinate)
        if (!point || !context.areaOfInterestProvider) return null
        // the survey order is the priority of overlapping areas
        for (const { name } of getAreasOfInterest(context.survey)) {
          const distance = await distanceToAreaOfInterestBoundary({ context, point, name })
          if (distance !== null && distance <= 0) return name
        }
        return null
      },
  },
```

- [ ] **Step 4: Run** → PASS; `yarn lint` (if Sonar complains about `await` in loop, keep it: sequential on purpose,
  add `// NOSONAR` like Arena does).

- [ ] **Step 5: Commit**: `git commit -am "feat: geoAOIContaining expression function"`

### Task 5: Expression validation of the area name

**Files:**
- Modify: `src/error/systemErrorKeys.ts` (`expression` group), `src/nodeDefExpressionEvaluator/functions.ts`
- Test: `src/nodeDefExpressionEvaluator/expressionValidator.test.ts`

**Interfaces:**
- Produces: error key `SystemErrorKeys.expression.areaOfInterestNotFound = 'expression.areaOfInterestNotFound'` with
  params `{ name }`.

- [ ] **Step 1: Failing tests**: in `expressionValidator.test.ts` the cases are a table of
  `{ expression, nodeDef?, result? }` evaluated against the test survey: build a survey with
  `withAreasOfInterest(survey, ['pilot_area'])` for these cases and add

```ts
{ expression: `geoDistanceToAOIBoundary(cluster_location, 'pilot_area')` },
{ expression: `geoAOIContaining(cluster_location)` },
{
  expression: `geoDistanceToAOIBoundary(cluster_location, 'other_area')`,
  result: { valid: false, key: 'expression.areaOfInterestNotFound', params: { name: 'other_area' } },
},
```

  Follow the shape of the existing invalid cases of the table (field names may differ: copy one).

- [ ] **Step 2: Run**: `yarn jest src/nodeDefExpressionEvaluator/expressionValidator.test.ts` → FAIL (the unknown
  area is valid).

- [ ] **Step 3: Implement**: add the key to `systemErrorKeys.ts` (`areaOfInterestNotFound:
  'expression.areaOfInterestNotFound'`); in `functions.ts`:

```ts
// expression validation (no record): a literal area name must be defined in the survey
const validateAreaOfInterestName = (params: { context: NodeDefExpressionContext; name: unknown }): void => {
  const { context, name } = params
  const record: ArenaRecord = (context as any).record
  if (!record && typeof name === 'string' && !getAreaOfInterestByName({ survey: context.survey, name })) {
    throw new SystemError(SystemErrorKeys.expression.areaOfInterestNotFound, { name })
  }
}
```

  and call `validateAreaOfInterestName({ context, name })` as first statement of the `geoDistanceToAOIBoundary`
  executor. During record evaluation an unknown name still returns `null` (Task 3 test).

- [ ] **Step 4: Run** → PASS; full suite `yarn test` → PASS; `yarn lint`; `yarn build`.

- [ ] **Step 5: Commit**: `git commit -am "feat: expression validation: area of interest not found"`

### Task 6: arena-core PR

- [ ] Push `areas-of-interest`, open the PR to `master` ("Multiple areas of interest: descriptors, provider,
  geoDistanceToAOIBoundary(coordinate, areaName), geoAOIContaining(coordinate)"; note the breaking change of the
  unreleased-in-Arena `areaOfInterest` prop / `getAreaOfInterest`). End the body with the Claude Code attribution.
- [ ] Watch the checks / reviews, fix and reply to each finding (CLAUDE.md workflow). The user merges and releases.

---

## Part B: Arena (after the arena-core release)

### Task 7: arena-core upgrade

- [ ] Set `@openforis/arena-core` to the released version in `package.json` (same range as arena-server requires; if
  arena-server pins an older one, ask the user), `yarn install`, `yarn dedupe @openforis/arena-core`; check
  `yarn why @openforis/arena-core` shows a single version.
- [ ] `yarn typecheck`: note the errors from the removed `getAreaOfInterest` / `areaOfInterest` (fixed in the next tasks).
- [ ] Commit: `Upgrade arena-core (areas of interest provider)`.

### Task 8: AOI descriptors in the survey info (core)

**Files:**
- Modify: `core/survey/surveyAreaOfInterest.ts` (rewrite), `core/survey/_survey/surveyInfo.ts:28-29`
- Create: `core/survey/surveyAreaOfInterestValidator.ts`
- Modify: `core/validation/_validator/validatorErrorKeys.ts`, `core/i18n/resources/*/validationErrors.js`
- Test: `test/unit/tests/surveyAreaOfInterest.test.ts`

**Interfaces:**
- Produces (`core/survey/surveyAreaOfInterest.ts`):
  - `keys` (`name, labels, fileUuid, fileName, size, polygons, vertices`), `AREA_OF_INTEREST_MAX_FILE_SIZE_MB = 10`;
  - `newAreaOfInterestDescriptor({ name, labels, fileUuid, fileName, size, areaOfInterest }): AreaOfInterestDescriptor`;
  - `getAreasOfInterest(surveyOrInfo): AreaOfInterestDescriptor[]`;
  - `getAreaOfInterestFileSummaries(surveyOrInfo): { uuid; props: { type; name; size } }[]`;
  - `getAreaOfInterestFileUuids(surveyOrInfo): string[]`;
  - `getAreaOfInterestNames(surveyOrInfo): string[]`.
- Produces: `SurveyAreaOfInterestValidator.validate({ areasOfInterest, areaOfInterest }): Promise<Validation>`;
  message keys `surveyAreaOfInterest.nameRequired`, `.nameDuplicate`, `.fileRequired` (and `nameInvalid` reused
  from `Validation.messageKeys.nameInvalid`).
- Removes: `getAreaOfInterestFile`, `getAreaOfInterestFileUuid`, `getAreaOfInterestFileSummary`,
  `assocAreaOfInterest`; info keys `areaOfInterest` and `areaOfInterestFile` (replaced by `areasOfInterest`).

- [ ] **Step 1: Failing unit test** `test/unit/tests/surveyAreaOfInterest.test.ts`:

```ts
import * as SurveyAreaOfInterest from '@core/survey/surveyAreaOfInterest'
import { SurveyAreaOfInterestValidator } from '@core/survey/surveyAreaOfInterestValidator'
import * as Validation from '@core/validation/validation'

const square = { type: 'Polygon', coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]] } as const

const newDescriptor = (name: string, fileUuid: string) =>
  SurveyAreaOfInterest.newAreaOfInterestDescriptor({
    name,
    labels: { en: name },
    fileUuid,
    fileName: `${name}.geojson`,
    size: 100,
    areaOfInterest: square as any,
  })

describe('SurveyAreaOfInterest', () => {
  const surveyInfo = { props: { areasOfInterest: [newDescriptor('area_a', 'uuid-a'), newDescriptor('area_b', 'uuid-b')] } }

  test('descriptor summary', () => {
    expect(newDescriptor('area_a', 'uuid-a')).toMatchObject({ polygons: 1, vertices: 5, fileName: 'area_a.geojson' })
  })
  test('file summaries and uuids', () => {
    expect(SurveyAreaOfInterest.getAreaOfInterestFileUuids(surveyInfo)).toEqual(['uuid-a', 'uuid-b'])
    expect(SurveyAreaOfInterest.getAreaOfInterestFileSummaries(surveyInfo)[1]).toEqual({
      uuid: 'uuid-b',
      props: { type: 'areaOfInterest', name: 'area_b.geojson', size: 100 },
    })
  })
  test('validation: duplicate and invalid names', async () => {
    const areasOfInterest = SurveyAreaOfInterest.getAreasOfInterest(surveyInfo)
    const duplicate = { ...newDescriptor('area_a', 'uuid-c') }
    const validation = await SurveyAreaOfInterestValidator.validate({ areasOfInterest: [...areasOfInterest, duplicate], areaOfInterest: duplicate })
    expect(Validation.isValid(validation)).toBe(false)
    const invalidName = newDescriptor('Area A', 'uuid-d')
    expect(Validation.isValid(await SurveyAreaOfInterestValidator.validate({ areasOfInterest, areaOfInterest: invalidName }))).toBe(false)
    expect(Validation.isValid(await SurveyAreaOfInterestValidator.validate({ areasOfInterest, areaOfInterest: newDescriptor('area_c', 'uuid-e') }))).toBe(true)
  })
})
```

- [ ] **Step 2: Run**: `yarn build:test:unit && npx jest dist/__tests__/bundle.unit.js -t SurveyAreaOfInterest` → FAIL.

- [ ] **Step 3: Implement** `core/survey/surveyAreaOfInterest.ts`:

```ts
import type { AreaOfInterest, AreaOfInterestDescriptor } from '@openforis/arena-core'

import { getAreaOfInterestSummary } from '@core/geo/areaOfInterestParser'
import * as ObjectUtils from '@core/objectUtils'

import { getInfo, keys as infoKeys } from './_survey/surveyInfo'
import * as SurveyFile from './surveyFile'

// the geometries are stored as survey files: the survey info only holds the descriptors
export const keys = {
  name: 'name',
  labels: 'labels',
  fileUuid: 'fileUuid',
  fileName: 'fileName',
  size: 'size',
  polygons: 'polygons',
  vertices: 'vertices',
} as const

// same max size of the preloaded map layers
export const AREA_OF_INTEREST_MAX_FILE_SIZE_MB = 10

/**
 * Creates the descriptor of an area of interest, stored in the survey info props.
 * @param {object} params - The parameters.
 * @param {string} params.name - Area name (identifier used in expressions).
 * @param {object} [params.labels] - Labels by language.
 * @param {string} params.fileUuid - UUID of the survey file with the geometry.
 * @param {string} params.fileName - Name of the uploaded file.
 * @param {number} params.size - Size of the stored file content.
 * @param {AreaOfInterest} params.areaOfInterest - The geometry (to compute the summary).
 * @returns {AreaOfInterestDescriptor} - The descriptor.
 */
export const newAreaOfInterestDescriptor = ({ name, labels, fileUuid, fileName, size, areaOfInterest }: {
  name: string
  labels?: Record<string, string>
  fileUuid: string
  fileName: string
  size: number
  areaOfInterest: AreaOfInterest
}): AreaOfInterestDescriptor => ({
  name,
  ...(labels ? { labels } : {}),
  fileUuid,
  fileName,
  size,
  ...getAreaOfInterestSummary(areaOfInterest),
})

/**
 * Returns the areas of interest of the survey.
 * @param {object} surveyOrSurveyInfo - The survey or the survey info.
 * @returns {AreaOfInterestDescriptor[]} - The descriptors (empty if none).
 */
export const getAreasOfInterest = (surveyOrSurveyInfo: any): AreaOfInterestDescriptor[] =>
  ObjectUtils.getProp(infoKeys.areasOfInterest, [])(getInfo(surveyOrSurveyInfo)) as AreaOfInterestDescriptor[]

/**
 * Returns the names of the areas of interest (survey order).
 * @param {object} surveyOrSurveyInfo - The survey or the survey info.
 * @returns {string[]} - The names.
 */
export const getAreaOfInterestNames = (surveyOrSurveyInfo: any): string[] =>
  getAreasOfInterest(surveyOrSurveyInfo).map((descriptor) => descriptor.name)

/**
 * Returns the UUIDs of the area of interest files.
 * @param {object} surveyOrSurveyInfo - The survey or the survey info.
 * @returns {string[]} - The file UUIDs.
 */
export const getAreaOfInterestFileUuids = (surveyOrSurveyInfo: any): string[] =>
  getAreasOfInterest(surveyOrSurveyInfo).map((descriptor) => descriptor.fileUuid)

/**
 * Returns the summaries ({ uuid, props: { type, name, size } }) of the area of interest files, used by survey
 * export/import and by the Arena Mobile survey package.
 * @param {object} surveyOrSurveyInfo - The survey or the survey info.
 * @returns {object[]} - The file summaries.
 */
export const getAreaOfInterestFileSummaries = (
  surveyOrSurveyInfo: any
): { uuid: string; props: { type: string; name: string; size: number } }[] =>
  getAreasOfInterest(surveyOrSurveyInfo).map(({ fileUuid, fileName, size }) => ({
    uuid: fileUuid,
    props: { type: SurveyFile.SurveyFileType.areaOfInterest, name: fileName, size },
  }))
```

`core/survey/_survey/surveyInfo.ts`: replace `areaOfInterest` / `areaOfInterestFile` keys with
`areasOfInterest: 'areasOfInterest'`.

`core/validation/_validator/validatorErrorKeys.ts`: add next to `surveyPreloadedMapLayer`:

```ts
  surveyAreaOfInterest: {
    fileRequired: 'validationErrors:surveyAreaOfInterest.fileRequired',
    nameDuplicate: 'validationErrors:surveyAreaOfInterest.nameDuplicate',
    nameRequired: 'validationErrors:surveyAreaOfInterest.nameRequired',
  },
```

`core/survey/surveyAreaOfInterestValidator.ts`:

```ts
import type { AreaOfInterestDescriptor } from '@openforis/arena-core'

import * as Validation from '@core/validation/validation'
import * as Validator from '@core/validation/validator'

import { keys } from './surveyAreaOfInterest'

/**
 * Validates an area of interest against the other areas of the survey.
 * @param {object} params - The parameters.
 * @param {AreaOfInterestDescriptor[]} params.areasOfInterest - All the areas of interest of the survey.
 * @param {AreaOfInterestDescriptor} params.areaOfInterest - The area of interest to validate.
 * @returns {Promise<object>} - The validation.
 */
const validate = async ({ areasOfInterest, areaOfInterest }: {
  areasOfInterest: AreaOfInterestDescriptor[]
  areaOfInterest: Partial<AreaOfInterestDescriptor>
}) =>
  Validator.validate(areaOfInterest, {
    [keys.name]: [
      Validator.validateRequired(Validation.messageKeys.surveyAreaOfInterest.nameRequired),
      Validator.validateName(Validation.messageKeys.nameInvalid),
      Validator.validateNotKeyword(Validation.messageKeys.nameCannotBeKeyword),
      Validator.validateItemPropUniqueness(Validation.messageKeys.surveyAreaOfInterest.nameDuplicate)(
        areasOfInterest.filter((other) => other.fileUuid !== areaOfInterest.fileUuid)
      ),
    ],
    [keys.fileUuid]: [Validator.validateRequired(Validation.messageKeys.surveyAreaOfInterest.fileRequired)],
  })

export const SurveyAreaOfInterestValidator = { validate }
```

i18n `validationErrors.js` (8 languages): `surveyAreaOfInterest: { fileRequired, nameDuplicate, nameRequired }`
(en: 'File is required', 'Another area of interest with the same name already exists', 'Name is required').

- [ ] **Step 4: Run** → PASS. Commit: `Areas of interest: descriptors list in the survey info`.

### Task 9: Survey compare, fingerprint, mobile package

**Files:**
- Modify: `core/survey/surveyCompare/surveyCompareSurveyInfo.ts` (lines 49-61, 132-212, 290-352)
- Modify: `core/survey/surveyCompare/surveyFingerprint.ts:39`, `core/survey/surveyMobilePackage.ts:29-45`
- Modify: `webapp/views/App/views/Home/SurveyCompare/surveyCompareValueFormatter.ts` (labels for `fileName`)
- Test: `test/unit/tests/056surveyCompareSync.test.ts`, `test/unit/tests/057surveyFingerprint.test.ts`,
  `test/unit/tests/surveyMobilePackage.test.ts`

**Interfaces:**
- Consumes: `SurveyAreaOfInterest.getAreasOfInterest`, `getAreaOfInterestFileSummaries`,
  `newAreaOfInterestDescriptor` (Task 8).

- [ ] **Step 1: Update the tests first**:
  - `056`: the AOI test helper builds `areasOfInterest: [descriptor('area_a', ...), descriptor('area_b', ...)]`.
    Cases: area added in the source (diff `added`, plan inserts 1 file and `plan.surveyProps.areasOfInterest` contains
    the new file uuid for `area_a`); same areas under other file uuids → no diff; `area_b` with different vertices →
    `changed`; area removed → `removed`, plan deletes the target file and drops it from `areasOfInterest`; source
    order kept in `plan.surveyProps.areasOfInterest`.
  - `057`: the fingerprint does not change when only the file uuids change, changes when an area is renamed.
  - `surveyMobilePackage`: two areas → two `areaOfInterest` file summaries.

- [ ] **Step 2: Run** the unit tests → FAIL.

- [ ] **Step 3: Implement**
  - Compare: `areasOfInterest` is not in `comparedSurveyInfoProps` (like `preloadedMapLayers`): the areas are
    compared only as survey files. Remove `withoutFileUuid` and the `areaOfInterestFile` case of
    `normalizeSurveyInfoProp`.
  - `getAreaOfInterestFileEntries`: one entry per descriptor (`getAreasOfInterest(survey)` zipped with
    `getAreaOfInterestFileSummaries(survey)`): `kind` = `areaOfInterest`, `key` = `name` = area name,
    `fileType` = `areaOfInterest`, `fileUuid`, `normalized` = `normalizeValue({ labels, size, polygons, vertices })`,
    `summary`. A renamed area is a `removed` + an `added` diff.
  - Apply plan: add `[SurveyFileKind.areaOfInterest]: targetProps[infoKeys.areasOfInterest] ?? []` to
    `context.lists`, and `sourceSurvey` descriptors are found by name. `applyFileDiffToList` matches by
    `SurveyFile.getUuid` (summaries), so add `applyAreaOfInterestDiffToList({ list, diff, sourceDescriptor, newFile })`:
    remove the descriptor whose `fileUuid === diff.targetUuid`; if `newFile`, insert
    `{ ...sourceDescriptor, fileUuid: SurveyFile.getUuid(newFile) }` at the removed index (append if none). In
    `planSurveyFileDiff`, the `areaOfInterest` kind uses it and adds the kind to `listsChanged`; at the end the kind
    is written to `plan.surveyProps[infoKeys.areasOfInterest]` (map `SurveyFileKind.areaOfInterest` →
    `infoKeys.areasOfInterest` in the final loop). Remove `planAreaOfInterestFileDiff`.
  - Fingerprint: `infoKeys.areasOfInterest`, each descriptor without `fileUuid`.
  - Mobile package: `...SurveyAreaOfInterest.getAreaOfInterestFileSummaries(surveyInfo)`.
  - Value formatter: label for `fileName` (reuse `polygons` / `vertices` labels).

- [ ] **Step 4: Run** → PASS; `yarn typecheck` on these files; lint. Commit: `Areas of interest: survey compare,
  fingerprint and mobile package`.

### Task 10: Server provider and plumbing

**Files:**
- Create: `server/modules/survey/manager/areaOfInterestProviderDefault.ts`
- Delete: `server/modules/survey/manager/surveyAreaOfInterestManager.ts`
- Modify: `server/modules/survey/manager/surveyManager.js:16,38,308,342-343,360-365,599-601,632-637`
- Modify: `server/modules/arenaImport/service/arenaImport/jobs/surveyFilesImportJob.js`
- Modify: every place passing `CategoryItemProviderDefault` / `categoryItemProvider` for record evaluation:
  `core/record/_record/recordNodesUpdater.js`, `core/record/_record/recordNodesUpdaterCommon.js`,
  `core/record/_record/recordsCombiner.js`, `server/modules/record/manager/_recordManager/{nodeUpdateManager.js,
  recordValidationManager.js, recordCreationManager.js, recordUpdateManager.js, nonApplicableValuesClearPreview.ts}`,
  `server/modules/record/service/recordService.js`, `server/modules/dataImport/service/DataImportJob/FlatDataImportJob.js`,
  `server/modules/mobile/service/arenaMobileDataImport/jobs/recordsImportJob.js`,
  `server/modules/collectImport/service/collectImport/dataImportJobs/recordsImportJob.js`,
  `server/modules/odkImport/service/odkImport/dataImportJobs/recordsImportJob.ts`,
  `server/modules/analysis/service/rChain/PersistResultsJob.js`
- Revert: the `includeAreaOfInterest: true` options added in the previous commit (same files + `recordsUpdateThread.js`,
  `recordCheckJob.js`, `recordsValidationJob.js`): `git show a463ee219 --stat` lists them.
- Test: `test/integration/tests/058surveyAreaOfInterestTest.js` (rewrite)

**Interfaces:**
- Produces: `AreaOfInterestProviderDefault: AreaOfInterestProvider` (`getAreaOfInterest({ survey, name })`).

- [ ] **Step 1: Rewrite the integration test** (two areas: `west` = lon 12.48..12.49, `east` = lon 12.49..12.50, same
  latitudes as now; `aoi_distance` default `geoDistanceToAOIBoundary(location, 'east')`, `aoi_name` (text) default
  `geoAOIContaining(location)`). Tests:
  - location 12.495 → `aoi_distance < 0`, `aoi_name = 'east'`; location 12.485 → `aoi_distance > 0`,
    `aoi_name = 'west'`; location 12.51 → `aoi_name` empty;
  - the survey fetched by `fetchSurveyAndNodeDefsAndRefDataBySurveyId` has no geometry in it (only descriptors);
  - the provider caches: second `getAreaOfInterest` for the same file does not hit the DB (spy on
    `SurveyFileManager.fetchFileContentAsBuffer` is not possible in the webpack bundle: instead assert that the same
    object instance is returned twice);
  - invalid upload rejected (keep the current test).
  Evaluate with `RecordManager.updateNodesDependents({ survey, record, nodes, areaOfInterestProvider:
  AreaOfInterestProviderDefault })` or through `RecordManager`'s default (whichever the manager uses after Step 3).

- [ ] **Step 2: Run**: `yarn test:integration` (or the bundled single test) → FAIL.

- [ ] **Step 3: Implement the provider**:

```ts
import type { AreaOfInterest, AreaOfInterestProvider } from '@openforis/arena-core'
import { Surveys } from '@openforis/arena-core'

import { parseAreaOfInterestJson } from '@core/geo/areaOfInterestParser'
import * as Survey from '@core/survey/survey'

import * as Log from '@server/log/log'

import * as SurveyFileManager from './surveyFileManager'

const Logger = Log.getLogger('AreaOfInterestProvider')

// survey files are never modified (a new upload gets a new uuid): cached geometries never become stale
const maxCachedAreas = 50
const cache = new Map<string, AreaOfInterest>()

const cacheGet = (key: string): AreaOfInterest | undefined => {
  const value = cache.get(key)
  if (value) {
    // most recently used last
    cache.delete(key)
    cache.set(key, value)
  }
  return value
}

const cachePut = (key: string, value: AreaOfInterest): void => {
  cache.set(key, value)
  if (cache.size > maxCachedAreas) {
    cache.delete(cache.keys().next().value!)
  }
}

const fetchAreaOfInterest = async ({ surveyId, fileUuid }: { surveyId: number; fileUuid: string }) => {
  const fileSummary = await SurveyFileManager.fetchFileSummaryByUuid(surveyId, fileUuid)
  const content = fileSummary ? await SurveyFileManager.fetchFileContentAsBuffer({ surveyId, fileSummary }) : null
  const areaOfInterest = content ? parseAreaOfInterestJson(content.toString('utf8')) : null
  if (!areaOfInterest) {
    Logger.warn(`Survey ${surveyId}: area of interest file ${fileUuid} missing or not valid`)
  }
  return areaOfInterest ?? undefined
}

/**
 * Returns the geometry of the specified area of interest, reading it from its survey file.
 * @param {object} params - The parameters.
 * @param {object} params.survey - The survey.
 * @param {string} params.name - The area of interest name.
 * @returns {Promise<AreaOfInterest|undefined>} - The geometry, or undefined if not defined or not readable.
 */
const getAreaOfInterest: AreaOfInterestProvider['getAreaOfInterest'] = async ({ survey, name }) => {
  const descriptor = Surveys.getAreaOfInterestByName({ survey, name })
  if (!descriptor) return undefined
  const surveyId = Survey.getId(survey)
  const { fileUuid } = descriptor
  const key = `${surveyId}_${fileUuid}`
  const cached = cacheGet(key)
  if (cached) return cached
  const areaOfInterest = await fetchAreaOfInterest({ surveyId, fileUuid })
  if (areaOfInterest) cachePut(key, areaOfInterest)
  return areaOfInterest
}

export const AreaOfInterestProviderDefault: AreaOfInterestProvider = { getAreaOfInterest }
```

- [ ] **Step 4: Plumbing**: next to every `taxonProvider` in the files listed above, add `areaOfInterestProvider`
  (destructure, forward); in the managers/jobs define `const areaOfInterestProvider = AreaOfInterestProviderDefault`
  next to `const categoryItemProvider = CategoryItemProviderDefault`. `recordValidationManager.js:64` passes it to
  arena-core `RecordValidator`; `recordNodesUpdaterCommon.afterNodesUpdate` passes it to `updateNodesDependents` and
  to the validation. Grep check: `grep -rn "taxonProvider" core/record server | grep -v areaOfInterestProvider`
  should list only the lines where a taxon is fetched directly (not a record evaluation).

- [ ] **Step 5: surveyManager / import**:
  - remove `includeAreaOfInterest` from `fetchSurveyAndNodeDefsBySurveyId` and
    `fetchSurveyAndNodeDefsAndRefDataBySurveyId`, and the `SurveyAreaOfInterestManager` import; delete the manager;
  - `updateSurveyProps`: `for (const fileUuid of SurveyAreaOfInterest.getAreaOfInterestFileUuids(surveyInfoUpdated))
    await SurveyFileManager.clearFileTemporaryFlag(surveyId, fileUuid, t)`;
  - `deleteUnusedSurveyFiles`: `usedFileUuids: new Set(SurveyAreaOfInterest.getAreaOfInterestFileUuids(surveyInfo))`;
  - `surveyFilesImportJob.js`: `...SurveyAreaOfInterest.getAreaOfInterestFileSummaries(surveyInfo)`.

- [ ] **Step 6: Run**: integration tests (058 and `013surveyFilesExportImportTest.js`, updated for two areas) → PASS;
  `yarn test:unit` → PASS; `yarn typecheck`, lint. Commit: `Areas of interest: server provider (cached by file uuid)`.

### Task 11: Survey info → Map: areas of interest table

**Files:**
- Create: `webapp/views/App/views/Home/SurveyInfo/AreasOfInterestEditor/AreasOfInterestEditor.tsx`,
  `AreaOfInterestDialog.tsx`, `index.ts`
- Delete: `webapp/views/App/views/Home/SurveyInfo/AreaOfInterestEditor.tsx`
- Modify: `webapp/views/App/views/Home/SurveyInfo/{SurveyInfoMap.js, SurveyInfo.js, store/useSurveyInfoForm.js}`
- Modify: `core/i18n/resources/*/homeView.js` (`surveyInfo.areasOfInterest`)

**Interfaces:**
- Consumes: `SurveyAreaOfInterest.*`, `SurveyAreaOfInterestValidator` (Task 8), `parseAreaOfInterestJson`,
  `API.insertSurveyFile`, `API.getSurveyFileDownloadUrl`.
- Produces: form setter `setAreasOfInterest(descriptors)` on `Survey.infoKeys.areasOfInterest`.

- [ ] **Step 1: Dialog** (`AreaOfInterestDialog.tsx`, model: `PreloadedMapLayerEditor.js`): props
  `{ areasOfInterest, editedAreaOfInterest, onClose, onOk }`; state `{ name, labels, file, areaOfInterest }`;
  `Input` for the name (`homeView:surveyInfo.areasOfInterest.name`), `LabelsEditor`, `Dropzone` (accept
  `.geojson`/`.json`, max `AREA_OF_INTEREST_MAX_FILE_SIZE_MB`; the dropped file is parsed with
  `parseAreaOfInterestJson(await file.text())`, invalid → `notifyWarning('homeView:surveyInfo.areaOfInterest.invalidFile')`).
  The draft descriptor (`newAreaOfInterestDescriptor` with a new file uuid when a file was dropped, otherwise the
  edited one with the new name/labels) is validated with `SurveyAreaOfInterestValidator`; OK disabled when invalid.
  On OK: when a file was dropped, upload `new File([JSON.stringify(areaOfInterest)], file.name, { type: geojson })`
  as temporary survey file (as the current `uploadAreaOfInterest`), then `onOk(descriptor)`.

- [ ] **Step 2: Table** (`AreasOfInterestEditor.tsx`, model: `PreloadedMapLayersEditor.js`): `fieldset` with legend
  `homeView:surveyInfo.areasOfInterest.title`, info text (reuse `areaOfInterest.info`, mention the expression
  functions), `ButtonAdd`, `DataGrid` columns name, label (preferred lang), file name, polygons, vertices, actions
  (download `ButtonDownload href=API.getSurveyFileDownloadUrl({ surveyId, fileUuid })`, edit, delete with confirm
  `homeView:surveyInfo.areasOfInterest.confirmDelete`). Read-only: no add/edit/delete.

- [ ] **Step 3: Wire**: `useSurveyInfoForm.js` `setAreasOfInterest = (value) => setObjectField(Survey.infoKeys.areasOfInterest, value)`;
  `SurveyInfo.js` / `SurveyInfoMap.js` pass `areasOfInterest` / `setAreasOfInterest`.

- [ ] **Step 4: i18n** `homeView.js` (8 languages): `surveyInfo.areasOfInterest: { title, info, name, label, fileName,
  polygons, vertices, confirmDelete, editor: { title } }`; remove the unused `areaOfInterest` keys except
  `invalidFile`. Check with the i18n consistency unit test (if any) / grep.

- [ ] **Step 5: Verify** in the browser on the worktree server (9091): add two areas, rename one, delete one, save,
  reload. Lint, typecheck. Commit: `Areas of interest: editor in Survey info → Map`.

### Task 12: Expression editor

**Files:**
- Modify: `core/expressionParser/helpers/functions.ts` (`geoAOIContaining`)
- Modify: `webapp/components/expression/nodes/call/callGeoDistanceToAOIBoundaryEditor.tsx`,
  `webapp/components/expression/nodes/call/functions.js`, `webapp/components/expression/functionExamples.js`
- Create: `webapp/components/expression/nodes/call/callGeoAOIContainingEditor.tsx`
- Modify: `core/i18n/resources/*/common.js` (`expressionEditor.*`, function descriptions)

- [ ] **Step 1: `geoDistanceToAOIBoundary` editor**: coordinate `Identifier` (filter
  `coordinateVarFilterFn`) + `Dropdown` of `SurveyAreaOfInterest.getAreaOfInterestNames(surveyInfo)`
  (`expressionEditor.areaOfInterest` label); initial values from `expressionNode.arguments[0].name` and
  `StringUtils.unquote(arguments[1].value)`; on change, when both are set,
  `onConfirm(Expression.newCall({ callee, params: [identifier, Expression.newLiteral(Strings.quote(name))] }))`.
  Warning `areaOfInterestNotDefined` when the survey has no areas (text: "No areas of interest defined yet: define
  them in Survey info → Map").

- [ ] **Step 2: `geoAOIContaining` editor**: `CallSingleParameterEditor` with
  `callee=functionNames.geoAOIContaining`, coordinate filter, the same warning.

- [ ] **Step 3: Function list / examples / descriptions** (8 languages):
  `geoDistanceToAOIBoundary(coordinate_attribute, 'area_name')` (< 0 inside, > 0 outside);
  `geoAOIContaining(coordinate_attribute)` (name of the first area containing the location, empty if none).

- [ ] **Step 4: Verify** manually (worktree server): build both calls in the advanced expression editor of a
  read-only attribute; the expression with an unknown area name shows the validation error. Commit:
  `Areas of interest: expression editor`.

### Task 13: E2E, docs, PR

**Files:**
- Modify: `test/e2e/fixtures/seed/areaOfInterestSurvey.ts`, `test/e2e/specs/areaOfInterest.spec.ts`,
  `test/e2e/helpers/*` if the AOI UI helpers exist
- Modify: `CHANGELOG` entry and What's new item (mention multiple areas and `geoAOIContaining`), keep the ASSEDEV
  credit with the full name and the link https://www.assedev.fr/
- Modify: `docs/superpowers/plans/2026-10-28-survey-area-of-interest.md` (note pointing to this plan)

- [ ] **Step 1: Seed**: `areasOfInterest: [newAreaOfInterestDescriptor({ name: 'pilot_area', ... })]`, expression
  `Math.round(geoDistanceToAOIBoundary(location, 'pilot_area'))`.
- [ ] **Step 2: Spec**: the Survey info → Map test adds an area through the dialog (name, file), checks the row
  (polygons / vertices), reloads, deletes it. The data entry test is unchanged apart from the seed.
- [ ] **Step 3: Run**: in the worktree (`git -C ../arena-wt-mobile-survey-package checkout survey-area-of-interest`,
  `yarn build`, server on `PORT=9091 PGDATABASE=arena_e2e ADMIN_PASSWORD=<random>`), `yarn test:e2e specs/areaOfInterest.spec.ts` → PASS.
  Stop the server, switch the worktree back to its branch.
- [ ] **Step 4: Full checks**: `yarn test:unit`, `yarn test:integration`, `yarn typecheck` (no new errors), lint.
- [ ] **Step 5: Commit, push, update the PR #4588 body** (`gh api -X PATCH repos/openforis/arena/pulls/4588 -F body=@file`;
  `gh pr edit` fails), watch the checks / reviews, fix and reply to each finding.

---

## Arena Mobile (separate plan, after openforis/arena-mobile#289)

Provider reading `surveyfiles/<fileUuid>.bin` from the survey package folder (cached by file uuid), passed as
`areaOfInterestProvider` wherever the app passes `categoryItemProvider` to arena-core.
