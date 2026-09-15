# Category GeoPackage Export Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a category with a `location` extra property (dataType `geometryPoint`) be exported as a `.gpkg` (OGC GeoPackage) file for QGIS/QField, and add category-creation/conversion actions that pre-populate that fixed `location` property (optionally locked against edits) for two templates: "Sampling point data" and "GeoPackage".

**Architecture:** No new persisted category "type" — GeoPackage-category-ness is derived from having a `location`/`geometryPoint` extra prop. A generalized `locked` flag on individual extra-prop-def entries (replacing the one hardcoded `reportingData`/`area` rule) protects that field from rename/retype/delete once set. Two new manager functions (`convertCategoryToSamplingPointData`, `convertCategoryToGeoPackage`) inject the `location` extra prop, reused both at category-creation time (webapp chains create → convert) and later via a "convert existing category" menu action, mirroring the existing `convertCategoryToReportingData`. The `.gpkg` file itself is built by a new background Job, reusing the existing category-export SQL query and reprojecting every point to EPSG:4326 with the same `Points`/`proj4` helper already used by `GeoJsonDataExportJob`.

**Tech Stack:** Node.js/Express, PostgreSQL via pg-promise, React/Redux Toolkit, `@openforis/arena-core` (`Points`, `UUIDs`), new dependency `@ngageoint/geopackage` (pure JS, no native GDAL).

## Global Constraints

- Design spec: `docs/superpowers/specs/2026-09-02-category-geopackage-export-design.md` — every task below implements part of it; deviations from it must be called out explicitly in the task, not silently made.
- `@ngageoint/geopackage` is pinned at `^4.2.9` (latest non-beta on npm as of this plan; `5.x` is beta). All API usage below (`GeoPackageAPI`, `GeometryColumns`, `FeatureColumn`, `GeometryType`, `GeoPackageDataType`) is verified against that exact tagged source (`github.com/ngageoint/geopackage-js` at tag `4.2.9`), not guessed from memory — do not "helpfully" swap in a different method name without re-checking that tag.
- Server-side new code follows this repo's existing module layering: `repository/` → `manager/` → `service/` → `api/`. Reuse `categoryExportRepository.js`'s existing SQL query rather than writing a new one.
- Only add English (`core/i18n/resources/en/*.js`) translation strings. Other languages (`pt`, `fr`, `es`, `mn`, `ru`) are out of scope for this plan — that's a separate translation pass, consistent with how new English-only strings land in this codebase already (see `core/i18n/resources/<lang>/common.js` — other languages fall back to English at runtime for missing keys).
- Every server-side task with logic worth unit/integration testing must include the test, per this repo's `yarn test:unit` / `yarn test:integration` conventions (see CLAUDE.md). Webapp-only tasks (React components/hooks) have no existing component-test framework in this repo — verify those manually with `yarn watch`, per CLAUDE.md's "start the dev server and use the feature in a browser" rule.

---

## Task 1: Generalize the locked extra-prop-def flag

**Files:**
- Modify: `core/survey/extraPropDef.js`
- Modify: `core/survey/extraPropDefsUpdater.js`
- Modify: `core/survey/category.js`
- Modify: `server/modules/category/manager/categoryManager.js:590-648` (`convertCategoryToReportingData`)
- Test: `test/unit/tests/030extraPropDefLocked.test.js` (new)

**Interfaces:**
- Produces: `ExtraPropDef.newItem({ dataType, index, locked })` (new optional `locked` param, default `false`); `ExtraPropDef.isLocked(extraPropDefOrItem)`; `Category.isExtraPropDefReadOnly(extraPropDef)()` now takes the extra-prop-def itself as the only signal (category arg kept for call-site compatibility but ignored).
- Consumes: nothing from other tasks — this is the foundation task.

Today only one hardcoded rule exists: a `reportingData` category's `area` extra prop is read-only (`Category.isExtraPropDefReadOnly` in `core/survey/category.js:160-161`). This task replaces it with a `locked` boolean stored directly on the extra-prop-def entry, reusable by the new Sampling Point Data / GeoPackage templates (Task 2).

- [ ] **Step 1: Write the failing unit test**

Create `test/unit/tests/030extraPropDefLocked.test.js`:

```js
import { ExtraPropDef } from '@core/survey/extraPropDef'
import * as Category from '@core/survey/category'
import { ExtraPropDefsUpdater } from '@core/survey/extraPropDefsUpdater'

describe('ExtraPropDef locked flag', () => {
  it('newItem defaults locked to false', () => {
    const item = ExtraPropDef.newItem({ dataType: ExtraPropDef.dataTypes.text })
    expect(ExtraPropDef.isLocked(item)).toBe(false)
  })

  it('newItem stores locked when true', () => {
    const item = ExtraPropDef.newItem({ dataType: ExtraPropDef.dataTypes.geometryPoint, locked: true })
    expect(ExtraPropDef.isLocked(item)).toBe(true)
  })

  it('Category.isExtraPropDefReadOnly is true only for a locked extra def', () => {
    const category = Category.newCategory()
    const lockedDef = { ...ExtraPropDef.newItem({ dataType: ExtraPropDef.dataTypes.geometryPoint, locked: true }), name: 'location' }
    const unlockedDef = { ...ExtraPropDef.newItem({ dataType: ExtraPropDef.dataTypes.text, locked: false }), name: 'notes' }
    expect(Category.isExtraPropDefReadOnly(lockedDef)(category)).toBe(true)
    expect(Category.isExtraPropDefReadOnly(unlockedDef)(category)).toBe(false)
  })

  it('updateOrDeleteExtraDef preserves the locked flag of defs it is not editing', async () => {
    const extraPropDefs = {
      location: ExtraPropDef.newItem({ dataType: ExtraPropDef.dataTypes.geometryPoint, index: 0, locked: true }),
      notes: ExtraPropDef.newItem({ dataType: ExtraPropDef.dataTypes.text, index: 1, locked: false }),
    }
    // simulate renaming the unrelated 'notes' prop
    const updated = await ExtraPropDefsUpdater.updateOrDeleteExtraDef({
      extraPropDefs,
      propName: 'notes',
      extraPropDef: { name: 'notes_renamed', dataType: ExtraPropDef.dataTypes.text },
    })
    expect(ExtraPropDef.isLocked(updated.location)).toBe(true)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn build:test:unit && jest dist/__tests__/bundle.unit.js -t "ExtraPropDef locked flag"`
Expected: FAIL — `ExtraPropDef.isLocked` is not a function, `locked` param is silently dropped by `newItem`.

- [ ] **Step 3: Add the `locked` field to `ExtraPropDef`**

In `core/survey/extraPropDef.js`, add `locked` to `keys`, thread it through `newItem`, and add `isLocked`:

```js
const keys = {
  dataType: 'dataType',
  index: 'index',
  locked: 'locked',
  name: 'name',
  uuid: 'uuid',
}
```

```js
const newItem = ({ dataType, index = 0, locked = false }) => ({
  [keys.uuid]: UUIDs.v4(),
  [keys.dataType]: dataType,
  [keys.index]: index,
  [keys.locked]: locked,
})

const getDataType = A.propOr(dataTypes.text, keys.dataType)
const getIndex = A.propOr(0, keys.index)
const getName = A.prop(keys.name)
const isLocked = A.propOr(false, keys.locked)
```

Add `isLocked` to the exported `ExtraPropDef` object at the bottom of the file:

```js
export const ExtraPropDef = {
  keys,
  dataTypes,
  newItem,
  getDataType,
  getIndex,
  getName,
  isLocked,
  assocIndex,
  extraDefsToArray,
}
```

(`extraDefsToArray` spreads `...item` before overwriting `uuid`/`name`/`dataType`/`index`, so an existing `locked: true` on a stored item is already preserved through it — no change needed there.)

- [ ] **Step 4: Preserve `locked` through `ExtraPropDefsUpdater.updateOrDeleteExtraDef`**

In `core/survey/extraPropDefsUpdater.js`, the final `reduce` currently rebuilds every stored extra def via `ExtraPropDef.newItem({ dataType, index })`, which drops any `locked: true` on defs it isn't touching (e.g. editing one extra prop today silently unlocks every other locked extra prop, including `location`, on the same category). Fix:

```js
  // prepare itemExtraDefs for storage
  // - remove unnecessary information (uuid, name)
  // - index stored object by extra def name
  return itemExtraDefsArrayUpdated.reduce((acc, item, index) => {
    const name = ExtraPropDef.getName(item)
    const dataType = ExtraPropDef.getDataType(item)
    const locked = ExtraPropDef.isLocked(item)
    acc[name] = ExtraPropDef.newItem({ dataType, index, locked })
    return acc
  }, {})
```

- [ ] **Step 5: Generalize `Category.isExtraPropDefReadOnly`**

In `core/survey/category.js`, replace:

```js
export const isExtraPropDefReadOnly = (extraPropDef) => (category) =>
  isReportingData(category) && ExtraPropDef.getName(extraPropDef) === reportingDataItemExtraDefKeys.area
```

with:

```js
export const isExtraPropDefReadOnly = (extraPropDef) => () => ExtraPropDef.isLocked(extraPropDef)
```

