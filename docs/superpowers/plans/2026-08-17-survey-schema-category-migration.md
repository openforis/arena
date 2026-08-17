# Survey Schema Migration + Category Item Index Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fold survey schema (DDL) migration and the category-item-index fix into the existing per-survey `SurveyDataMigrationJob`, and add the `arena-server` capability (on its own branch, not yet wired up) that will eventually let this app stop redundantly migrating every survey's schema at startup.

**Architecture:** Two independent repos, two independent halves:
1. `arena` (this repo): `SurveyDataMigrationJob` calls `DBMigrator.migrateSurveySchema(surveyId)` before its data steps; the category-item-index fix moves from a global, blocking, all-surveys startup pass into a versioned per-survey step, at its original version threshold; the now-empty global migrator is deleted.
2. `arena-server` (sibling repo `/home/stefano/dev/projects/openforis/arena-server`, new branch `feat/survey-migration`): `ArenaServer.init()` gets a new optional `migrateSurveySchemas` flag (default `true`, unchanged behavior) so a future consumer can skip the survey-schema loop while keeping the public-schema migration.

**Tech Stack:** Node.js/Express/pg-promise (both repos); TypeScript in `arena-server`, JavaScript in `arena`; Jest for tests in both.

## Global Constraints

- Full design/rationale lives in `docs/superpowers/specs/2026-08-17-survey-schema-category-migration-design.md` — read it if a task here is ambiguous.
- `arena-server`'s new `migrateSurveySchemas` option must default to `true` — every other consumer of `@openforis/arena-server` keeps today's behavior unchanged.
- Do **not** wire `arena`'s `appCluster.js` to actually pass `migrateSurveySchemas: false` yet, and do **not** bump `arena`'s `@openforis/arena-server` dependency version. That cutover is a deliberate future step, once `arena-server` publishes a release containing this change — out of scope here.
- `arena` tasks (1-4) commit to the current branch, `refactor/file-organization`. `arena-server` tasks (5-6) commit to a new branch, `feat/survey-migration`, in the sibling repo — never mix commits between the two repos/branches.
- Task order within `arena` matters: Task 2 (delete the global migrator) must land before Task 3 (rename the category function it calls), otherwise `server/system/dataMigrator/index.js` is left calling an export that no longer exists. Do not reorder.
- Neither repo's tests get new automated coverage for job/orchestration-level (`execute()`/`init()`) behavior — both codebases already establish that convention for this kind of code (see spec). Verify those parts manually; only pure-function/type-level changes get automated checks.
- Match each repo's existing code style exactly (JSDoc is required in `arena`, per its `CLAUDE.md`; `arena-server` has no such requirement and its existing files in this area carry no field-level doc comments — don't introduce a new commenting convention there).

---

## Task 1: Bundle survey schema migration into `SurveyDataMigrationJob`

**Repo:** `arena` (`/home/stefano/dev/projects/openforis/arena`)

**Files:**
- Modify: `server/modules/survey/service/dataMigration/surveyDataMigrationJob.js`

**Interfaces:**
- Consumes: `DBMigrator.migrateSurveySchema(surveyId: number): Promise<void>` — already exported by `@openforis/arena-server` and already used the same way (unconditionally, no client/tx param) in `server/modules/survey/manager/surveyManager.js`'s `insertSurvey`/`importSurvey`.
- Produces: no change to `SurveyDataMigrationJob`'s external shape (`execute()` still takes nothing, reads `this.context`/`this.tx` as today) — `AllSurveysDataMigrationJob`, which instantiates and starts it, needs no changes anywhere in this plan.

- [ ] **Step 1: Edit the file**

Current content:

```js
import { Versions } from '@openforis/arena-core'

import Job from '@server/job/job'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import { getCurrentAppVersionStamp, surveyDataMigrationSteps } from './surveyDataMigrationSteps'

/**
 * Determines the data migration steps that still need to be applied to a survey, given the app version
 * it was last migrated to.
 * @param {object} params - The parameters object.
 * @param {string} [params.surveyAppVersion] - The app version the survey was last migrated to (null/undefined is treated as '0.0.0').
 * @returns {Array<{ version: string, migrate: (params: { surveyId: number }) => Promise<void> }>} - The pending migration steps, in order.
 */
export const getPendingSurveyDataMigrationSteps = ({ surveyAppVersion }) =>
  surveyDataMigrationSteps.filter((step) => Versions.isLessThan(surveyAppVersion ?? '0.0.0', step.version))

/**
 * Job that applies every pending data migration step to a single survey, then stamps the survey with the
 * current application version. It is always run inside its own transaction (via `start()`) and it is meant
 * to be instantiated and started directly by `AllSurveysDataMigrationJob`, never registered/created from a
 * serialized job type.
 */
export default class SurveyDataMigrationJob extends Job {
  constructor(params) {
    super(SurveyDataMigrationJob.type, params)
  }

  async execute() {
    const { surveyId, surveyAppVersion } = this.context

    const stepsToRun = getPendingSurveyDataMigrationSteps({ surveyAppVersion })
    this.total = stepsToRun.length

    for (const step of stepsToRun) {
      await step.migrate({ surveyId })
      this.incrementProcessedItems()
    }

    await SurveyManager.updateSurveyAppVersion({ surveyId, version: getCurrentAppVersionStamp() }, this.tx)
  }
}

SurveyDataMigrationJob.type = 'SurveyDataMigrationJob'
```

Replace it with:

```js
import { Versions } from '@openforis/arena-core'
import { DBMigrator } from '@openforis/arena-server'

import Job from '@server/job/job'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import { getCurrentAppVersionStamp, surveyDataMigrationSteps } from './surveyDataMigrationSteps'

/**
 * Determines the data migration steps that still need to be applied to a survey, given the app version
 * it was last migrated to.
 * @param {object} params - The parameters object.
 * @param {string} [params.surveyAppVersion] - The app version the survey was last migrated to (null/undefined is treated as '0.0.0').
 * @returns {Array<{ version: string, migrate: (params: { surveyId: number }) => Promise<void> }>} - The pending migration steps, in order.
 */
export const getPendingSurveyDataMigrationSteps = ({ surveyAppVersion }) =>
  surveyDataMigrationSteps.filter((step) => Versions.isLessThan(surveyAppVersion ?? '0.0.0', step.version))

/**
 * Job that migrates a single survey's schema, then applies every pending data migration step to it, then
 * stamps the survey with the current application version. It is always run inside its own transaction (via
 * `start()`) and it is meant to be instantiated and started directly by `AllSurveysDataMigrationJob`, never
 * registered/created from a serialized job type.
 */
export default class SurveyDataMigrationJob extends Job {
  constructor(params) {
    super(SurveyDataMigrationJob.type, params)
  }

  async execute() {
    const { surveyId, surveyAppVersion } = this.context

    // Bring the survey's DDL schema up to date first; idempotent (db-migrate tracks applied migrations per
    // schema), so this is safe even though arena-server's own startup migration also still covers it today.
    await DBMigrator.migrateSurveySchema(surveyId)

    const stepsToRun = getPendingSurveyDataMigrationSteps({ surveyAppVersion })
    this.total = stepsToRun.length

    for (const step of stepsToRun) {
      await step.migrate({ surveyId })
      this.incrementProcessedItems()
    }

    await SurveyManager.updateSurveyAppVersion({ surveyId, version: getCurrentAppVersionStamp() }, this.tx)
  }
}

SurveyDataMigrationJob.type = 'SurveyDataMigrationJob'
```

- [ ] **Step 2: Lint**

Run: `npx eslint --cache --fix server/modules/survey/service/dataMigration/surveyDataMigrationJob.js`
Expected: no errors.

- [ ] **Step 3: Run the unit test suite**

Run: `yarn test:unit`
Expected: PASS — `test/unit/tests/040surveyDataMigrationJob.test.js` only exercises `getPendingSurveyDataMigrationSteps`, which is unchanged by this task.

- [ ] **Step 4: Commit**

```bash
git add server/modules/survey/service/dataMigration/surveyDataMigrationJob.js
git commit -m "feat: migrate survey schema alongside per-survey data migration"
```

---

## Task 2: Delete the now-empty global data migrator and wire `appCluster.js`

**Repo:** `arena`

**Files:**
- Delete: `server/system/dataMigrator/index.js`
- Modify: `server/system/appCluster.js`

