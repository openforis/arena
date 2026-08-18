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

## Task 1: Migrate each survey's schema right before its data migration job runs

> **Revised after Task 1's task review** (see ledger): the original version of
> this task put the `DBMigrator.migrateSurveySchema` call inside
> `SurveyDataMigrationJob.execute()`. `Job.start()` unconditionally wraps
> `execute()` in `client.tx(...)` (`server/job/job.js:74-82`, documented on
> the class itself: "execute (in tx)"), so that call ran while the job's own
> transaction held a pool connection open — the same anti-pattern
> `SurveyManager.insertSurvey`/`importSurvey` were deliberately rewritten to
> avoid (`server/modules/survey/manager/surveyManager.js:119-123`), with a
> dedicated regression test guarding it
> (`test/integration/tests/_survey/surveyTest.js:28-30`: "used to hold a db
> transaction open while DBMigrator.migrateSurveySchema acquired another
> connection from the same pool; concurrent survey creations could then
> exhaust the pool and hang the whole server"). Confirmed with the human
> partner: move the call out of `SurveyDataMigrationJob` entirely and into
> `AllSurveysDataMigrationJob`'s per-survey loop, immediately before starting
> the inner job — schema migration, then the data-migration job (which stamps
> `appVersion` as its last, in-transaction step), strictly in that order per
> survey, so a crash mid-loop leaves already-completed surveys correctly
> stamped and not re-run, while the next survey in line is safely retried
> from scratch (schema migration is idempotent).
>
> Note this still runs inside `AllSurveysDataMigrationJob`'s own transaction
> (`Job.start()` wraps every job's `execute()`, with no subclass opt-out —
> confirmed in `server/job/job.js`, there is no way around this within the
> current `Job` base class). That is a deliberate, narrower tradeoff than the
> original finding: this job runs as a single sequential background process
> from one startup invocation, not on a concurrent request path the way
> `insertSurvey`/`importSurvey` are, so it does not reproduce the original
> concurrent-pool-exhaustion bug — but it is not a full elimination of the
> nested-connection shape either. Flag this plainly when reporting rather
> than treating it as fully resolved.

**Repo:** `arena` (`/home/stefano/dev/projects/openforis/arena`)

**Files:**
- Modify: `server/modules/survey/service/dataMigration/surveyDataMigrationJob.js` (revert to its pre-Task-1 form — no schema migration call)
- Modify: `server/modules/survey/service/dataMigration/allSurveysDataMigrationJob.js` (add the schema migration call to the per-survey loop)

**Interfaces:**
- Consumes: `DBMigrator.migrateSurveySchema(surveyId: number): Promise<void>` — already exported by `@openforis/arena-server` and already used the same way (unconditionally, no client/tx param) in `server/modules/survey/manager/surveyManager.js`'s `insertSurvey`/`importSurvey`.
- Produces: no change to either job's external shape — `AllSurveysDataMigrationJob` is still constructed and enqueued from `appCluster.js` exactly as today (Task 2 doesn't touch this).

- [ ] **Step 1: Revert `surveyDataMigrationJob.js` to its original form**

If the commit from the previous attempt at this task is still present (`git log --oneline -- server/modules/survey/service/dataMigration/surveyDataMigrationJob.js`), revert its content to exactly this (no `DBMigrator` import, no schema-migration call — this file goes back to doing only what it did before this plan started):

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

- [ ] **Step 2: Add the schema migration call to `allSurveysDataMigrationJob.js`**

Current content:

```js
import Job from '@server/job/job'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import { isSurveyDataMigrationPending } from './surveyDataMigrationSteps'
import SurveyDataMigrationJob from './surveyDataMigrationJob'

/**
 * Filters the given surveys, keeping only the ones whose stored app version is lower than the latest
 * survey data migration version, i.e. the ones that still need to be migrated.
 * @param {Array<{ id: number, appVersion: string }>} surveys - The surveys to filter.
 * @returns {Array<{ id: number, appVersion: string }>} - The surveys that still need to be migrated.
 */
export const getSurveysToMigrate = (surveys) =>
  surveys.filter(({ appVersion }) => isSurveyDataMigrationPending({ appVersion }))

/**
 * Job that migrates every survey whose stored app version is behind the latest survey data migration
 * version. For each survey to migrate, it runs a `SurveyDataMigrationJob` in its own transaction, tolerating
 * and logging per-survey errors so that a single failing survey does not block the others. Modeled on
 * `SurveysRdbRefreshJob`.
 */
export default class AllSurveysDataMigrationJob extends Job {
  constructor(params) {
    super(AllSurveysDataMigrationJob.type, params)
  }

  async execute() {
    const surveys = await SurveyManager.fetchSurveyIdsAndAppVersions()
    const surveysToMigrate = getSurveysToMigrate(surveys)
    this.total = surveysToMigrate.length

    const surveyIdsWithErrors = []
    for (const { id: surveyId, appVersion } of surveysToMigrate) {
      if (this.isCanceled()) return
      try {
        this.logDebug(`migrating data for survey ${surveyId}`)
        const innerJob = new SurveyDataMigrationJob({ surveyId, surveyAppVersion: appVersion })
        await innerJob.start() // own transaction, like SurveysRdbRefreshJob's inner job

        if (innerJob.isSucceeded()) {
          this.logDebug(`data for survey ${surveyId} migrated successfully`)
          this.incrementProcessedItems()
        } else {
          surveyIdsWithErrors.push(surveyId)
          this.logWarn(`could not migrate data for survey ${surveyId}: inner job did not succeed`)
        }
      } catch (error) {
        surveyIdsWithErrors.push(surveyId)
        this.logError(`error migrating data for survey ${surveyId}: ${error.stack || error}`)
      }
    }
    this.result = { surveyIdsWithErrors }
  }
}

AllSurveysDataMigrationJob.type = 'AllSurveysDataMigrationJob'
```