Keep the currying shape (`(extraPropDef) => (category) => boolean`) so existing call sites like `Category.isExtraPropDefReadOnly(extraPropDef)(category)` in `webapp/components/survey/CategoryDetails/CategoryDetails.js:182` keep working unchanged (the `category` arg is now simply unused).

- [ ] **Step 6: Make `convertCategoryToReportingData` set `locked: true` on `area`**

In `server/modules/category/manager/categoryManager.js`, the `area` extra def injection (around line 603) becomes:

```js
      [Category.reportingDataItemExtraDefKeys.area]: ExtraPropDef.newItem({
        dataType: ExtraPropDef.dataTypes.number,
        index: Object.values(itemExtraDef).length,
        locked: true,
      }),
```

This is behavior-preserving: `isExtraPropDefReadOnly` already returned `true` for this def before, and still does — now via the `locked` flag instead of the hardcoded `reportingData && name === 'area'` check.

- [ ] **Step 7: Run test to verify it passes**

Run: `yarn build:test:unit && jest dist/__tests__/bundle.unit.js -t "ExtraPropDef locked flag"`
Expected: PASS

- [ ] **Step 8: Run the full unit suite to check nothing else broke**

Run: `yarn test:unit`
Expected: PASS (in particular, any existing reporting-data-related test still passes with the flag-based implementation).

- [ ] **Step 9: Commit**

```bash
git add core/survey/extraPropDef.js core/survey/extraPropDefsUpdater.js core/survey/category.js server/modules/category/manager/categoryManager.js test/unit/tests/030extraPropDefLocked.test.js
git commit -m "$(cat <<'EOF'
Generalize locked extra-prop-def flag on categories

Replaces the hardcoded reportingData/area read-only rule with a
locked boolean stored per extra-prop-def, reusable by upcoming
category templates (sampling point data, GeoPackage).

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Server — `convertCategoryToSamplingPointData` and `convertCategoryToGeoPackage`

**Files:**
- Modify: `server/modules/category/manager/categoryManager.js`
- Modify: `common/activityLog/activityLog.js`
- Modify: `core/i18n/resources/en/validationErrors.js`
- Test: `test/integration/tests/_survey/categoryTest.js`
- Test: `test/integration/tests/001surveyIntegrationtest.js`

**Interfaces:**
- Consumes: `ExtraPropDef.newItem({ dataType, index, locked })` from Task 1.
- Produces: `CategoryManager.convertCategoryToSamplingPointData({ user, surveyId, categoryUuid, locked = true }, client)` and `CategoryManager.convertCategoryToGeoPackage({ user, surveyId, categoryUuid, locked = true }, client)`, both returning the updated (and, for sampling point data, re-validated) category. Both are idempotent no-ops on the `location` extra prop if it already exists.

- [ ] **Step 1: Write the failing integration tests**

Add to `test/integration/tests/_survey/categoryTest.js` (append near the bottom, after `updateCategoryItemExtraDefTest`):

```js
export const convertCategoryToGeoPackageTest = async () => {
  const surveyId = getContextSurveyId()
  const user = getContextUser()

  const categoryReq = Category.newCategory({ name: 'category_geopackage_test' })
  const category = await CategoryManager.insertCategory({ user, surveyId, category: categoryReq })

  const categoryUpdated = await CategoryManager.convertCategoryToGeoPackage({
    user,
    surveyId,
    categoryUuid: Category.getUuid(category),
  })

  const locationDef = Category.getItemExtraDefsArray(categoryUpdated).find(
    (extraDef) => ExtraPropDef.getName(extraDef) === 'location'
  )
  expect(locationDef).toBeDefined()
  expect(ExtraPropDef.getDataType(locationDef)).toBe(ExtraPropDef.dataTypes.geometryPoint)
  expect(ExtraPropDef.isLocked(locationDef)).toBe(true)

  // idempotent: converting again does not duplicate or reset the extra def
  const categoryUpdatedAgain = await CategoryManager.convertCategoryToGeoPackage({
    user,
    surveyId,
    categoryUuid: Category.getUuid(category),
    locked: false,
  })
  expect(Category.getItemExtraDefsArray(categoryUpdatedAgain).length).toBe(1)
  expect(ExtraPropDef.isLocked(Category.getItemExtraDefsArray(categoryUpdatedAgain)[0])).toBe(true)
}

export const convertCategoryToSamplingPointDataTest = async () => {
  const surveyId = getContextSurveyId()
  const user = getContextUser()

  const categoryReq = Category.newCategory({ name: 'category_spd_test' })
  const category = await CategoryManager.insertCategory({ user, surveyId, category: categoryReq })

  const categoryUpdated = await CategoryManager.convertCategoryToSamplingPointData({
    user,
    surveyId,
    categoryUuid: Category.getUuid(category),
  })

  expect(Category.getName(categoryUpdated)).toBe('sampling_point_data')
  const locationDef = Category.getItemExtraDefsArray(categoryUpdated).find(
    (extraDef) => ExtraPropDef.getName(extraDef) === 'location'
  )
  expect(locationDef).toBeDefined()
  expect(ExtraPropDef.isLocked(locationDef)).toBe(true)
}

export const convertCategoryToSamplingPointDataDuplicateTest = async () => {
  const surveyId = getContextSurveyId()
  const user = getContextUser()

  // a sampling_point_data category already exists from convertCategoryToSamplingPointDataTest above
  const categoryReq = Category.newCategory({ name: 'category_spd_duplicate_test' })
  const category = await CategoryManager.insertCategory({ user, surveyId, category: categoryReq })

  await expect(
    CategoryManager.convertCategoryToSamplingPointData({
      user,
      surveyId,
      categoryUuid: Category.getUuid(category),
    })
  ).rejects.toThrow()
}
```

Add the `ExtraPropDef` import at the top of `categoryTest.js` if not already present (it is — see existing `import { ExtraPropDef } from '@core/survey/extraPropDef'` at line 7).

Wire the three new tests into `test/integration/tests/001surveyIntegrationtest.js`, next to the existing category tests (mirroring the existing `test('Create Category', ...)` line):

```js
  test('Convert Category To GeoPackage', async () => CategoryTest.convertCategoryToGeoPackageTest())
  test('Convert Category To Sampling Point Data', async () => CategoryTest.convertCategoryToSamplingPointDataTest())
  test('Convert Category To Sampling Point Data (duplicate)', async () =>
    CategoryTest.convertCategoryToSamplingPointDataDuplicateTest())
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `yarn test:integration`
Expected: FAIL — `CategoryManager.convertCategoryToGeoPackage` / `convertCategoryToSamplingPointData` are not functions.

- [ ] **Step 3: Add activity log types**

In `common/activityLog/activityLog.js`, next to the existing `categoryConvertToReportingData: 'categoryConvertToReportingData',` (line 34):

```js
  categoryConvertToReportingData: 'categoryConvertToReportingData',
  categoryConvertToSamplingPointData: 'categoryConvertToSamplingPointData',
  categoryConvertToGeoPackage: 'categoryConvertToGeoPackage',
```

- [ ] **Step 4: Add the duplicate-name validation error key**

In `core/i18n/resources/en/validationErrors.js`, add a `category` section (place it near the top-level, alongside the existing `categoryImport` section at line 38):

```js
  category: {
    samplingPointDataCategoryAlreadyExists:
      'A Sampling Point Data category already exists in this survey; there can be only one.',
  },
```

- [ ] **Step 5: Implement the two manager functions**

In `server/modules/category/manager/categoryManager.js`, add both functions immediately after `convertCategoryToReportingData` (after line 648):