**Interfaces:**
- Consumes: nothing new.
- Produces: `appCluster.run()`'s external behavior (still `export const run = async () => {...}`) is unchanged; only its internal startup sequence loses the `DataMigrator.migrateData` step. This also removes the last remaining caller of `CategoryService.initializeAllSurveysCategoryItemIndexes`, which Task 3 then safely renames/replaces.

Do this task **before** Task 3: `server/system/dataMigrator/index.js` currently calls
`CategoryService.initializeAllSurveysCategoryItemIndexes()`, and Task 3 removes that export. Deleting the caller first keeps every commit in a working state.

- [ ] **Step 1: Delete the file**

```bash
git rm server/system/dataMigrator/index.js
```

- [ ] **Step 2: Edit `server/system/appCluster.js`**

Remove this import:

```js
import { DataMigrator } from './dataMigrator'
```

Change:

```js
  const arenaApp = await ArenaServer.init()
  const { express: app, serviceRegistry } = arenaApp
```

to:

```js
  // ArenaServer.init() still synchronously migrates every survey's schema at startup, via arena-server's own
  // DBMigrator.migrateAll() (public schema + a loop over every survey's schema). That survey-schema loop is
  // now redundant with SurveyDataMigrationJob's own DBMigrator.migrateSurveySchema call (below), but there's
  // currently no way to opt out of just that loop while keeping the public-schema migration this app still
  // needs synchronously here. arena-server's feat/survey-migration branch adds ArenaServer.init({
  // migrateSurveySchemas: false }) for exactly this; once a release containing it is published and this
  // repo's @openforis/arena-server dependency is bumped, switch to it here and remove this redundancy.
  const arenaApp = await ArenaServer.init()
  const { express: app, serviceRegistry } = arenaApp
```

Remove this block entirely:

```js
  // Data migrations
  await DataMigrator.migrateData({ logger, serviceRegistry })

```

(Leave the `// run files storage check after DB migrations` comment and the `SurveyFileService.checkFilesStorage()` call immediately after it untouched — `serviceRegistry` keeps its other use later in the file, for `infoService.updateVersion()`.)

- [ ] **Step 3: Confirm nothing else references the deleted module**

Run: `grep -rn "system/dataMigrator\|from './dataMigrator'" server`
Expected: no output.

- [ ] **Step 4: Lint**

Run: `npx eslint --cache --fix server/system/appCluster.js`
Expected: no errors.

- [ ] **Step 5: Run the unit test suite**

Run: `yarn test:unit`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add server/system/appCluster.js
git commit -m "refactor: drop the now-empty global data migrator"
```

---

## Task 3: Replace the all-surveys category-item-index function with a per-survey one

**Repo:** `arena`

**Files:**
- Modify: `server/modules/category/manager/categoryItemIndexInitializer.js`
- Modify: `server/modules/category/manager/categoryManager.js`
- Modify: `server/modules/category/service/categoryService.js`

**Interfaces:**
- Consumes: `CategoryRepository.fetchCategoriesAndLevelsBySurveyId({ surveyId, draft }, client)`, `initializeSurveyCategoryItemsIndexes({ surveyId, category }, client)` — both already exist in `categoryItemIndexInitializer.js`, unchanged.
- Produces: `initializeCategoryItemIndexesForSurvey({ surveyId }, client = db): Promise<void>`, exported from `categoryItemIndexInitializer.js`, re-exported through `categoryManager.js` and `categoryService.js`. Task 4 imports it as `CategoryManager.initializeCategoryItemIndexesForSurvey`.

- [ ] **Step 1: Edit `categoryItemIndexInitializer.js`**

Remove the `SurveyRepository` import (its only use was in the function being deleted):

```js
import * as SurveyRepository from '@server/modules/survey/repository/surveyRepository'
```

Replace the final function in the file:

```js
export const initializeAllSurveysCategoryItemIndexes = async () => {
  logger.debug(`initilizing category item indexes. Fetching survey IDs...`)
  const surveyIds = await SurveyRepository.fetchAllSurveyIds()

  logger.debug(`${surveyIds.length} surveys found`)

  let processed = 0
  for (const surveyId of surveyIds) {
    logger.debug(`initializing indexes for survey ${surveyId}...`)
    await db.tx(async (t) => {
      const categoriesByUuid = await CategoryRepository.fetchCategoriesAndLevelsBySurveyId({ surveyId, draft: true }, t)

      for (const category of Object.values(categoriesByUuid)) {
        await initializeSurveyCategoryItemsIndexes({ surveyId, category }, t)
      }
    })
    logger.debug(
      `indexes for survey ${surveyId} initialized. Progress ${Math.floor((++processed * 100) / surveyIds.length)}%`
    )
  }
  logger.debug(`category item indexes initialization complete`)
}
```

with:

```js
/**
 * Initializes (fixes) the item indexes of every category in a single survey, in one transaction.
 * @param {object} params - The parameters object.
 * @param {number} params.surveyId - The survey id.
 * @param {pgPromise.IDatabase} [client] - The database client.
 * @returns {Promise<void>} - A promise resolving to void.
 */