Replace it with:

```js
import { DBMigrator } from '@openforis/arena-server'

import Job from '@server/job/job'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import { isSurveyDataMigrationPending } from './surveyDataMigrationSteps'
import SurveyDataMigrationJob from './surveyDataMigrationJob'

/**
 * Filters the given surveys, keeping only the ones whose stored app version is lower than the latest
 * survey data migration version, i.e. the ones that still need to be migrated.
 * @param {Array<{ id: number, appVersion: string }>} surveys - The surveys to filter.
 * @returns {Array<{ id: number, appVersion: string }>} - The surveys that still need to be migrated.
 */
export const getSurveysToMigrate = (surveys) =>
  surveys.filter(({ appVersion }) => isSurveyDataMigrationPending({ appVersion }))

/**
 * Job that migrates every survey whose stored app version is behind the latest survey data migration
 * version. For each survey to migrate, it first brings the survey's DDL schema up to date
 * (`DBMigrator.migrateSurveySchema`, idempotent), then runs a `SurveyDataMigrationJob` in its own transaction
 * to apply the data-migration steps and stamp the survey's app version — strictly in that order, so a crash
 * partway through leaves already-completed surveys correctly stamped (and not re-run) while the rest are
 * safely retried on the next startup. Tolerates and logs per-survey errors so that a single failing survey
 * does not block the others. Modeled on `SurveysRdbRefreshJob`.
 */
export default class AllSurveysDataMigrationJob extends Job {
  constructor(params) {
    super(AllSurveysDataMigrationJob.type, params)
  }

  async execute() {
    const surveys = await SurveyManager.fetchSurveyIdsAndAppVersions()
    const surveysToMigrate = getSurveysToMigrate(surveys)
    this.total = surveysToMigrate.length

    const surveyIdsWithErrors = []
    for (const { id: surveyId, appVersion } of surveysToMigrate) {
      if (this.isCanceled()) return
      try {
        this.logDebug(`migrating schema for survey ${surveyId}`)
        await DBMigrator.migrateSurveySchema(surveyId)

        this.logDebug(`migrating data for survey ${surveyId}`)
        const innerJob = new SurveyDataMigrationJob({ surveyId, surveyAppVersion: appVersion })
        await innerJob.start() // own transaction, like SurveysRdbRefreshJob's inner job

        if (innerJob.isSucceeded()) {
          this.logDebug(`data for survey ${surveyId} migrated successfully`)
          this.incrementProcessedItems()
        } else {
          surveyIdsWithErrors.push(surveyId)
          this.logWarn(`could not migrate data for survey ${surveyId}: inner job did not succeed`)
        }
      } catch (error) {
        surveyIdsWithErrors.push(surveyId)
        this.logError(`error migrating survey ${surveyId}: ${error.stack || error}`)
      }
    }
    this.result = { surveyIdsWithErrors }
  }
}

AllSurveysDataMigrationJob.type = 'AllSurveysDataMigrationJob'
```

- [ ] **Step 3: Lint**

Run: `npx eslint --cache --fix server/modules/survey/service/dataMigration/surveyDataMigrationJob.js server/modules/survey/service/dataMigration/allSurveysDataMigrationJob.js`
Expected: no errors.

- [ ] **Step 4: Run the unit test suite**

Run: `yarn test:unit`
Expected: PASS — `test/unit/tests/040surveyDataMigrationJob.test.js` only exercises `getPendingSurveyDataMigrationSteps`/`getSurveysToMigrate`, which are unchanged by this task.

- [ ] **Step 5: Commit**

```bash
git add server/modules/survey/service/dataMigration/surveyDataMigrationJob.js server/modules/survey/service/dataMigration/allSurveysDataMigrationJob.js
git commit -m "fix: migrate survey schema before starting its data migration job, not inside it"
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
- Modify: `test/unit/tests/039surveyDataMigrationSteps.test.js` — found during implementation, missed when this plan was written: it asserts `expect(surveyDataMigrationSteps).toHaveLength(1)`, which must become `toHaveLength(2)` for the same reason as the two assertions in Step 1 below. Its other assertion (`latestSurveyDataMigrationVersion` is `'2.5.6'`) is unaffected and stays as-is.

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
