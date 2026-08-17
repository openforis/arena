# Survey Schema Migration + Category Item Index Migration, Folded Into the Per-Survey Data Migration Job

## Purpose

`server/system/appCluster.js` currently runs three separate migration
mechanisms at startup:

1. `ArenaServer.init()` (from `@openforis/arena-server`) synchronously runs
   `DBMigrator.migrateAll()` — the `public` schema migration, then a loop
   that runs `DBMigrator.migrateSurveySchema(surveyId)` for every survey.
   This blocks the server from accepting traffic until every survey's
   schema (DDL) is up to date.
2. `DataMigrator.migrateData(...)` (`server/system/dataMigrator/index.js`),
   also synchronous/blocking, currently does one thing:
   `CategoryService.initializeAllSurveysCategoryItemIndexes()`, gated by a
   single global app-version stamp read from the `info` table.
3. `AllSurveysDataMigrationJob` (enqueued in the background, after startup)
   runs `SurveyDataMigrationJob` per survey, applying versioned per-survey
   data-migration steps from `surveyDataMigrationSteps.js` and stamping
   each survey's own `appVersion` once done. A 503 gate
   (`SurveyManager.assertSurveyDataMigrated`) blocks access to a survey
   until its stamp is current. The file-path-format migration was already
   moved into this registry (see `4802669bc`); the old global entry point
   (`SurveyFileService.migrateAllSurveysFilesToNewPathFormat`) was left in
   place at the time, and has since been deleted (uncommitted local
   change, done independently of this spec).

This spec folds survey schema migration and the category-item-index
migration into mechanism 3, so a survey's schema (DDL), its category item
indexes, and its other data-migration steps are all brought up to date
together, per survey, gated by the same readiness stamp — instead of two
separate blocking, all-surveys-at-once passes at startup plus one
background pass.

## Scope

1. `SurveyDataMigrationJob` also runs the survey's schema migration
   (`DBMigrator.migrateSurveySchema`) before its data-migration steps.
2. The category-item-index fix becomes a step in
   `surveyDataMigrationSteps.js`, at its original version threshold
   (`2.3.20`), the same way the file-path fix was ported at `2.5.6`.
3. `server/system/dataMigrator/index.js` is deleted — once the
   category-item-index migration moves out, it has nothing left to do.
4. `initializeAllSurveysCategoryItemIndexes` (now dead once (2) lands) is
   deleted, replaced by a new single-survey
   `initializeCategoryItemIndexesForSurvey`.
5. `appCluster.js`: drop the `DataMigrator` call/import; add a comment at
   `ArenaServer.init()` documenting why it still redundantly migrates
   every survey's schema at startup.

**Out of scope:** any change to `@openforis/arena-server` itself. Today,
`ArenaServer.init()` has no option to skip only the survey-schema loop
while keeping the public-schema migration — the all-or-nothing
`DISABLE_DB_MIGRATIONS` env var would also skip the public schema, which
this app still needs migrated synchronously at startup. Removing the
redundant startup-time survey-schema loop requires `arena-server` to
expose that finer-grained control; this spec only prepares this repo's
side (the per-survey job now does its own schema migration, so the
switch-over will be a small, isolated change once that capability
exists), it does not flip anything off yet.

**Known limitation, explicitly not addressed here:** `AllSurveysDataMigrationJob`
only selects surveys whose *data* migration is pending
(`getSurveysToMigrate` / `isSurveyDataMigrationPending`, keyed off the
per-survey data-migration version stamp). A survey already fully caught
up on data migration that later needs a schema-only DDL change (no
corresponding data step) would not be picked up by this job. This is
harmless today because arena-server's blanket startup loop still covers
every survey's schema unconditionally; it only becomes relevant once that
startup loop is actually removed, and is deferred to that follow-up.

## 1. `SurveyDataMigrationJob.execute()` — add schema migration

`server/modules/survey/service/dataMigration/surveyDataMigrationJob.js`:
import `DBMigrator` from `@openforis/arena-server` (same package/export
already used by `SurveyManager.insertSurvey`/`importSurvey`) and call
`await DBMigrator.migrateSurveySchema(surveyId)` as the first line of
`execute()`, before computing/running `stepsToRun`.

`migrateSurveySchema` is idempotent (backed by `db-migrate`'s own applied-
migrations bookkeeping per schema), so running it here in addition to
arena-server's still-active startup loop is redundant but harmless.

Transaction note: `execute()` runs inside the job's own per-survey
transaction (`SurveyDataMigrationJob.start()` → `db.tx`, called without a
parent client from `AllSurveysDataMigrationJob`). `SurveyManager.insertSurvey`
/`importSurvey` deliberately call `migrateSurveySchema` *outside* of any
open transaction, to avoid a second pool connection sitting alongside a
held-open one under **concurrent user requests** (documented inline in
`surveyManager.js`, and a real production concern there since survey
creation has no `connectionTimeoutMillis` configured). That risk doesn't
apply the same way here: this job runs single-threaded and sequentially
over surveys, so the extra connections this opens per survey are never
contended by concurrent callers — an accepted tradeoff for keeping the
schema-migration call simple and colocated with the rest of the
per-survey migration, confirmed during design. (§2 below adds a second,
same-tradeoff extra connection per survey, for the category-item-index
step.)