export const initializeCategoryItemIndexesForSurvey = async ({ surveyId }, client = db) => {
  await client.tx(async (t) => {
    const categoriesByUuid = await CategoryRepository.fetchCategoriesAndLevelsBySurveyId({ surveyId, draft: true }, t)

    for (const category of Object.values(categoriesByUuid)) {
      await initializeSurveyCategoryItemsIndexes({ surveyId, category }, t)
    }
  })
}
```

- [ ] **Step 2: Edit `categoryManager.js`**

Change:

```js
export {
  initializeSurveyCategoryItemsIndexes,
  initializeAllSurveysCategoryItemIndexes,
} from './categoryItemIndexInitializer'
```

to:

```js
export {
  initializeSurveyCategoryItemsIndexes,
  initializeCategoryItemIndexesForSurvey,
} from './categoryItemIndexInitializer'
```

- [ ] **Step 3: Edit `categoryService.js`**

Find the destructure block that currently reads (near the end of the file):

```js
  initializeSurveyCategoryItemsIndexes,
  initializeAllSurveysCategoryItemIndexes,
} = CategoryManager
```

Change it to:

```js
  initializeSurveyCategoryItemsIndexes,
  initializeCategoryItemIndexesForSurvey,
} = CategoryManager
```

- [ ] **Step 4: Confirm nothing else references the deleted export**

Run: `grep -rn "initializeAllSurveysCategoryItemIndexes" server core webapp test common`
Expected: no output (Task 2 already deleted the one caller, `server/system/dataMigrator/index.js`; this confirms there's no other one).

- [ ] **Step 5: Lint**

Run: `npx eslint --cache --fix server/modules/category/manager/categoryItemIndexInitializer.js server/modules/category/manager/categoryManager.js server/modules/category/service/categoryService.js`
Expected: no errors.

- [ ] **Step 6: Run the unit test suite**

Run: `yarn test:unit`
Expected: PASS (no existing test references this module).

- [ ] **Step 7: Commit**

```bash
git add server/modules/category/manager/categoryItemIndexInitializer.js server/modules/category/manager/categoryManager.js server/modules/category/service/categoryService.js
git commit -m "refactor: replace all-surveys category item index initializer with a per-survey one"
```

---

## Task 4: Add the category-item-index step to the per-survey migration registry

**Repo:** `arena`

**Files:**
- Modify: `server/modules/survey/service/dataMigration/surveyDataMigrationSteps.js`
- Modify: `test/unit/tests/040surveyDataMigrationJob.test.js`

**Interfaces:**
- Consumes: `CategoryManager.initializeCategoryItemIndexesForSurvey({ surveyId })` from Task 3.
- Produces: `surveyDataMigrationSteps` now has 2 entries (`2.3.20`, `2.5.6`); `latestSurveyDataMigrationVersion` is unchanged (`2.5.6`, still the max).

- [ ] **Step 1: Update the test first, to lock in the expected new step count**

In `test/unit/tests/040surveyDataMigrationJob.test.js`, change:

```js
describe('getPendingSurveyDataMigrationSteps', () => {
  it('returns all steps when the survey has no stored app version', () => {
    const steps = getPendingSurveyDataMigrationSteps({ surveyAppVersion: null })
    expect(steps).toHaveLength(1)
    expect(steps[0].version).toBe(latestSurveyDataMigrationVersion)
  })

  it('returns all steps when the survey app version is older than every step', () => {
    const steps = getPendingSurveyDataMigrationSteps({ surveyAppVersion: '1.0.0' })
    expect(steps).toHaveLength(1)
  })
```

to:

```js
describe('getPendingSurveyDataMigrationSteps', () => {
  it('returns all steps when the survey has no stored app version', () => {
    const steps = getPendingSurveyDataMigrationSteps({ surveyAppVersion: null })
    expect(steps).toHaveLength(2)
    expect(steps.map((step) => step.version)).toEqual(['2.3.20', latestSurveyDataMigrationVersion])
  })

  it('returns all steps when the survey app version is older than every step', () => {
    const steps = getPendingSurveyDataMigrationSteps({ surveyAppVersion: '1.0.0' })
    expect(steps).toHaveLength(2)
  })
```

(The other two tests in this `describe` block — `'returns no steps when...'` — are unaffected and stay as-is; they already assert `toHaveLength(0)` against `latestSurveyDataMigrationVersion`/`'99.0.0'`, which is still correct since `latestSurveyDataMigrationVersion` doesn't change.)

- [ ] **Step 2: Run the test to verify it now fails**

Run: `yarn test:unit`
Expected: FAIL on the two edited assertions in `040surveyDataMigrationJob.test.js` (actual length is still 1, since the new step hasn't been added yet).

- [ ] **Step 3: Add the new step**

In `server/modules/survey/service/dataMigration/surveyDataMigrationSteps.js`, change:

```js
import { Versions } from '@openforis/arena-core'

import * as ProcessUtils from '@core/processUtils'
import * as SurveyFileManager from '@server/modules/survey/manager/surveyFileManager'

/**
 * Ordered list of per-survey data migration steps.
 * Each step is applied to a survey when its stored app version is lower than the step's version threshold.
 * @type {Array<{ version: string, migrate: (params: { surveyId: number }) => Promise<void> }>}
 */
export const surveyDataMigrationSteps = [
  {
    version: '2.5.6', // formerly versionWithNewFilePathFormat in server/system/dataMigrator/index.js
    migrate: async ({ surveyId }) => {
      await SurveyFileManager.migrateFilesToNewPathFormat({ surveyId })
    },
  },
  // future per-survey migration steps are appended here, each with its own version threshold
]
```

to:

```js
import { Versions } from '@openforis/arena-core'

import * as ProcessUtils from '@core/processUtils'
import * as CategoryManager from '@server/modules/category/manager/categoryManager'
import * as SurveyFileManager from '@server/modules/survey/manager/surveyFileManager'

/**
 * Ordered list of per-survey data migration steps.
 * Each step is applied to a survey when its stored app version is lower than the step's version threshold.
 * @type {Array<{ version: string, migrate: (params: { surveyId: number }) => Promise<void> }>}
 */
export const surveyDataMigrationSteps = [
  {
    version: '2.3.20', // formerly versionWithCategoryItemIndexFix in server/system/dataMigrator/index.js
    migrate: async ({ surveyId }) => {
      await CategoryManager.initializeCategoryItemIndexesForSurvey({ surveyId })
    },
  },
  {
    version: '2.5.6', // formerly versionWithNewFilePathFormat in server/system/dataMigrator/index.js
    migrate: async ({ surveyId }) => {
      await SurveyFileManager.migrateFilesToNewPathFormat({ surveyId })
    },
  },
  // future per-survey migration steps are appended here, each with its own version threshold
]
```

- [ ] **Step 4: Run the test to verify it now passes**

Run: `yarn test:unit`
Expected: PASS.

- [ ] **Step 5: Lint**

Run: `npx eslint --cache --fix server/modules/survey/service/dataMigration/surveyDataMigrationSteps.js test/unit/tests/040surveyDataMigrationJob.test.js`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add server/modules/survey/service/dataMigration/surveyDataMigrationSteps.js test/unit/tests/040surveyDataMigrationJob.test.js
git commit -m "feat: add category item index fix as a per-survey data migration step"
```

---

## Task 5: Create the `feat/survey-migration` branch in `arena-server`

**Repo:** `arena-server` (`/home/stefano/dev/projects/openforis/arena-server`)

**Files:** none yet — branch setup only.

- [ ] **Step 1: Make sure the local checkout is clean and up to date**

Run: `git -C /home/stefano/dev/projects/openforis/arena-server status --short --branch`
Expected: `## master...origin/master` with no changed files. If there are unexpected local changes, stop and check with the user before proceeding — don't discard anything.

- [ ] **Step 2: Create and switch to the new branch**

```bash
git -C /home/stefano/dev/projects/openforis/arena-server checkout -b feat/survey-migration
```

Expected: `Switched to a new branch 'feat/survey-migration'`.

---

## Task 6: Add the `migrateSurveySchemas` init option to `arena-server`

**Repo:** `arena-server`, branch `feat/survey-migration`

**Files:**
- Modify: `src/server/arenaServer/initApp.ts`
- Modify: `src/server/arenaServer/index.ts`

**Interfaces:**
- Produces: `InitAppOptions.migrateSurveySchemas?: boolean` (new optional field, default `true` when `init()` reads it). `ArenaServer.init(options?: InitAppOptions)` now branches: `migrateSurveySchemas !== false` (i.e. `true` or unset) → `DBMigrator.migrateAll()` (unchanged behavior); `migrateSurveySchemas === false` → `DBMigrator.migrateSchema()` only (public schema, no survey loop).

- [ ] **Step 1: Edit `src/server/arenaServer/initApp.ts`**

Change:

```ts
export interface InitAppOptions {
  fileSizeLimit?: number
  bodyParseLimit?: string
}
```

to:

```ts
export interface InitAppOptions {
  fileSizeLimit?: number
  bodyParseLimit?: string
  // Whether ArenaServer.init() should also migrate every survey's schema during startup. Defaults to true.
  // Set to false to only run the public schema migration here and leave survey schema migration to the caller
  // (e.g. a per-survey migration job) — the public schema migration always still runs.
  migrateSurveySchemas?: boolean
}
```

- [ ] **Step 2: Edit `src/server/arenaServer/index.ts`**

Change:

```ts
const init = async (options?: InitAppOptions): Promise<ArenaApp> => {
  initServices()
  if (!ProcessEnv.disableDbMigrations) {
    await DBMigrator.migrateAll()
  }
  return initApp(options)
}
```

to:

```ts
const init = async (options?: InitAppOptions): Promise<ArenaApp> => {
  initServices()
  if (!ProcessEnv.disableDbMigrations) {
    const { migrateSurveySchemas = true } = options ?? {}
    if (migrateSurveySchemas) {
      await DBMigrator.migrateAll()
    } else {
      await DBMigrator.migrateSchema()
    }
  }
  return initApp(options)
}
```

- [ ] **Step 3: Lint**

Run: `cd /home/stefano/dev/projects/openforis/arena-server && npx eslint --fix src/server/arenaServer/index.ts src/server/arenaServer/initApp.ts`
Expected: no errors.

- [ ] **Step 4: Type-check**

Run: `cd /home/stefano/dev/projects/openforis/arena-server && yarn tsc:test`
Expected: completes with no type errors (this compiles the whole `src/` tree per `tsconfig.json`, including the two edited files — it does not require a database connection).

- [ ] **Step 5: Commit**

```bash
cd /home/stefano/dev/projects/openforis/arena-server
git add src/server/arenaServer/initApp.ts src/server/arenaServer/index.ts
git commit -m "feat: add migrateSurveySchemas option to ArenaServer.init()"
```

Do not push this branch or open a PR — confirm with the user first (this repo's branch/push/PR actions are shared-state and out of this plan's scope; no arena-server release/consumption cutover happens yet).

---

## Manual Verification (both repos)

1. In `arena`, with `yarn dev:server` against a dev DB containing at least one survey with a `NULL` or pre-`2.5.6` `app_version`: confirm the server logs show, for that survey, the schema migration running, then the category-item-index step, then the file-path step, in that order, and that the survey's `app_version` ends up stamped at `2.5.6` afterward.
2. Confirm a category with un-indexed items on an affected survey ends up with populated indexes after the job runs.
3. Confirm `server/system/dataMigrator` no longer exists and the server still starts cleanly.
4. In `arena-server`, on `feat/survey-migration`: confirm `yarn tsc:test` and `yarn lint` both pass on the whole tree (not just the two edited files), so the new option didn't break any other consumer of `InitAppOptions`/`ArenaServer.init`.