```js
const locationExtraPropName = 'location'

export const convertCategoryToGeoPackage = async ({ user, surveyId, categoryUuid, locked = true }, client = db) =>
  client.tx(async (t) => {
    const category = await _fetchCategory({ surveyId, categoryUuid }, t)

    const itemExtraDef = Category.getItemExtraDef(category)
    if (locationExtraPropName in itemExtraDef) {
      // already has a 'location' extra prop; nothing to add
      return category
    }

    const itemExtraDefUpdated = {
      ...itemExtraDef,
      [locationExtraPropName]: ExtraPropDef.newItem({
        dataType: ExtraPropDef.dataTypes.geometryPoint,
        index: Object.values(itemExtraDef).length,
        locked,
      }),
    }
    const categoryUpdated = Category.assocItemExtraDef(itemExtraDefUpdated)(category)

    await CategoryRepository.updateCategoryProp(
      surveyId,
      categoryUuid,
      Category.keysProps.itemExtraDef,
      itemExtraDefUpdated,
      t
    )

    await Promise.all([
      markSurveyDraft(surveyId, t),
      ActivityLogRepository.insert(
        user,
        surveyId,
        ActivityLog.type.categoryConvertToGeoPackage,
        { [ActivityLog.keysContent.uuid]: categoryUuid },
        false,
        t
      ),
    ])
    return categoryUpdated
  })

export const convertCategoryToSamplingPointData = async (
  { user, surveyId, categoryUuid, locked = true },
  client = db
) =>
  client.tx(async (t) => {
    const category = await _fetchCategory({ surveyId, categoryUuid }, t)

    if (Category.getName(category) !== Survey.samplingPointDataCategoryName) {
      const categories = await CategoryRepository.fetchCategoriesBySurveyId({ surveyId, draft: true }, t)
      const duplicate = categories.find(
        (otherCategory) =>
          Category.getUuid(otherCategory) !== categoryUuid &&
          Category.getName(otherCategory) === Survey.samplingPointDataCategoryName
      )
      if (duplicate) {
        throw new SystemError('validationErrors:category.samplingPointDataCategoryAlreadyExists')
      }
    }

    let categoryUpdated = Category.assocProp({
      key: Category.keysProps.name,
      value: Survey.samplingPointDataCategoryName,
    })(category)
    await CategoryRepository.updateCategoryProp(
      surveyId,
      categoryUuid,
      Category.keysProps.name,
      Survey.samplingPointDataCategoryName,
      t
    )

    const itemExtraDef = Category.getItemExtraDef(categoryUpdated)
    if (!(locationExtraPropName in itemExtraDef)) {
      const itemExtraDefUpdated = {
        ...itemExtraDef,
        [locationExtraPropName]: ExtraPropDef.newItem({
          dataType: ExtraPropDef.dataTypes.geometryPoint,
          index: Object.values(itemExtraDef).length,
          locked,
        }),
      }
      categoryUpdated = Category.assocItemExtraDef(itemExtraDefUpdated)(categoryUpdated)
      await CategoryRepository.updateCategoryProp(
        surveyId,
        categoryUuid,
        Category.keysProps.itemExtraDef,
        itemExtraDefUpdated,
        t
      )
    }

    await Promise.all([
      markSurveyDraft(surveyId, t),
      ActivityLogRepository.insert(
        user,
        surveyId,
        ActivityLog.type.categoryConvertToSamplingPointData,
        { [ActivityLog.keysContent.uuid]: categoryUuid },
        false,
        t
      ),
    ])
    return _validateCategory({ surveyId, categoryUuid }, t)
  })
```

Both functions rely on `Survey`, `Category`, `CategoryRepository`, `ExtraPropDef`, `ActivityLog`, `ActivityLogRepository`, `SystemError`, `markSurveyDraft`, and `db` — all already imported at the top of `categoryManager.js`.

- [ ] **Step 6: Run tests to verify they pass**

Run: `yarn test:integration`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add server/modules/category/manager/categoryManager.js common/activityLog/activityLog.js core/i18n/resources/en/validationErrors.js test/integration/tests/_survey/categoryTest.js test/integration/tests/001surveyIntegrationtest.js
git commit -m "$(cat <<'EOF'
Add convertCategoryToGeoPackage / convertCategoryToSamplingPointData

Mirrors the existing convertCategoryToReportingData pattern: injects
a locked 'location' (geometryPoint) extra prop, and for sampling
point data also enforces the survey-wide singleton name convention.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Server — API routes for the two new convert actions

**Files:**
- Modify: `server/modules/category/service/categoryService.js`
- Modify: `server/modules/category/api/categoryApi.js`

**Interfaces:**
- Consumes: `CategoryManager.convertCategoryToSamplingPointData` / `convertCategoryToGeoPackage` from Task 2.
- Produces: `PUT /survey/:surveyId/categories/:categoryUuid/convertToSamplingPointData` and `PUT /survey/:surveyId/categories/:categoryUuid/convertToGeoPackage`, both `{ locked }` in the request body, both responding `{ category }`.

- [ ] **Step 1: Re-export the manager functions from the service layer**

In `server/modules/category/service/categoryService.js`, add both names to the existing re-export block (around line 254, next to `convertCategoryToReportingData`):

```js
  updateCategoryProp,
  updateCategoryItemExtraDefItem,
  cleanupCategory,
  convertCategoryToReportingData,
  convertCategoryToSamplingPointData,
  convertCategoryToGeoPackage,
  updateLevelProp,
```

- [ ] **Step 2: Add the two routes**

In `server/modules/category/api/categoryApi.js`, immediately after the existing `convertToReportingData` route (after line 540):

```js
  app.put(
    '/survey/:surveyId/categories/:categoryUuid/convertToSamplingPointData',
    AuthMiddleware.requireSurveyEditPermission,
    async (req, res, next) => {
      try {
        const { surveyId, categoryUuid, locked = true } = Request.getParams(req)
        const user = Request.getUser(req)

        const category = await CategoryService.convertCategoryToSamplingPointData({
          user,
          surveyId,
          categoryUuid,
          locked,
        })

        res.json({ category })
      } catch (error) {
        next(error)
      }
    }
  )

  app.put(
    '/survey/:surveyId/categories/:categoryUuid/convertToGeoPackage',
    AuthMiddleware.requireSurveyEditPermission,
    async (req, res, next) => {
      try {
        const { surveyId, categoryUuid, locked = true } = Request.getParams(req)
        const user = Request.getUser(req)

        const category = await CategoryService.convertCategoryToGeoPackage({
          user,
          surveyId,
          categoryUuid,
          locked,
        })

        res.json({ category })
      } catch (error) {
        next(error)
      }
    }
  )
```

- [ ] **Step 3: Verify manually**