Once schema migration fails or throws, it propagates exactly like a
failing data-migration step does today: caught by
`AllSurveysDataMigrationJob`'s per-survey `try/catch`, logged, the survey
added to `surveyIdsWithErrors`, and — because the transaction rolls back —
`appVersion` is not stamped, so the survey stays behind the 503 gate and
is retried on the next server startup (this job is only enqueued at
startup, not on a recurring schedule; that cadence is unchanged by this
spec).

## 2. Category item index migration → per-survey step

### 2a. `categoryItemIndexInitializer.js`

Delete `initializeAllSurveysCategoryItemIndexes` (loops every survey,
opening its own `db.tx` per survey). Replace it with a single-survey
function, extracted from that loop's body:

```js
export const initializeCategoryItemIndexesForSurvey = async ({ surveyId }, client = db) => {
  await client.tx(async (t) => {
    const categoriesByUuid = await CategoryRepository.fetchCategoriesAndLevelsBySurveyId({ surveyId, draft: true }, t)
    for (const category of Object.values(categoriesByUuid)) {
      await initializeSurveyCategoryItemsIndexes({ surveyId, category }, t)
    }
  })
}
```

Same per-survey atomicity as before (all of one survey's categories
succeed or none do, via the inner `client.tx`), just without the outer
all-surveys loop. `initializeSurveyCategoryItemsIndexes` (per *category*,
used elsewhere by `categoryImportJob.js`/`categoriesImportJob.js`) is
unchanged.

Called with no explicit `client` from the migration step (§2c), this
defaults to `db` and opens its own transaction/connection independently
of `SurveyDataMigrationJob`'s own held-open one — the same tradeoff
accepted in §1 for `migrateSurveySchema`, for the same reason (sequential
background job, not concurrent request handling). A mid-job failure
*after* this step has already committed means the category-index fix
itself won't be rolled back even though `appVersion` won't be stamped;
that's safe because the fix is idempotent, so a retry just re-applies a
no-op.

The `SurveyRepository` import in this file becomes unused (its only
caller, `fetchAllSurveyIds`, only existed for the deleted loop) and is
removed.

### 2b. Re-exports

`categoryManager.js` and `categoryService.js` each re-export
`initializeAllSurveysCategoryItemIndexes` from `categoryItemIndexInitializer.js`
today; swap that name for `initializeCategoryItemIndexesForSurvey` in both.

### 2c. New step in `surveyDataMigrationSteps.js`

```js
import * as CategoryManager from '@server/modules/category/manager/categoryManager'
// ...
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

The new step is listed *before* the `2.5.6` step, keeping array order
consistent with version order (steps run in array order, not sorted by
version, per `SurveyDataMigrationJob.execute()`'s `for...of`).

Import goes at the manager layer (`CategoryManager`), matching the
existing file-path step's `SurveyFileManager` import — the data-migration
steps registry consistently calls into managers, not services.

The step is ported at its original historical version (`2.3.20`), the
same convention already used for the file-path step (`2.5.6`) — kept
as-is rather than picking a new threshold, even though this per-survey
registry's version stamp is a different (per-survey) value than the old
global `info`-table stamp it's replacing. This means a survey already
fixed under the old global mechanism, but never yet stamped under the new
per-survey scheme, will run this step once more; it's a no-op in that
case (`initializeSurveyCategoryItemsIndexes` only touches items with an
empty index).

## 3. Delete `server/system/dataMigrator/index.js`

Once (2) lands, `DataMigrator.migrateData` has no migrations left to run
(both of its historical entries have moved to the per-survey registry).
Delete the file entirely rather than leaving an empty passthrough.

`appCluster.js`: remove the `import { DataMigrator } from './dataMigrator'`
and the `await DataMigrator.migrateData({ logger, serviceRegistry })` call.
`serviceRegistry` (currently only used for that call, and for the later
`infoService.updateVersion()`) keeps its other use; no other change to
the surrounding startup sequence.

## 4. `appCluster.js` — comment on the still-blocking `ArenaServer.init()`

Add a short comment immediately above the `const arenaApp = await ArenaServer.init()`
call, noting: `ArenaServer.init()` still synchronously migrates every
survey's schema at startup via arena-server's own `DBMigrator.migrateAll()`
loop; that's now redundant with `SurveyDataMigrationJob`'s own
`DBMigrator.migrateSurveySchema` call (§1), but there's currently no way
to opt out of just that loop without also skipping the public-schema
migration this app still needs synchronously — remove the redundancy once
`arena-server` exposes that finer control.

## Verification plan

- `execute()`-level behavior (schema migration ordering, category-index
  step) is not covered by automated tests today — `040surveyDataMigrationJob.test.js`
  only tests the pure helper functions (`getPendingSurveyDataMigrationSteps`,
  `getSurveysToMigrate`), consistent with the rest of this job system. No
  new test file is added for the same reason; verified manually instead:
  1. `yarn dev:server` against a dev DB with at least one survey stamped
     below `2.3.20` (or with `NULL` app version): confirm job logs show
     the survey's schema migration, category-item-index fix, and file-path
     step all running for that survey, in that order, and the survey's
     `appVersion` ends up stamped at `latestSurveyDataMigrationVersion`.
  2. Confirm `server/system/dataMigrator` no longer exists and the server
     still starts cleanly (no dangling import).
  3. Confirm a category with un-indexed items on an affected survey ends
     up with indexes populated after the job runs.

## Non-goals

- No change to `@openforis/arena-server` (see "Out of scope" above).
- No change to the "only surveys with pending *data* migration are
  selected" logic in `AllSurveysDataMigrationJob` (see "Known limitation"
  above).
- No new automated test coverage for `execute()` (matches existing
  convention in this job system).