Run: `yarn dev:server`, then from another terminal (adjust cookie/auth as needed for a locally logged-in session, or use the browser's dev tools Network tab after Task 5/6 land — this route is easiest to verify once the webapp wiring in Task 6 exists). At minimum, confirm the server starts cleanly with no import errors:

Run: `yarn build:server:dev`
Expected: build succeeds with no errors referencing `categoryApi.js` or `categoryService.js`.

- [ ] **Step 4: Commit**

```bash
git add server/modules/category/service/categoryService.js server/modules/category/api/categoryApi.js
git commit -m "$(cat <<'EOF'
Add convertToSamplingPointData / convertToGeoPackage category routes

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Webapp — API client + shared "lock fixed properties" dialog

**Files:**
- Modify: `webapp/service/api/categories/index.js`
- Create: `webapp/components/survey/CategoryList/LockFixedPropertiesDialog/LockFixedPropertiesDialog.js`
- Create: `webapp/components/survey/CategoryList/LockFixedPropertiesDialog/index.js`
- Modify: `core/i18n/resources/en/common.js`

**Interfaces:**
- Produces: `API.convertToSamplingPointDataCategory({ surveyId, categoryUuid, locked })`, `API.convertToGeoPackageCategory({ surveyId, categoryUuid, locked })`; `<LockFixedPropertiesDialog titleKey messageKey onClose onConfirm={({ locked }) => {}} />`, reused by both Task 5 (creation) and Task 6 (convert).
- Consumes: routes from Task 3.

- [ ] **Step 1: Add the API client functions**

In `webapp/service/api/categories/index.js`, next to `convertToReportingDataCategory` (line 171):

```js
export const convertToSamplingPointDataCategory = async ({ surveyId, categoryUuid, locked = true }) => {
  const {
    data: { category },
  } = await axios.put(`/api/survey/${surveyId}/categories/${categoryUuid}/convertToSamplingPointData`, { locked })

  return category
}

export const convertToGeoPackageCategory = async ({ surveyId, categoryUuid, locked = true }) => {
  const {
    data: { category },
  } = await axios.put(`/api/survey/${surveyId}/categories/${categoryUuid}/convertToGeoPackage`, { locked })

  return category
}
```

- [ ] **Step 2: Add the translation strings**

In `core/i18n/resources/en/common.js`, inside the existing `categoryEdit` block (after `convertToSimpleCategory`, around line 1304):

```js
    convertToSamplingPointDataCategory: {
      buttonLabel: 'Convert to Sampling Point Data',
      confirmMessage: `Convert this category to the Sampling Point Data category?

The category will be renamed to 'sampling_point_data' and a 'location' extra property will be added to the items.`,
    },
    convertToGeoPackageCategory: {
      buttonLabel: 'Convert to GeoPackage category',
      confirmMessage: `Convert this category to a GeoPackage category?

A 'location' extra property will be added to the items.`,
    },
    createCategory: {
      menuLabel: 'Add category',
      simple: 'Simple category',
    },
    createSamplingPointDataCategory: {
      buttonLabel: 'Sampling Point Data category',
      message: `Create a new Sampling Point Data category?

A 'location' extra property will be added to the items.`,
    },
    createGeoPackageCategory: {
      buttonLabel: 'GeoPackage category',
      message: `Create a new GeoPackage category?

A 'location' extra property will be added to the items.`,
    },
    lockFixedProperties: 'Lock fixed properties',
```

- [ ] **Step 3: Create the dialog component**

Create `webapp/components/survey/CategoryList/LockFixedPropertiesDialog/LockFixedPropertiesDialog.js`:

```jsx
import { useState } from 'react'
import PropTypes from 'prop-types'

import { Button, ButtonCancel } from '@webapp/components/buttons'
import { Checkbox } from '@webapp/components/form'
import { Modal, ModalBody, ModalFooter } from '@webapp/components/modal'
import { useI18n } from '@webapp/store/system'

export const LockFixedPropertiesDialog = (props) => {
  const { messageKey, onClose, onConfirm, titleKey } = props

  const i18n = useI18n()
  const [locked, setLocked] = useState(true)

  return (
    <Modal className="lock-fixed-properties-dialog" onClose={onClose} title={titleKey}>
      <ModalBody>
        <p>{i18n.t(messageKey)}</p>
        <Checkbox checked={locked} label="categoryEdit.lockFixedProperties" onChange={setLocked} />
      </ModalBody>
      <ModalFooter>
        <ButtonCancel className="modal-footer__item" onClick={onClose} />
        <Button className="modal-footer__item" label="common.confirm" onClick={() => onConfirm({ locked })} />
      </ModalFooter>
    </Modal>
  )
}

LockFixedPropertiesDialog.propTypes = {
  messageKey: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  titleKey: PropTypes.string.isRequired,
}
```

Create `webapp/components/survey/CategoryList/LockFixedPropertiesDialog/index.js`:

```js
export { LockFixedPropertiesDialog } from './LockFixedPropertiesDialog'
```

- [ ] **Step 4: Verify manually**

Run: `yarn build-dev` (or `yarn watch` if iterating live).
Expected: build succeeds, no import errors. This component has no consumer yet — full visual verification happens in Task 5.

- [ ] **Step 5: Commit**

```bash
git add webapp/service/api/categories/index.js webapp/components/survey/CategoryList/LockFixedPropertiesDialog core/i18n/resources/en/common.js
git commit -m "$(cat <<'EOF'
Add convert-to-template API client calls and lock-properties dialog

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Webapp — category creation menu (Simple / Sampling Point Data / GeoPackage)

**Files:**
- Modify: `webapp/components/survey/CategoryList/TableHeaderLeft/TableHeaderLeft.js`

**Interfaces:**
- Consumes: `API.createCategory`, `API.convertToSamplingPointDataCategory`, `API.convertToGeoPackageCategory` (Task 4), `LockFixedPropertiesDialog` (Task 4), `useCategoryByName` (`@webapp/store/survey`, existing).

- [ ] **Step 1: Replace the plain add button with a creation menu**

In `webapp/components/survey/CategoryList/TableHeaderLeft/TableHeaderLeft.js`, add imports:

```js
import { useState } from 'react'
import PropTypes from 'prop-types'
import { useNavigate } from 'react-router'
import { useDispatch } from 'react-redux'

import * as Survey from '@core/survey/survey'
import * as Category from '@core/survey/category'

import { useIsCategoriesRoute } from '@webapp/components/hooks'
import { Button, ButtonMenu } from '@webapp/components/buttons'
import { ButtonMenuExport } from '@webapp/components/buttons/ButtonMenuExport'
import { UploadButton } from '@webapp/components/form'

import { designerModules, appModuleUri } from '@webapp/app/appModules'
import * as API from '@webapp/service/api'
import { SurveyActions, useSurveyId, useCategoryByName } from '@webapp/store/survey'
import { useAuthCanEditSurvey } from '@webapp/store/user'

import { CategoryCloneFromSurveyDialog } from '../CategoryCloneFromSurveyDialog'
import { LockFixedPropertiesDialog } from '../LockFixedPropertiesDialog'
import { useActions, State } from '../store'
```

(Drop the `ButtonMetaItemAdd` import — it's no longer used here; `webapp/components/survey/ButtonMetaItemAdd/ButtonMetaItemAdd.js` itself is untouched and keeps serving taxonomy creation elsewhere.)

Replace the component body's add logic. The existing `onAdd` callback and `cloneFromSurveyDialogOpen` state stay as-is; add creation-menu state and handlers just above the `return`:

```js
  const samplingPointDataCategory = useCategoryByName(Survey.samplingPointDataCategoryName)
  const [templateDialogType, setTemplateDialogType] = useState(null) // 'samplingPointData' | 'geoPackage' | null

  const insertAndNotify = (category) => {
    dispatch(SurveyActions.surveyCategoryInserted(category))
    dispatch(SurveyActions.metaUpdated())
    onAdd(category)
  }

  const createSimpleCategory = async () => {
    const category = await API.createCategory({ surveyId })
    insertAndNotify(category)
  }

  const createTemplateCategory = async ({ locked }) => {
    const category = await API.createCategory({ surveyId })
    const categoryUuid = Category.getUuid(category)
    const categoryUpdated =
      templateDialogType === 'samplingPointData'
        ? await API.convertToSamplingPointDataCategory({ surveyId, categoryUuid, locked })
        : await API.convertToGeoPackageCategory({ surveyId, categoryUuid, locked })
    setTemplateDialogType(null)
    insertAndNotify(categoryUpdated)
  }
```

Replace the JSX `<ButtonMetaItemAdd onAdd={onAdd} metaItemType={metaItemTypes.category} />` line with:

```jsx
      <ButtonMenu
        iconClassName="icon-plus icon-16px icon-left"
        label="categoryEdit.createCategory.menuLabel"
        items={[
          {
            key: 'simple',
            label: 'categoryEdit.createCategory.simple',
            onClick: createSimpleCategory,
          },
          ...(samplingPointDataCategory
            ? []
            : [
                {
                  key: 'sampling-point-data',
                  label: 'categoryEdit.createSamplingPointDataCategory.buttonLabel',
                  onClick: () => setTemplateDialogType('samplingPointData'),
                },
              ]),
          {
            key: 'geopackage',
            label: 'categoryEdit.createGeoPackageCategory.buttonLabel',
            onClick: () => setTemplateDialogType('geoPackage'),
          },
        ]}
        size="small"
      />

      {templateDialogType && (
        <LockFixedPropertiesDialog
          titleKey={
            templateDialogType === 'samplingPointData'
              ? 'categoryEdit.createSamplingPointDataCategory.buttonLabel'
              : 'categoryEdit.createGeoPackageCategory.buttonLabel'
          }
          messageKey={
            templateDialogType === 'samplingPointData'
              ? 'categoryEdit.createSamplingPointDataCategory.message'
              : 'categoryEdit.createGeoPackageCategory.message'
          }
          onClose={() => setTemplateDialogType(null)}
          onConfirm={createTemplateCategory}
        />
      )}
```

- [ ] **Step 2: Verify manually**

Run: `yarn watch`, open a survey's Categories designer view.
Expected:
1. The add-category control is now a menu button; clicking it shows "Simple category", "Sampling Point Data category" (unless the survey already has one — create one via this menu once, then reopen the menu and confirm the option is gone), and "GeoPackage category".
2. "Simple category" creates a blank category exactly as before (navigates into it, empty extra props).
3. "GeoPackage category" opens the lock dialog; confirming (checkbox on by default) creates a category with a `location` extra prop that shows as locked (open Edit extra properties — the `location` row's name/dataType fields and delete button should be disabled).
4. "Sampling Point Data category" behaves the same but the created category is named `sampling_point_data`, and doing this twice — the option should no longer be present after the first one exists.

- [ ] **Step 3: Commit**

```bash
git add webapp/components/survey/CategoryList/TableHeaderLeft/TableHeaderLeft.js
git commit -m "$(cat <<'EOF'
Add category creation menu (Simple / Sampling Point Data / GeoPackage)

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Webapp — "convert existing category" actions

**Files:**
- Create: `webapp/components/survey/CategoryDetails/store/actions/category/useConvertToSamplingPointDataCategory.js`
- Create: `webapp/components/survey/CategoryDetails/store/actions/category/useConvertToGeoPackageCategory.js`
- Modify: `webapp/components/survey/CategoryDetails/store/actions/index.js`
- Modify: `webapp/components/survey/CategoryDetails/CategoryDetails.js`

**Interfaces:**
- Consumes: `API.convertToSamplingPointDataCategory` / `convertToGeoPackageCategory` (Task 4), `LockFixedPropertiesDialog` (Task 4), `useInit` (existing, same file this task's hooks live next to).
- Produces: `Actions.convertToSamplingPointDataCategory({ categoryUuid, onCategoryUpdate })`, `Actions.convertToGeoPackageCategory({ categoryUuid, onCategoryUpdate })`, wired into `useActions`.

Unlike `useConvertToReportingDataCategory` (which uses the generic text-only `DialogConfirmActions.showDialogConfirm`), these two need the checkbox, so they render `LockFixedPropertiesDialog` directly from `CategoryDetails.js` rather than going through the global confirm-dialog store — the same reasoning that led Task 5 to use the dialog as a controlled component rather than `DialogConfirmActions`.

- [ ] **Step 1: Create the two action hooks**

Create `webapp/components/survey/CategoryDetails/store/actions/category/useConvertToSamplingPointDataCategory.js`:

```js
import { useCallback } from 'react'

import * as API from '@webapp/service/api'
import { useNotifyError } from '@webapp/components/hooks'
import { useSurveyId } from '@webapp/store/survey'

import { useInit } from './useInit'

export const useConvertToSamplingPointDataCategory = ({ setState }) => {
  const surveyId = useSurveyId()
  const init = useInit({ setState })
  const notifyError = useNotifyError()

  return useCallback(
    async ({ categoryUuid, locked, onCategoryUpdate }) => {
      try {
        await API.convertToSamplingPointDataCategory({ surveyId, categoryUuid, locked })
        await init({ categoryUuid, onCategoryUpdate })
      } catch (error) {
        const { key, params } = error?.response?.data ?? {}
        notifyError({ key: key ?? 'appErrors:generic', params })
      }
    },
    [surveyId]
  )
}
```

Create `webapp/components/survey/CategoryDetails/store/actions/category/useConvertToGeoPackageCategory.js`:

```js
import { useCallback } from 'react'

import * as API from '@webapp/service/api'
import { useSurveyId } from '@webapp/store/survey'

import { useInit } from './useInit'

export const useConvertToGeoPackageCategory = ({ setState }) => {
  const surveyId = useSurveyId()
  const init = useInit({ setState })

  return useCallback(
    async ({ categoryUuid, locked, onCategoryUpdate }) => {
      await API.convertToGeoPackageCategory({ surveyId, categoryUuid, locked })
      await init({ categoryUuid, onCategoryUpdate })
    },
    [surveyId]
  )
}
```

(`useNotifyError` comes from `@webapp/components/hooks`, the same hook used by `CategoryCloneFromSurveyDialog.tsx`; the GeoPackage conversion has no duplicate-name failure mode so it doesn't need the try/catch.)

- [ ] **Step 2: Wire both into `useActions`**

In `webapp/components/survey/CategoryDetails/store/actions/index.js`, add the imports next to `useConvertToReportingDataCategory`:

```js
import { useConvertToReportingDataCategory } from './category/useConvertToReportingDataCategory'
import { useConvertToSamplingPointDataCategory } from './category/useConvertToSamplingPointDataCategory'
import { useConvertToGeoPackageCategory } from './category/useConvertToGeoPackageCategory'
```

and add to the returned object, next to `convertToReportingDataCategory`:

```js
  convertToReportingDataCategory: useConvertToReportingDataCategory({ setState }),
  convertToSamplingPointDataCategory: useConvertToSamplingPointDataCategory({ setState }),
  convertToGeoPackageCategory: useConvertToGeoPackageCategory({ setState }),
```

- [ ] **Step 3: Wire the menu items and dialog into `CategoryDetails.js`**

Add imports:

```js
import * as Survey from '@core/survey/survey'
import { ExtraPropDef } from '@core/survey/extraPropDef'
import { useCategoryByName } from '@webapp/store/survey'

import { LockFixedPropertiesDialog } from '../CategoryList/LockFixedPropertiesDialog'
```

Inside the `CategoryDetails` component, next to the existing `readOnly`/`categoryUuid` locals, add:

```js
  const samplingPointDataCategory = useCategoryByName(Survey.samplingPointDataCategoryName)
  const hasLocationExtraProp = Category.getItemExtraDefsArray(category).some(
    (extraDef) =>
      ExtraPropDef.getName(extraDef) === 'location' && ExtraPropDef.getDataType(extraDef) === ExtraPropDef.dataTypes.geometryPoint
  )
  const isSamplingPointData = Category.getName(category) === Survey.samplingPointDataCategoryName

  const [convertDialogType, setConvertDialogType] = useState(null) // 'samplingPointData' | 'geoPackage' | null
```

(Add `import { useState } from 'react'` at the top if the file doesn't already import it — it currently doesn't, since all local state lives in the `useLocalState` store hook.)

Extend the gear `ButtonMenu`'s `items` array (currently only `convert-to-report-data-category` and `extra-props-editor`, lines 126-141) to:

```jsx
                <ButtonMenu
                  iconClassName="icon-cog icon-14px"
                  items={[
                    ...(!Category.isReportingData(category)
                      ? [
                          {
                            key: 'convert-to-report-data-category',
                            label: 'categoryEdit.convertToReportingDataCategory.buttonLabel',
                            onClick: () => Actions.convertToReportingDataCategory({ categoryUuid, onCategoryUpdate }),
                          },
                        ]
                      : []),
                    ...(!isSamplingPointData && !samplingPointDataCategory
                      ? [
                          {
                            key: 'convert-to-sampling-point-data-category',
                            label: 'categoryEdit.convertToSamplingPointDataCategory.buttonLabel',
                            onClick: () => setConvertDialogType('samplingPointData'),
                          },
                        ]
                      : []),
                    ...(!hasLocationExtraProp
                      ? [
                          {
                            key: 'convert-to-geopackage-category',
                            label: 'categoryEdit.convertToGeoPackageCategory.buttonLabel',
                            onClick: () => setConvertDialogType('geoPackage'),
                          },
                        ]
                      : []),
                    {
                      key: 'extra-props-editor',
                      label: 'extraProp.editor.title',
                      onClick: Actions.toggleEditExtraPropertiesPanel,
                    },
                  ]}
                />
```

Add the dialog near the other conditionally-rendered dialogs at the bottom of the component's JSX (after `{importSummary && <ImportSummary ... />}`):

```jsx
      {convertDialogType && (
        <LockFixedPropertiesDialog
          titleKey={
            convertDialogType === 'samplingPointData'
              ? 'categoryEdit.convertToSamplingPointDataCategory.buttonLabel'
              : 'categoryEdit.convertToGeoPackageCategory.buttonLabel'
          }
          messageKey={
            convertDialogType === 'samplingPointData'
              ? 'categoryEdit.convertToSamplingPointDataCategory.confirmMessage'
              : 'categoryEdit.convertToGeoPackageCategory.confirmMessage'
          }
          onClose={() => setConvertDialogType(null)}
          onConfirm={({ locked }) => {
            const action =
              convertDialogType === 'samplingPointData'
                ? Actions.convertToSamplingPointDataCategory
                : Actions.convertToGeoPackageCategory
            setConvertDialogType(null)
            action({ categoryUuid, locked, onCategoryUpdate })
          }}
        />
      )}
```

- [ ] **Step 4: Verify manually**

Run: `yarn watch`, open an existing simple category with no `location` extra prop.
Expected:
1. Gear menu shows "Convert to Sampling Point Data" and "Convert to GeoPackage category" (in addition to the existing reporting-data option).
2. Converting to GeoPackage adds a locked `location` extra prop; the menu item then disappears (category already has it).
3. Converting a *different* category to Sampling Point Data works once; attempting on a third category afterwards shows an error notification (duplicate name) instead of silently failing, and the menu item itself is hidden survey-wide once one exists.
4. Existing "Convert to Reporting Data" flow is unaffected.

- [ ] **Step 5: Commit**

```bash
git add webapp/components/survey/CategoryDetails/store/actions/category/useConvertToSamplingPointDataCategory.js webapp/components/survey/CategoryDetails/store/actions/category/useConvertToGeoPackageCategory.js webapp/components/survey/CategoryDetails/store/actions/index.js webapp/components/survey/CategoryDetails/CategoryDetails.js
git commit -m "$(cat <<'EOF'
Add convert-to-Sampling-Point-Data / GeoPackage category actions

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: `FileFormats.gpkg`, `Response.contentTypes.gpkg`, and the `@ngageoint/geopackage` dependency

**Files:**
- Modify: `core/fileFormats.ts`
- Modify: `server/utils/response.js`
- Modify: `package.json`

**Interfaces:**
- Produces: `FileFormats.gpkg === 'gpkg'`, `getExtensionByFileFormat('gpkg') === 'gpkg'`, `Response.contentTypes.gpkg === 'application/geopackage+sqlite3'`, `@ngageoint/geopackage` importable as `GeoPackageAPI`, `GeometryColumns`, `FeatureColumn`, `GeometryType`, `GeoPackageDataType`.
- Consumed by: Tasks 8-11.

- [ ] **Step 1: Add the dependency**

In `package.json`, add alphabetically (after `"@mui/x-tree-view"`, before `"@openforis/arena-server"`):

```json
    "@ngageoint/geopackage": "^4.2.9",
```

Run: `yarn install`
Expected: lockfile updated, install succeeds.

- [ ] **Step 2: Add the file format**

In `core/fileFormats.ts`:

```ts
export const FileFormats = {
  csv: 'csv',
  gpkg: 'gpkg',
  xlsx: 'xlsx',
  zip: 'zip',
} as const

const extensionByFileFormat = {
  [FileFormats.csv]: 'csv',
  [FileFormats.gpkg]: 'gpkg',
  [FileFormats.xlsx]: 'xlsx',
  [FileFormats.zip]: 'zip',
}
```

- [ ] **Step 3: Add the content type**

In `server/utils/response.js`:

```js
export const contentTypes = {
  csv: 'text/csv',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  gpkg: 'application/geopackage+sqlite3',
  json: 'application/json',
  pdf: 'application/pdf',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  zip: 'application/zip',
}

const contentTypeByFileFormat = {
  [FileFormats.csv]: contentTypes.csv,
  [FileFormats.gpkg]: contentTypes.gpkg,
  [FileFormats.xlsx]: contentTypes.xlsx,
  [FileFormats.zip]: contentTypes.zip,
}
```

- [ ] **Step 4: Verify the dependency resolves**

Run:
```bash
node -e "const { GeoPackageAPI, GeometryColumns, FeatureColumn, GeometryType, GeoPackageDataType } = require('@ngageoint/geopackage'); console.log(typeof GeoPackageAPI.create, typeof GeometryColumns, typeof FeatureColumn.createColumn, GeometryType.POINT, GeoPackageDataType.TEXT)"
```
Expected: prints `function object function 1 9` (exact numeric enum values may differ slightly by patch version — what matters is no `undefined`/throw).

- [ ] **Step 5: Commit**

```bash
git add package.json yarn.lock core/fileFormats.ts server/utils/response.js
git commit -m "$(cat <<'EOF'
Add gpkg file format and @ngageoint/geopackage dependency

Pure-JS GeoPackage writer, no native GDAL binary needed — fits the
existing Node/Docker deployment.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: Server — pure category-item → GeoJSON point feature builder

**Files:**
- Modify: `server/modules/category/manager/categoryExportManager.js` (export `parsePoint`)
- Create: `server/modules/category/manager/categoryGeoPackageFeatureBuilder.js`
- Test: `test/unit/tests/031categoryGeoPackageFeatureBuilder.test.js` (new)

**Interfaces:**
- Consumes: `Category.getItemExtraDefsArray`, `ExtraPropDef.getName/getDataType`, `CategoryExportFile.getExtraPropHeaders` (all existing), `parsePoint` (newly exported from `categoryExportManager.js`), `Points.toLatLong` from `@openforis/arena-core`.
- Produces: `buildCategoryItemFeature({ category, row, languages, srsIndex })` → a GeoJSON `Feature` object, or `null` if `row.location` is missing/invalid. Consumed by Task 9's job.

This is deliberately a pure function (no DB, no file I/O) so it can be unit tested without a running Postgres instance or a real `.gpkg` file — the job in Task 9 is the thin, mostly-untested-directly wiring around it, consistent with this repo's convention of not unit-testing `execute()` bodies (see e.g. `docs/superpowers/plans/2026-08-27-job-jobbase-unification.md`'s sibling spec doc, `2026-08-17-survey-schema-category-migration-design.md`'s Verification plan).

- [ ] **Step 1: Export `parsePoint` from `categoryExportManager.js`**

In `server/modules/category/manager/categoryExportManager.js`, change:

```js
const parsePoint = (geometryPoint) => {
```

to:

```js
export const parsePoint = (geometryPoint) => {
```

No other change to that file — `transformGeometryPointExtraProperty` still calls it as a local reference, which still works since it's in the same module scope.

- [ ] **Step 2: Write the failing unit test**

Create `test/unit/tests/031categoryGeoPackageFeatureBuilder.test.js`:

```js
import * as Category from '@core/survey/category'
import { ExtraPropDef } from '@core/survey/extraPropDef'
import { buildCategoryItemFeature } from '@server/modules/category/manager/categoryGeoPackageFeatureBuilder'

const buildCategory = (extraDefs) => Category.assocItemExtraDef(extraDefs)(Category.newCategory())

describe('categoryGeoPackageFeatureBuilder', () => {
  it('builds a Point feature from a valid location value', () => {
    const category = buildCategory({
      location: ExtraPropDef.newItem({ dataType: ExtraPropDef.dataTypes.geometryPoint, index: 0, locked: true }),
    })
    const row = {
      code: '001',
      label_en: 'Site 1',
      description_en: '',
      location: 'SRID=EPSG:4326;POINT(12.5 41.9)',
    }
    const feature = buildCategoryItemFeature({ category, row, languages: ['en'], srsIndex: {} })

    expect(feature).toEqual({
      type: 'Feature',
      properties: { code: '001', label_en: 'Site 1', description_en: '' },
      geometry: { type: 'Point', coordinates: [12.5, 41.9] },
    })
  })

  it('returns null when location is missing', () => {
    const category = buildCategory({
      location: ExtraPropDef.newItem({ dataType: ExtraPropDef.dataTypes.geometryPoint, index: 0, locked: true }),
    })
    const row = { code: '001', label_en: 'Site 1', description_en: '', location: null }

    expect(buildCategoryItemFeature({ category, row, languages: ['en'], srsIndex: {} })).toBeNull()
  })

  it('returns null when location is not a parseable point', () => {
    const category = buildCategory({
      location: ExtraPropDef.newItem({ dataType: ExtraPropDef.dataTypes.geometryPoint, index: 0, locked: true }),
    })
    const row = { code: '001', label_en: 'Site 1', description_en: '', location: 'not a point' }

    expect(buildCategoryItemFeature({ category, row, languages: ['en'], srsIndex: {} })).toBeNull()
  })

  it('flattens a second geometryPoint extra prop into _x/_y/_srs attributes', () => {
    const category = buildCategory({
      location: ExtraPropDef.newItem({ dataType: ExtraPropDef.dataTypes.geometryPoint, index: 0, locked: true }),
      alt_location: ExtraPropDef.newItem({ dataType: ExtraPropDef.dataTypes.geometryPoint, index: 1 }),
    })
    const row = {
      code: '001',
      label_en: 'Site 1',
      description_en: '',
      location: 'SRID=EPSG:4326;POINT(12.5 41.9)',
      alt_location: 'SRID=EPSG:4326;POINT(13.0 42.0)',
    }
    const feature = buildCategoryItemFeature({ category, row, languages: ['en'], srsIndex: {} })

    expect(feature.properties).toEqual({
      code: '001',
      label_en: 'Site 1',
      description_en: '',
      alt_location_x: 13.0,
      alt_location_y: 42.0,
      alt_location_srs: 'EPSG:4326',
    })
  })

  it('carries other (non-geometry) extra props through as plain attributes', () => {
    const category = buildCategory({
      location: ExtraPropDef.newItem({ dataType: ExtraPropDef.dataTypes.geometryPoint, index: 0, locked: true }),
      notes: ExtraPropDef.newItem({ dataType: ExtraPropDef.dataTypes.text, index: 1 }),
    })
    const row = {
      code: '001',
      label_en: 'Site 1',
      description_en: '',
      location: 'SRID=EPSG:4326;POINT(12.5 41.9)',
      notes: 'hello',
    }
    const feature = buildCategoryItemFeature({ category, row, languages: ['en'], srsIndex: {} })

    expect(feature.properties.notes).toBe('hello')
  })
})
```

(`srsIndex: {}` works here because the test points are already `EPSG:4326`, so `Points.toLatLong` is effectively an identity transform and doesn't need a populated SRS index to reproject through `proj4` — no network/wasm dependency in this test.)

- [ ] **Step 3: Run test to verify it fails**

Run: `yarn build:test:unit && jest dist/__tests__/bundle.unit.js -t categoryGeoPackageFeatureBuilder`
Expected: FAIL — module not found.

- [ ] **Step 4: Implement `buildCategoryItemFeature`**

Create `server/modules/category/manager/categoryGeoPackageFeatureBuilder.js`:

```js
import { Points } from '@openforis/arena-core'

import * as Category from '@core/survey/category'
import { ExtraPropDef } from '@core/survey/extraPropDef'
import { CategoryExportFile } from '@core/survey/categoryExportFile'

import { parsePoint } from './categoryExportManager'

const locationExtraPropName = 'location'

/**
 * Builds a GeoJSON Point feature (geometry reprojected to EPSG:4326) from one row of the
 * category export query result, or returns null if the row has no valid 'location' value.
 * @param {!object} params - The parameters object.
 * @param {!object} params.category - The category the row belongs to.
 * @param {!object} params.row - One row from CategoryExportRepository.generateCategoryExportStream.
 * @param {!string[]} params.languages - Survey languages, used to pick label_<lang>/description_<lang> columns.
 * @param {!object} params.srsIndex - Survey SRS index, as returned by Survey.getSRSIndex.
 * @returns {object|null} A GeoJSON Feature, or null if the row has no valid location.
 */
export const buildCategoryItemFeature = ({ category, row, languages, srsIndex }) => {
  const point = parsePoint(row[locationExtraPropName])
  if (!point) return null

  const pointLatLong = Points.toLatLong(point, srsIndex)
  if (!pointLatLong) return null

  const properties = { code: row.code }
  languages.forEach((language) => {
    properties[`label_${language}`] = row[`label_${language}`] ?? null
    properties[`description_${language}`] = row[`description_${language}`] ?? null
  })

  const extraDefs = Category.getItemExtraDefsArray(category).filter(
    (extraDef) => ExtraPropDef.getName(extraDef) !== locationExtraPropName
  )
  extraDefs.forEach((extraDef) => {
    const extraDefName = ExtraPropDef.getName(extraDef)
    if (ExtraPropDef.getDataType(extraDef) === ExtraPropDef.dataTypes.geometryPoint) {
      const otherPoint = parsePoint(row[extraDefName])
      const [xHeader, yHeader, srsHeader] = CategoryExportFile.getExtraPropHeaders({ extraPropDef: extraDef })
      properties[xHeader] = otherPoint?.x ?? null
      properties[yHeader] = otherPoint?.y ?? null
      properties[srsHeader] = otherPoint?.srs ?? null
    } else {
      properties[extraDefName] = row[extraDefName] ?? null
    }
  })

  return {
    type: 'Feature',
    properties,
    geometry: { type: 'Point', coordinates: [pointLatLong.x, pointLatLong.y] },
  }
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `yarn build:test:unit && jest dist/__tests__/bundle.unit.js -t categoryGeoPackageFeatureBuilder`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add server/modules/category/manager/categoryExportManager.js server/modules/category/manager/categoryGeoPackageFeatureBuilder.js test/unit/tests/031categoryGeoPackageFeatureBuilder.test.js
git commit -m "$(cat <<'EOF'
Add pure category-item -> GeoJSON point feature builder

Extracted as a standalone, DB-free function so the geometry/attribute
mapping logic for GeoPackage export is unit-testable without a real
database or .gpkg file.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 9: Server — `CategoryGeoPackageExportJob`

**Files:**
- Create: `server/modules/category/service/CategoryGeoPackageExportJob.js`
- Test: `test/integration/tests/_survey/categoryGeoPackageExportTest.js` (new)
- Test: `test/integration/tests/001surveyIntegrationtest.js`

**Interfaces:**
- Consumes: `buildCategoryItemFeature` (Task 8), `CategoryExportRepository.generateCategoryExportStream` (existing), `GeoPackageAPI`/`GeometryColumns`/`FeatureColumn`/`GeometryType`/`GeoPackageDataType` (Task 7's dependency), `Survey.getSRSIndex`/`Survey.getLanguages` (existing).
- Produces: `CategoryGeoPackageExportJob` (a `Job` subclass, `type: 'CategoryGeoPackageExportJob'`), constructed with `{ user, surveyId, categoryUuid, draft }`, whose result is `{ tempFileName, skippedItems }`. Consumed by Task 10.

- [ ] **Step 1: Write the failing integration test**

Create `test/integration/tests/_survey/categoryGeoPackageExportTest.js`:

```js
import { GeoPackageAPI } from '@ngageoint/geopackage'

import * as Category from '@core/survey/category'
import * as CategoryLevel from '@core/survey/categoryLevel'
import * as CategoryItem from '@core/survey/categoryItem'
import { ExtraPropDef } from '@core/survey/extraPropDef'

import * as FileUtils from '@server/utils/file/fileUtils'
import * as CategoryManager from '@server/modules/category/manager/categoryManager'
import CategoryGeoPackageExportJob from '@server/modules/category/service/CategoryGeoPackageExportJob'

import { getContextSurveyId, getContextUser } from '../../config/context'

export const categoryGeoPackageExportTest = async () => {
  const surveyId = getContextSurveyId()
  const user = getContextUser()

  const categoryReq = Category.assocItemExtraDef({
    location: ExtraPropDef.newItem({ dataType: ExtraPropDef.dataTypes.geometryPoint, index: 0, locked: true }),
  })(Category.newCategory({ name: 'category_gpkg_export_test' }))
  const category = await CategoryManager.insertCategory({ user, surveyId, category: categoryReq })
  const categoryUuid = Category.getUuid(category)
  const level = Category.getLevelByIndex(0)(category)

  await CategoryManager.insertItem(
    user,
    surveyId,
    categoryUuid,
    CategoryItem.newItem(CategoryLevel.getUuid(level), null, {
      code: '001',
      labels: { en: 'Site with location' },
      extra: { location: 'SRID=EPSG:4326;POINT(12.5 41.9)' },
    })
  )
  await CategoryManager.insertItem(
    user,
    surveyId,
    categoryUuid,
    CategoryItem.newItem(CategoryLevel.getUuid(level), null, {
      code: '002',
      labels: { en: 'Site without location' },
      extra: {},
    })
  )

  const job = new CategoryGeoPackageExportJob({ user, surveyId, categoryUuid, draft: true })
  await job.start()

  expect(job.isSucceeded()).toBe(true)
  const { tempFileName, skippedItems } = job.result
  expect(skippedItems).toBe(1)

  const geoPackage = await GeoPackageAPI.open(FileUtils.tempFilePath(tempFileName))
  const featureDao = geoPackage.getFeatureDao('category_gpkg_export_test')
  expect(featureDao.count()).toBe(1)
  const featureRow = featureDao.queryForAll()[0]
  expect(featureDao.getRow(featureRow).getValue('code')).toBe('001')
  geoPackage.close()

  await FileUtils.deleteFileAsync(FileUtils.tempFilePath(tempFileName))
}
```

Wire it into `test/integration/tests/001surveyIntegrationtest.js`:

```js
import * as CategoryGeoPackageExportTest from './_survey/categoryGeoPackageExportTest'
// ...
  test('Export Category To GeoPackage', async () => CategoryGeoPackageExportTest.categoryGeoPackageExportTest())
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test:integration`
Expected: FAIL — `server/modules/category/service/CategoryGeoPackageExportJob` module not found.

- [ ] **Step 3: Implement the job**

Create `server/modules/category/service/CategoryGeoPackageExportJob.js`:

```js
import { GeoPackageAPI, GeometryColumns, FeatureColumn, GeometryType, GeoPackageDataType } from '@ngageoint/geopackage'

import * as Survey from '@core/survey/survey'
import * as Category from '@core/survey/category'
import { ExtraPropDef } from '@core/survey/extraPropDef'
import { CategoryExportFile } from '@core/survey/categoryExportFile'

import Job from '@server/job/job'
import * as FileUtils from '@server/utils/file/fileUtils'
import * as DbUtils from '@server/db/dbUtils'

import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as CategoryRepository from '../repository/categoryRepository'
import * as CategoryExportRepository from '../repository/categoryExportRepository'
import { buildCategoryItemFeature } from '../manager/categoryGeoPackageFeatureBuilder'

const locationExtraPropName = 'location'

const sanitizeTableName = (name) => (name || 'category').replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 63)

export default class CategoryGeoPackageExportJob extends Job {
  constructor(params) {
    super(CategoryGeoPackageExportJob.type, params)
  }

  async execute() {
    const { surveyId, categoryUuid, draft } = this.context

    const survey = await SurveyManager.fetchSurveyById({ surveyId, draft }, this.tx)
    const category = await CategoryRepository.fetchCategoryAndLevelsByUuid({ surveyId, categoryUuid, draft }, this.tx)
    const srsIndex = Survey.getSRSIndex(survey)
    const languages = Survey.getLanguages(survey)
    const levels = Category.getLevelsArray(category)
    const leafLevelIndex = levels.length - 1

    const tableName = sanitizeTableName(Category.getName(category))
    const tempFileName = FileUtils.newTempFileName()
    const tempFilePath = FileUtils.tempFilePath(tempFileName)
    this.setContext({ tempFileName })

    const geoPackage = await GeoPackageAPI.create(tempFilePath)

    const geometryColumns = new GeometryColumns()
    geometryColumns.table_name = tableName
    geometryColumns.column_name = 'geom'
    geometryColumns.geometry_type_name = 'POINT'
    geometryColumns.z = 0
    geometryColumns.m = 0

    const extraDefs = Category.getItemExtraDefsArray(category).filter(
      (extraDef) => ExtraPropDef.getName(extraDef) !== locationExtraPropName
    )

    let columnIndex = 0
    const columns = [
      FeatureColumn.createPrimaryKeyColumn(columnIndex++, 'id'),
      FeatureColumn.createGeometryColumn(columnIndex++, 'geom', GeometryType.POINT, false, null),
      FeatureColumn.createColumn(columnIndex++, 'code', GeoPackageDataType.TEXT),
      ...languages.flatMap((language) => [
        FeatureColumn.createColumn(columnIndex++, `label_${language}`, GeoPackageDataType.TEXT),
        FeatureColumn.createColumn(columnIndex++, `description_${language}`, GeoPackageDataType.TEXT),
      ]),
      ...extraDefs.flatMap((extraDef) =>
        CategoryExportFile.getExtraPropHeaders({ extraPropDef: extraDef }).map((header) =>
          FeatureColumn.createColumn(
            columnIndex++,
            header,
            ExtraPropDef.getDataType(extraDef) === ExtraPropDef.dataTypes.number
              ? GeoPackageDataType.REAL
              : GeoPackageDataType.TEXT
          )
        )
      ),
    ]

    geoPackage.createFeatureTable(tableName, geometryColumns, columns)

    const queryStream = CategoryExportRepository.generateCategoryExportStream({
      surveyId,
      category,
      languages,
      draft,
    })

    this.skippedItems = 0

    await DbUtils.stream({
      client: this.tx,
      queryStream,
      processor: async (dbStream) =>
        new Promise((resolve, reject) => {
          dbStream.on('data', (row) => {
            if (row.level_index !== leafLevelIndex) return
            const feature = buildCategoryItemFeature({ category, row, languages, srsIndex })
            if (!feature) {
              this.skippedItems += 1
              return
            }
            geoPackage.addGeoJSONFeatureToGeoPackage(feature, tableName)
            this.incrementProcessedItems()
          })
          dbStream.on('end', resolve)
          dbStream.on('error', reject)
        }),
    })

    geoPackage.close()
  }

  async beforeSuccess() {
    const { tempFileName } = this.context
    this.setResult({ tempFileName, skippedItems: this.skippedItems })
  }
}

CategoryGeoPackageExportJob.type = 'CategoryGeoPackageExportJob'
```

Notes on choices made here, in case they need revisiting during review:
- `row.level_index` and the `code`/`label_<lang>`/`description_<lang>` column names come directly from `generateCategoryExportQuery` in `categoryExportRepository.js` — no changes needed there.
- Leaf-only filtering (`row.level_index !== leafLevelIndex`) matches the design spec's decision; for the common case of a flat (single-level) category, every item is level 0, which is also the leaf, so nothing is filtered out.
- `geoPackage.createFeatureTable(tableName, geometryColumns, columns)` is called with default `boundingBox`/`srsId` params, which default to whole-world / EPSG:4326 — exactly the SRS this job reprojects every point into, so no explicit override is needed.

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn test:integration`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add server/modules/category/service/CategoryGeoPackageExportJob.js test/integration/tests/_survey/categoryGeoPackageExportTest.js test/integration/tests/001surveyIntegrationtest.js
git commit -m "$(cat <<'EOF'
Add CategoryGeoPackageExportJob

Builds one feature table per category export, points reprojected to
EPSG:4326, items without a valid location skipped (counted in the
job result) rather than failing the whole export.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 10: Server — start/download routes for the GeoPackage export

**Files:**
- Modify: `server/modules/category/service/categoryService.js`
- Modify: `server/modules/category/api/categoryApi.js`

**Interfaces:**
- Consumes: `CategoryGeoPackageExportJob` (Task 9), `FileFormats.gpkg`/`Response.contentTypes.gpkg` (Task 7).
- Produces: `POST /survey/:surveyId/categories/:categoryUuid/export/geopackage` (enqueue, responds `{ job }`), `GET /survey/:surveyId/categories/:categoryUuid/export/geopackage/download` (streams the file).

- [ ] **Step 1: Add the service function**

In `server/modules/category/service/categoryService.js`, add the import and function next to `exportAllCategories`:

```js
import CategoryGeoPackageExportJob from './CategoryGeoPackageExportJob'
```

```js
export const exportCategoryToGeoPackage = ({ user, surveyId, categoryUuid, draft }) => {
  const job = new CategoryGeoPackageExportJob({ user, surveyId, categoryUuid, draft })

  JobManager.enqueueJob(job)

  return job
}
```

- [ ] **Step 2: Add the routes**

In `server/modules/category/api/categoryApi.js`, after the existing single-category `export` GET route (after line 272):

```js
  app.post(
    '/survey/:surveyId/categories/:categoryUuid/export/geopackage',
    AuthMiddleware.requireSurveyEditPermission,
    async (req, res, next) => {
      try {
        const { surveyId, categoryUuid, draft = true } = Request.getParams(req)
        const user = Request.getUser(req)

        const job = CategoryService.exportCategoryToGeoPackage({ user, surveyId, categoryUuid, draft })
        res.json({ job })
      } catch (error) {
        next(error)
      }
    }
  )

  app.get(
    '/survey/:surveyId/categories/:categoryUuid/export/geopackage/download',
    AuthMiddleware.requireSurveyViewPermission,
    async (req, res, next) => {
      try {
        const { surveyId, categoryUuid, draft = true, tempFileName } = Request.getParams(req)
        const survey = await SurveyService.fetchSurveyById({ surveyId, draft })
        const surveyInfo = Survey.getSurveyInfo(survey)
        const category = await CategoryService.fetchCategoryAndLevelsByUuid({ surveyId, categoryUuid, draft })
        const name = `${Survey.getName(surveyInfo)}_${Category.getName(category)}.gpkg`
        const exportedFilePath = FileUtils.tempFilePath(tempFileName)

        Response.sendFile({
          res,
          path: exportedFilePath,
          name,
          contentType: Response.contentTypes.gpkg,
        })
      } catch (error) {
        next(error)
      }
    }
  )
```

(`Survey`, `Response`, `FileUtils`, `SurveyService`, `Category` are all already imported at the top of `categoryApi.js`.)

- [ ] **Step 3: Verify the build**

Run: `yarn build:server:dev`
Expected: succeeds, no import errors.

- [ ] **Step 4: Commit**

```bash
git add server/modules/category/service/categoryService.js server/modules/category/api/categoryApi.js
git commit -m "$(cat <<'EOF'
Add GeoPackage export start/download routes for a category

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 11: Webapp — GeoPackage export trigger

**Files:**
- Modify: `webapp/service/api/categories/index.js`
- Create: `webapp/components/survey/CategoryDetails/store/actions/category/useExportToGeoPackage.js`
- Modify: `webapp/components/survey/CategoryDetails/store/actions/index.js`
- Modify: `webapp/components/survey/CategoryDetails/CategoryDetails.js`
- Modify: `core/i18n/resources/en/common.js`

**Interfaces:**
- Consumes: routes from Task 10; `hasLocationExtraProp` local already computed in `CategoryDetails.js` by Task 6.

- [ ] **Step 1: Add the API client function**

In `webapp/service/api/categories/index.js`, next to `startExportAllCategoriesJob`:

```js
export const startExportCategoryToGeoPackageJob = async ({ surveyId, categoryUuid, draft = true }) => {
  const {
    data: { job },
  } = await axios.post(`/api/survey/${surveyId}/categories/${categoryUuid}/export/geopackage`, { draft })

  return { job }
}
```

- [ ] **Step 2: Add the translation string**

In `core/i18n/resources/en/common.js`, inside `categoryEdit` (next to `reportingData`):

```js
    exportToGeoPackage: 'Export to GeoPackage',
    exportToGeoPackageSkippedItems: '{{count}} item(s) without a valid location were skipped.',
```

- [ ] **Step 3: Create the export-trigger hook**

Create `webapp/components/survey/CategoryDetails/store/actions/category/useExportToGeoPackage.js`:

```jsx
import { useCallback } from 'react'
import { useDispatch } from 'react-redux'

import { ButtonDownload } from '@webapp/components/buttons'
import * as API from '@webapp/service/api'
import { JobActions } from '@webapp/store/app'
import { useI18n } from '@webapp/store/system'
import { useSurveyId } from '@webapp/store/survey'

export const useExportToGeoPackage = () => {
  const surveyId = useSurveyId()
  const dispatch = useDispatch()
  const i18n = useI18n()

  return useCallback(
    async ({ categoryUuid }) => {
      const { job } = await API.startExportCategoryToGeoPackageJob({ surveyId, categoryUuid })

      dispatch(
        JobActions.showJobMonitor({
          job,
          closeButton: ({ job: jobCompleted }) => {
            const { tempFileName, skippedItems } = jobCompleted.result
            return (
              <>
                {skippedItems > 0 && (
                  <p>{i18n.t('categoryEdit.exportToGeoPackageSkippedItems', { count: skippedItems })}</p>
                )}
                <ButtonDownload
                  href={`/api/survey/${surveyId}/categories/${categoryUuid}/export/geopackage/download`}
                  requestParams={{ tempFileName }}
                  onClick={() => dispatch(JobActions.hideJobMonitor())}
                  variant="contained"
                />
              </>
            )
          },
        })
      )
    },
    [dispatch, surveyId, i18n]
  )
}
```

- [ ] **Step 4: Wire it into `useActions`**

In `webapp/components/survey/CategoryDetails/store/actions/index.js`:

```js
import { useExportToGeoPackage } from './category/useExportToGeoPackage'
```

```js
  exportToGeoPackage: useExportToGeoPackage(),
```

- [ ] **Step 5: Add the export button to `CategoryDetails.js`**

Next to the existing `<ButtonMenuExport ... />` for CSV/XLSX (line 159-164), gated on `hasLocationExtraProp` (already computed by Task 6's changes to this file):

```jsx
            {hasLocationExtraProp && (
              <Button
                className="export-geopackage-btn"
                iconClassName="icon-download2 icon-14px"
                label="categoryEdit.exportToGeoPackage"
                onClick={() => Actions.exportToGeoPackage({ categoryUuid })}
                variant="outlined"
              />
            )}
```

- [ ] **Step 6: Verify manually**

Run: `yarn watch`, open a category with a `location` extra prop (e.g. one created via Task 5's GeoPackage template) and add at least one item with a location value and one without.
Expected:
1. "Export to GeoPackage" button is visible only on categories with a `location` geometryPoint extra prop.
2. Clicking it shows the job monitor, then a download button plus a "1 item(s) without a valid location were skipped" note.
3. Downloading and opening the file in QGIS (or `ogrinfo`/`file` if QGIS isn't available locally) shows one point feature with the expected attributes.

- [ ] **Step 7: Commit**

```bash
git add webapp/service/api/categories/index.js webapp/components/survey/CategoryDetails/store/actions/category/useExportToGeoPackage.js webapp/components/survey/CategoryDetails/store/actions/index.js webapp/components/survey/CategoryDetails/CategoryDetails.js core/i18n/resources/en/common.js
git commit -m "$(cat <<'EOF'
Add GeoPackage export button to category details

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Final verification

- [ ] Run `yarn test:unit && yarn test:integration` end-to-end once more after all 11 tasks land.
- [ ] Run `yarn build` to confirm the full production build (client + server) still succeeds with the new dependency and files.
- [ ] Manual end-to-end pass in the browser (`yarn watch`): create a GeoPackage category, add a couple of items with and without coordinates, export, open the file in QGIS or QField.
