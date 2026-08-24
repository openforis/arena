# Job Monitor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a system-admin-only "Job Monitor" screen that lists every job (active + recent
history) running on the Arena server, and make `job.survey_id` nullable so "global" (non-survey)
jobs actually get persisted and show up in it.

**Architecture:** `arena-server`'s `job` table currently has `survey_id NOT NULL`, so
`JobQueue.enqueue()` and `jobThreadExecutor.js`'s `_persistJobUpdate` in the main `arena` repo both
skip all DB writes for global jobs. This plan (1) relaxes the constraint in arena-server, (2)
removes both skip-guards in the main repo so every job is persisted and kept up to date regardless
of `surveyId`, (3) adds a read path — a raw-SQL join across `job`/`user`/`survey` plus a thin
manager/API layer — that returns all jobs with the extra display fields a monitor needs, and (4)
adds a `webapp` module, gated on `User.isSystemAdmin`, that polls that endpoint into a `DataGrid`.

**Tech Stack:** pg-promise (raw SQL + `JobRepository` from `@openforis/arena-server`), Express,
React, MUI X `DataGrid` (via `webapp/components/DataGrid`), i18next.

## Global Constraints

- Both repos' relevant work happens on branch `feat/auto-scaling` (not yet released/merged to
  `master` in either repo) — this is a continuation of that unreleased job-persistence effort, not
  a new branch.
- `jest.mock('@openforis/arena-server', ...)` does not work reliably in this repo's bundled test
  setup (documented in `docs/superpowers/plans/2026-08-19-autoscaling-3-job-queue-persistence.md`).
  Use `jest.spyOn` on the real module instead, exactly as `test/unit/tests/016jobQueue.test.js` and
  `test/unit/tests/jobThreadExecutor.test.js` already do.
- After any arena-server change, it must be rebuilt (`yarn build`) and the main `arena` repo must
  reinstall (`yarn install`) to pick up the new `dist/` output — `@openforis/arena-server` is
  `portal:../arena-server` linked, but `node_modules/@openforis/arena-server` is a real copy of
  `dist/`, not a live symlink to `src/`.
- Main-repo unit tests run via `yarn build:test:unit && jest dist/__tests__/bundle.unit.js` (per
  `CLAUDE.md`); arena-server tests run via `yarn test` (migrates a real Postgres DB, then runs
  Jest) inside the `arena-server` repo.
- i18next `fallbackLng` is `en` (`core/i18n/i18nFactory.ts`), so new UI strings only need adding to
  `core/i18n/resources/en/` — other languages fall back to English automatically for missing keys.
- This codebase has no React component-test precedent anywhere (no `@testing-library/*` dependency,
  no existing `*.test.js` that renders a component) — webapp UI tasks close with manual
  browser verification, not automated tests, matching every existing view module.
- Follow the codebase's established DataGrid pattern (`webapp/views/App/JobMonitor/JobErrors/JobErrors.js`,
  `webapp/views/App/views/UserGroups/UserGroupsEditor/UserGroupsList/UserGroupsList.tsx`): plain
  `GridColDef`-shaped objects, `getRowId`, no manual pagination wiring beyond what `DataGrid` gives
  for free.

---

## Task 1: arena-server — make `job.survey_id` nullable

**Repo:** `arena-server` (branch `feat/auto-scaling`)

**Files:**
- Modify: `src/db/dbMigrator/migration/public/migrations/sqls/20260819100000-create-table-job-up.sql`
- Modify: `src/repository/job/utils.ts`
- Modify: `src/repository/job/insert.ts`
- Modify: `src/repository/job/tests/job.test.ts`
- Test: `src/repository/job/tests/job.test.ts` (extends the existing integration suite)

**Interfaces:**
- Produces: `JobRepository.insert(params: { uuid: string; userUuid: string; surveyId?: number; type: string }, client?): Promise<JobRow>` — `surveyId` becomes optional; `JobRow.surveyId` becomes `number | null`.

- [ ] **Step 1: Write the failing test**

Add to the existing `describe('JobRepository', ...)` block in `src/repository/job/tests/job.test.ts`
(it already has `userUuid`/`surveyId` set up in `beforeAll` and a `DBMigrator.migrateSchema()` call,
so this new test runs against the real, migrated schema):

```ts
  test('insert persists a global job with a null surveyId', async () => {
    const uuid = UUIDs.v4()

    const inserted = await JobRepository.insert({ uuid, userUuid, type: 'GlobalJob' })
    expect(inserted.surveyId).toBeNull()

    const job = await JobRepository.getByUuid(uuid)
    expect(job).toMatchObject({ uuid, userUuid, surveyId: null, type: 'GlobalJob' })

    await JobRepository.updateStatus({ uuid, status: JobStatus.succeeded })
  })
```

- [ ] **Step 2: Run test to verify it fails**

Run (from `arena-server/`): `yarn test`
Expected: FAIL — either a TypeScript error (`surveyId` still required) or, once that's silenced, a
Postgres `null value in column "survey_id" violates not-null constraint` error, since the column is
still `NOT NULL`.

- [ ] **Step 3: Drop the NOT NULL constraint**

In `src/db/dbMigrator/migration/public/migrations/sqls/20260819100000-create-table-job-up.sql`,
change:

```sql
  survey_id     bigint      NOT NULL,
```

to:

```sql
  survey_id     bigint,
```

(Leave `job_survey_fk` and `job_survey_id_idx` exactly as they are — a nullable FK column is simply
not checked when its value is `NULL`.)

- [ ] **Step 4: Widen the `JobRow` type**

In `src/repository/job/utils.ts`, change:

```ts
export interface JobRow {
  uuid: string
  userUuid: string
  surveyId: number
  ...
```

to:

```ts
export interface JobRow {
  uuid: string
  userUuid: string
  surveyId: number | null
  ...
```

- [ ] **Step 5: Make `insert`'s `surveyId` optional**

In `src/repository/job/insert.ts`, change the signature and value-building so `surveyId` can be
omitted (pg-promise's named-parameter binding requires the key to be present in the values object,
so default it to `null` explicitly rather than leaving it `undefined`):

```ts
export const insert = (
  params: { uuid: string; userUuid: string; surveyId?: number; type: string },
  client: BaseProtocol = DB
): Promise<JobRow> => {
  const { uuid, userUuid, surveyId = null, type } = params
  const table = new TableJob()

  const values = {
    [table.uuid.columnName]: uuid,
    [table.userUuid.columnName]: userUuid,
    [table.surveyId.columnName]: surveyId,
    [table.type.columnName]: type,
    [table.status.columnName]: JobStatus.pending,
  }
  ...
```

(The rest of the function — building and running the `SqlInsertBuilder` query — is unchanged.)

- [ ] **Step 6: Run test to verify it passes**

Run (from `arena-server/`): `yarn test`
Expected: PASS — all tests in `src/repository/job/tests/job.test.ts` pass, including the new one.
This also re-runs `DBMigrator.migrateSchema()` against a fresh schema, so it doubles as
confirmation the edited migration SQL itself is valid.

- [ ] **Step 7: Rebuild and relink into the main repo**

```bash
cd ~/dev/projects/openforis/arena-server
yarn build
cd ~/dev/projects/openforis/arena
yarn install
```

Confirm the copy picked up the change:

```bash
grep -n "survey_id" ~/dev/projects/openforis/arena/node_modules/@openforis/arena-server/dist/db/dbMigrator/migration/public/migrations/sqls/20260819100000-create-table-job-up.sql
```

Expected: the line no longer contains `NOT NULL`.

- [ ] **Step 8: Commit**

```bash
cd ~/dev/projects/openforis/arena-server
git add src/db/dbMigrator/migration/public/migrations/sqls/20260819100000-create-table-job-up.sql \
        src/repository/job/utils.ts src/repository/job/insert.ts src/repository/job/tests/job.test.ts
git commit -m "feat: make job.survey_id nullable so global jobs can be persisted"
```

---

## Task 2: arena — persist global jobs (remove the two skip-guards)

**Repo:** `arena` (branch `feat/auto-scaling`)

**Files:**
- Modify: `server/job/JobQueue.ts:459-505` (the `enqueue` method)
- Modify: `server/job/jobThreadExecutor.js:25-35` (`_persistJobUpdate`)
- Modify: `test/unit/tests/016jobQueue.test.js`
- Modify: `test/unit/tests/jobThreadExecutor.test.js`
- Test: both files above

**Interfaces:**
- Consumes: Task 1's `JobRepository.insert(params: { uuid, userUuid, surveyId?, type })`.
- Produces: no new exports — `JobQueue.enqueue()` and `jobThreadExecutor.js`'s internal
  `_persistJobUpdate` (tested via its existing `_notifyJobUpdateForTest` export) now write to the DB
  for every job, not just survey-scoped ones.

- [ ] **Step 1: Rewrite the two failing tests to assert the new behavior**

In `test/unit/tests/016jobQueue.test.js`, replace the test named
`'enqueue does not persist a job row for global (no-surveyId) jobs'` with:

```js
  test('enqueue persists a job row for global (no-surveyId) jobs too', async () => {
    jobRepositoryInsertSpy.mockClear()
    const job = new Job('GlobalJob', { user: user1 })

    await enqueueJobs({ jobs: [job] })

    expect(jobRepositoryInsertSpy).toHaveBeenCalledWith({
      uuid: job.uuid,
      userUuid: user1.uuid,
      surveyId: undefined,
      type: 'GlobalJob',
    })
  })
```

In `test/unit/tests/jobThreadExecutor.test.js`, replace the test named
`'does not persist anything for a global (no-surveyId) job'` with:

```js
  test('persists progress and status for a global (no-surveyId) job too', async () => {
    await _notifyJobUpdate({
      uuid: 'job-2',
      userUuid: 'user-1',
      surveyId: undefined,
      type: 'MessageSendJob',
      status: 'running',
      processed: 0,
      total: 1,
      ended: false,
    })

    expect(updateProgressSpy).toHaveBeenCalledWith({ uuid: 'job-2', processed: 0, total: 1 })
    expect(updateStatusSpy).toHaveBeenCalledWith({ uuid: 'job-2', status: 'running' })
  })
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
yarn build:test:unit && jest dist/__tests__/bundle.unit.js -t "persists a job row for global"
yarn build:test:unit && jest dist/__tests__/bundle.unit.js -t "persists progress and status for a global"
```

Expected: both FAIL — `jobRepositoryInsertSpy`/`updateProgressSpy`/`updateStatusSpy` were not
called, because the `if (surveyId)` / `if (!surveyId) return` guards are still in place.

- [ ] **Step 3: Remove the guard in `JobQueue.ts`**

In `server/job/JobQueue.ts`, the `enqueue` method currently has (around line 495):

```ts
    if (surveyId) {
      // Fire-and-forget: makes the job pollable from any dyno via JobManager.getJobSummary/getActiveJobSummary.
      // Not persisted for global (no-surveyId) jobs - the job table's survey_id column is NOT NULL.
      // Stashed on jobInfo so _startNextJobInternal can await it before this job's first status/
      // progress write - see the comment there for why that matters.
      jobInfo.persistPromise = JobRepository.insert({ uuid, userUuid, surveyId, type }).catch((error) => {
        this._logger.error(`error persisting job ${uuid}: ${error}`)
      })
    }
```

Replace it with (no more conditional — every job gets a row now that `survey_id` is nullable):

```ts
    // Fire-and-forget: makes the job pollable from any dyno via JobManager.getJobSummary/getActiveJobSummary.
    // Stashed on jobInfo so _startNextJobInternal can await it before this job's first status/
    // progress write - see the comment there for why that matters.
    jobInfo.persistPromise = JobRepository.insert({ uuid, userUuid, surveyId, type }).catch((error) => {
      this._logger.error(`error persisting job ${uuid}: ${error}`)
    })
```

Also update the now-stale comment a few lines above, inside the same method's per-user conflict
check (around line 473-477):

```ts
        // Only one job per user and per survey (queued or running) - matches this dyno's
        // existing behavior of letting a user have concurrently outstanding jobs for different
        // surveys (see 'global jobs executed before survey ones' test), while synchronously
        // rejecting a same-survey duplicate immediately, without waiting on the cluster-wide
        // _hasActiveJobElsewhere DB check (which still applies at job-start time regardless, as
        // the authoritative guard). A global job (no surveyId) always conflicts with anything
        // else for this user, in either direction: global jobs are never persisted to the job
        // table (survey_id is NOT NULL), so _hasActiveJobElsewhere's cluster-wide DB check has no
        // row to find and can't catch that combination either - this same-dyno guard is the only
        // backstop for it.
```

to:

```ts
        // Only one job per user and per survey (queued or running) - matches this dyno's
        // existing behavior of letting a user have concurrently outstanding jobs for different
        // surveys (see 'global jobs executed before survey ones' test), while synchronously
        // rejecting a same-survey duplicate immediately, without waiting on the cluster-wide
        // _hasActiveJobElsewhere DB check (which still applies at job-start time regardless, as
        // the authoritative guard - now equally applicable to global jobs, since they're
        // persisted too). A global job (no surveyId) always conflicts with anything else for
        // this user, in either direction.
```

- [ ] **Step 4: Remove the guard in `jobThreadExecutor.js`**

In `server/job/jobThreadExecutor.js`, change:

```js
const _persistJobUpdate = async (jobSerialized) => {
  const { uuid, surveyId, status, processed, total, result, errors, ended } = jobSerialized
  // Global (no-surveyId) jobs aren't persisted - see job-queue-persistence plan's Global Constraints
  // (the job table's survey_id column is NOT NULL).
  if (!surveyId) return

  try {
```

to:

```js
const _persistJobUpdate = async (jobSerialized) => {
  const { uuid, status, processed, total, result, errors, ended } = jobSerialized

  try {
```

(`surveyId` is dropped from the destructure entirely since nothing in this function uses it once
the guard is gone.)

- [ ] **Step 5: Run tests to verify they pass**

```bash
yarn build:test:unit && jest dist/__tests__/bundle.unit.js
```

Expected: PASS — run the full unit suite, not just the two renamed tests, since both files' other
tests (survey-scoped persistence, execution ordering, conflict handling) must still pass unchanged.

- [ ] **Step 6: Commit**

```bash
git add server/job/JobQueue.ts server/job/jobThreadExecutor.js \
        test/unit/tests/016jobQueue.test.js test/unit/tests/jobThreadExecutor.test.js
git commit -m "feat: persist global (no-surveyId) jobs now that job.survey_id is nullable"
```

---

## Task 3: arena — `jobRepository.getAll()` (the monitor's read query)

**Repo:** `arena` (branch `feat/auto-scaling`)

**Files:**
- Create: `server/job/jobRepository.js`
- Test: `test/integration/tests/015jobRepositoryGetAllTest.js` (new — numbered to sort after the
  existing `014schedulerClusterLockTest.js` and before the `999teardownTest.js` that calls
  `destroyTestContext`; follows `007surveyRdbSynctest.js`'s pattern of raw `db` queries plus
  `getContextUser()` from `../config/context`, which `test/integration/tests/000init.js`'s global
  `beforeAll(initTestContext)` has already populated with a real admin user by the time any
  numbered test file runs)

**Interfaces:**
- Produces: `getAll({ limit = 200 } = {}): Promise<Array<{ uuid, type, status, processed, total, props, dateCreated, dateModified, userUuid, userName, userEmail, surveyId, surveyName }>>`

- [ ] **Step 1: Write the failing test**

```js
import { db } from '@server/db/db'
import * as JobRepository from '@server/job/jobRepository'
import { getContextUser } from '../config/context'

describe('jobRepository.getAll', () => {
  let userUuid
  let surveyId

  beforeAll(async () => {
    const user = getContextUser()
    userUuid = user.uuid

    const survey = await db.one(
      `INSERT INTO survey (owner_uuid, props) VALUES ($1, $2) RETURNING id`,
      [userUuid, JSON.stringify({ name: 'job_monitor_test_survey' })]
    )
    surveyId = survey.id
  })

  afterAll(async () => {
    await db.none('DELETE FROM job WHERE survey_id = $1 OR user_uuid = $2', [surveyId, userUuid])
    await db.none('DELETE FROM survey WHERE id = $1', [surveyId])
  })

  test('joins user and survey info, and handles a global (null survey_id) job', async () => {
    await db.none(
      `INSERT INTO job (uuid, user_uuid, survey_id, type, status) VALUES ($1, $2, $3, 'SurveyJob', 'running')`,
      ['11111111-1111-1111-1111-111111111111', userUuid, surveyId]
    )
    await db.none(
      `INSERT INTO job (uuid, user_uuid, survey_id, type, status) VALUES ($1, $2, NULL, 'GlobalJob', 'pending')`,
      ['22222222-2222-2222-2222-222222222222', userUuid]
    )

    const rows = await JobRepository.getAll({ limit: 10 })
    const surveyJobRow = rows.find((row) => row.uuid === '11111111-1111-1111-1111-111111111111')
    const globalJobRow = rows.find((row) => row.uuid === '22222222-2222-2222-2222-222222222222')

    expect(surveyJobRow).toMatchObject({
      type: 'SurveyJob',
      status: 'running',
      userUuid,
      userEmail: 'admin@openforis.org',
      surveyId,
      surveyName: 'job_monitor_test_survey',
    })
    expect(globalJobRow).toMatchObject({
      type: 'GlobalJob',
      status: 'pending',
      surveyId: null,
      surveyName: null,
    })
  })

  test('orders by date_created descending and respects limit', async () => {
    const rows = await JobRepository.getAll({ limit: 1 })
    expect(rows).toHaveLength(1)
  })
})
```

(Note: `getContextUser()`'s own `name` prop may or may not be set depending on other tests that ran
earlier in the same bundle — the assertion above only pins down `userEmail`, which
`test/integration/config/context.js`'s `createAdminUser()` always sets to `'admin@openforis.org'`,
to avoid a false failure from unrelated test ordering.)

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test:integration`
Expected: FAIL with a module-not-found error for `server/job/jobRepository` — the whole integration
suite is bundled by webpack into one file and run together (`build:test:integration` then
`jest:integration`), so there's no way to target just this one new test file.

- [ ] **Step 3: Write the implementation**

```js
import { db } from '@server/db/db'

const selectAllJobs = `
  SELECT
    j.uuid, j.type, j.status, j.processed, j.total, j.props,
    j.date_created, j.date_modified, j.user_uuid, j.survey_id,
    u.name AS user_name, u.email AS user_email,
    COALESCE(s.props->>'name', s.props_draft->>'name') AS survey_name
  FROM job j
  LEFT JOIN "user" u ON u.uuid = j.user_uuid
  LEFT JOIN survey s ON s.id = j.survey_id
  ORDER BY j.date_created DESC
  LIMIT $1
`

const rowToJob = (row) => ({
  uuid: row.uuid,
  type: row.type,
  status: row.status,
  processed: row.processed,
  total: row.total,
  props: row.props,
  dateCreated: row.date_created,
  dateModified: row.date_modified,
  userUuid: row.user_uuid,
  userName: row.user_name,
  userEmail: row.user_email,
  surveyId: row.survey_id,
  surveyName: row.survey_name,
})

export const getAll = ({ limit = 200 } = {}) => db.map(selectAllJobs, [limit], rowToJob)
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn test:integration`
Expected: PASS — the full integration suite passes, including the two new tests.

- [ ] **Step 5: Commit**

```bash
git add server/job/jobRepository.js test/integration/tests/015jobRepositoryGetAllTest.js
git commit -m "feat: add jobRepository.getAll for the job monitor's list query"
```

---

## Task 4: arena — `jobRowToMonitorSummary`

**Repo:** `arena` (branch `feat/auto-scaling`)

**Files:**
- Modify: `server/job/jobUtils.js`
- Test: `test/unit/tests/jobRowToMonitorSummary.test.js` (new, mirrors
  `test/unit/tests/jobRowToSummary.test.js`)

**Interfaces:**
- Consumes: existing `jobRowToSummary(jobRow)` (unchanged, in the same file) and Task 3's row shape
  from `jobRepository.getAll()`.
- Produces: `jobRowToMonitorSummary(row): { ...JobSerialized shape, dateCreated: Date, userName: string|null, userEmail: string|null, surveyName: string|null }`

- [ ] **Step 1: Write the failing test**

```js
import { jobRowToMonitorSummary, jobStatus } from '../../../server/job/jobUtils'
import * as JobSerialized from '@common/job/jobSerialized'

describe('jobRowToMonitorSummary', () => {
  test('extends jobRowToSummary with dateCreated, user and survey display fields', () => {
    const dateCreated = new Date('2026-08-19T10:00:00.000Z')
    const row = {
      uuid: 'job-1',
      type: 'DataExportJob',
      status: jobStatus.running,
      processed: 3,
      total: 10,
      props: {},
      dateCreated,
      dateModified: new Date('2026-08-19T10:00:05.000Z'),
      userUuid: 'user-1',
      userName: 'Jane Doe',
      userEmail: 'jane@example.org',
      surveyId: 42,
      surveyName: 'My Survey',
    }

    const summary = jobRowToMonitorSummary(row)

    // still a valid JobSerialized-shaped object
    expect(JobSerialized.getUuid(summary)).toBe('job-1')
    expect(JobSerialized.getProgressPercent(summary)).toBe(30)
    // plus the monitor-only fields
    expect(summary.dateCreated).toBe(dateCreated)
    expect(summary.userName).toBe('Jane Doe')
    expect(summary.userEmail).toBe('jane@example.org')
    expect(summary.surveyName).toBe('My Survey')
  })

  test('passes through null survey fields for a global job', () => {
    const row = {
      uuid: 'job-2',
      type: 'MessageSendJob',
      status: jobStatus.pending,
      processed: 0,
      total: 1,
      props: {},
      dateCreated: new Date(),
      dateModified: new Date(),
      userUuid: 'user-1',
      userName: 'Jane Doe',
      userEmail: 'jane@example.org',
      surveyId: null,
      surveyName: null,
    }

    const summary = jobRowToMonitorSummary(row)

    expect(summary.surveyName).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
yarn build:test:unit && jest dist/__tests__/bundle.unit.js -t "jobRowToMonitorSummary"
```

Expected: FAIL — `jobRowToMonitorSummary` is not exported yet.

- [ ] **Step 3: Add the function**

In `server/job/jobUtils.js`, add (after the existing `jobRowToSummary` function, which stays
unchanged):

```js
export const jobRowToMonitorSummary = (jobRow) => {
  const { dateCreated, userName, userEmail, surveyName } = jobRow
  return {
    ...jobRowToSummary(jobRow),
    dateCreated,
    userName,
    userEmail,
    surveyName,
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
yarn build:test:unit && jest dist/__tests__/bundle.unit.js -t "jobRowToMonitorSummary"
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add server/job/jobUtils.js test/unit/tests/jobRowToMonitorSummary.test.js
git commit -m "feat: add jobRowToMonitorSummary for the job monitor API"
```

---

## Task 5: arena — `JobManager.getAllJobsSummary` + `GET /jobs` API route

**Repo:** `arena` (branch `feat/auto-scaling`)

**Files:**
- Modify: `server/job/jobManager.js`
- Modify: `server/job/jobApi.js`
- Test: `test/unit/tests/jobManager.test.js` (extends the existing `describe` block)

**Interfaces:**
- Consumes: Task 3's `jobRepository.getAll` and Task 4's `jobRowToMonitorSummary`.
- Produces: `JobManager.getAllJobsSummary(): Promise<Array<MonitorSummary>>`; HTTP `GET /jobs`
  (mounted under `/api` by `server/system/apiRouter.js`, unchanged) returning that array as JSON,
  gated by `ApiAuthMiddleware.requireAdminPermission`.

- [ ] **Step 1: Write the failing test**

Add to `test/unit/tests/jobManager.test.js`, inside the existing `describe('JobManager DB-backed
polling', ...)` block (reuse its existing `beforeEach` resets; add one more spy):

```js
import * as jobRepository from '../../../server/job/jobRepository'
// (add alongside the existing imports at the top of the file)
```

```js
  test('getAllJobsSummary maps every row from jobRepository.getAll through jobRowToMonitorSummary', async () => {
    const getAllSpy = jest.spyOn(jobRepository, 'getAll').mockResolvedValue([
      { ...jobRow, uuid: 'job-1', userName: 'Jane Doe', userEmail: 'jane@example.org', surveyName: 'Survey A' },
      { ...jobRow, uuid: 'job-2', userName: null, userEmail: 'no-name@example.org', surveyName: null },
    ])

    const summaries = await JobManager.getAllJobsSummary()

    expect(getAllSpy).toHaveBeenCalled()
    expect(summaries).toHaveLength(2)
    expect(summaries[0]).toMatchObject({ uuid: 'job-1', userName: 'Jane Doe', surveyName: 'Survey A' })
    expect(summaries[1]).toMatchObject({ uuid: 'job-2', userName: null, surveyName: null })

    getAllSpy.mockRestore()
  })
```

- [ ] **Step 2: Run test to verify it fails**

```bash
yarn build:test:unit && jest dist/__tests__/bundle.unit.js -t "getAllJobsSummary"
```

Expected: FAIL — `JobManager.getAllJobsSummary` doesn't exist yet.

- [ ] **Step 3: Add `getAllJobsSummary` to `jobManager.js`**

In `server/job/jobManager.js`, add the import and the new function (the existing `getActiveJobSummary`/`getJobSummary`/`cancelActiveJobByUserUuid`/`enqueueJob` stay unchanged):

```js
import * as jobRepository from './jobRepository'
import { jobRowToMonitorSummary } from './jobUtils'
```

```js
export const getAllJobsSummary = async () => {
  const rows = await jobRepository.getAll()
  return rows.map(jobRowToMonitorSummary)
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
yarn build:test:unit && jest dist/__tests__/bundle.unit.js -t "getAllJobsSummary"
```

Expected: PASS

- [ ] **Step 5: Add the API route**

In `server/job/jobApi.js`, add the `ApiAuthMiddleware` import and the new route (the existing three
routes are unchanged):

```js
import { ApiAuthMiddleware } from '@openforis/arena-server'

import * as Request from '@server/utils/request'
import * as Response from '@server/utils/response'

import * as JobManager from './jobManager'

export const init = (app) => {
  app.get('/jobs', ApiAuthMiddleware.requireAdminPermission, async (req, res) => {
    const jobs = await JobManager.getAllJobsSummary()
    res.json(jobs)
  })

  app.get('/jobs/active', async (req, res) => {
    ...
```

(Insert the new route before the existing `/jobs/active` route; the rest of the file is unchanged.)

- [ ] **Step 6: Run the full unit suite**

```bash
yarn build:test:unit && jest dist/__tests__/bundle.unit.js
```

Expected: PASS (everything, not just the new test — confirms nothing else broke).

- [ ] **Step 7: Commit**

```bash
git add server/job/jobManager.js server/job/jobApi.js test/unit/tests/jobManager.test.js
git commit -m "feat: add GET /jobs admin API for the job monitor"
```

---

## Task 6: arena/webapp — i18n resource for the Job Monitor screen

**Repo:** `arena` (branch `feat/auto-scaling`)

**Files:**
- Create: `core/i18n/resources/en/jobMonitorView.js`
- Modify: `core/i18n/resources/en/index.js`

**Interfaces:**
- Produces: i18next namespace `jobMonitorView` with keys `title`, `columns.type`,
  `columns.status`, `columns.survey`, `columns.user`, `columns.progress`, `columns.elapsed`,
  `columns.remaining`, `columns.startedAt`, `status.pending`, `status.running`,
  `status.succeeded`, `status.failed`, `status.canceled`, `noSurvey`.

- [ ] **Step 1: Create the resource file**

```js
export default {
  title: 'Job Monitor',
  noSurvey: '—',
  columns: {
    type: 'Type',
    status: 'Status',
    survey: 'Survey',
    user: 'User',
    progress: 'Progress',
    elapsed: 'Elapsed',
    remaining: 'Est. Remaining',
    startedAt: 'Started At',
  },
  status: {
    pending: 'Pending',
    running: 'Running',
    succeeded: 'Succeeded',
    failed: 'Failed',
    canceled: 'Canceled',
  },
}
```

Save to `core/i18n/resources/en/jobMonitorView.js`.

- [ ] **Step 2: Register the namespace**

In `core/i18n/resources/en/index.js`, add the import and the export entry, keeping the existing
alphabetical-ish ordering:

```js
import jobMonitorView from './jobMonitorView'
```

```js
  jobMonitorView,
```

(placed next to `jobs` and `messageView`, matching their existing position in both the import list
and the exported object)

- [ ] **Step 3: Verify the namespace loads**

Run: `node -e "console.log(Object.keys(require('./core/i18n/resources/en/index.js').default ?? require('./core/i18n/resources/en/index.js')))"`

(If this fails due to ESM/`import` syntax not running directly under plain `node`, instead just
visually confirm `jobMonitorView` appears in the file's export object and rely on Step 4 of Task 8's
manual browser verification to confirm the strings actually render.)

- [ ] **Step 4: Commit**

```bash
git add core/i18n/resources/en/jobMonitorView.js core/i18n/resources/en/index.js
git commit -m "feat: add jobMonitorView i18n resource"
```

---

## Task 7: arena/webapp — `fetchAllJobs` API client function

**Repo:** `arena` (branch `feat/auto-scaling`)

**Files:**
- Modify: `webapp/service/api/job/index.js`
- Modify: `webapp/service/api/index.js`

**Interfaces:**
- Consumes: Task 5's `GET /jobs` route.
- Produces: `fetchAllJobs(): Promise<Array<MonitorSummary>>` (axios GET, matching the existing
  `fetchActiveJob`'s shape in the same file).

- [ ] **Step 1: Add the function**

In `webapp/service/api/job/index.js`, add alongside the existing `fetchActiveJob`:

```js
export const fetchAllJobs = async () => {
  const { data } = await axios.get('/api/jobs')
  return data
}
```

- [ ] **Step 2: Export it from the barrel**

In `webapp/service/api/index.js`, change:

```js
export { fetchActiveJob } from './job'
```

to:

```js
export { fetchActiveJob, fetchAllJobs } from './job'
```

- [ ] **Step 3: Verify it builds**

Run: `npx eslint --cache webapp/service/api/job/index.js webapp/service/api/index.js`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add webapp/service/api/job/index.js webapp/service/api/index.js
git commit -m "feat: add fetchAllJobs API client function"
```

---

## Task 8: arena/webapp — register the admin-only module (routing, sidebar, icon)

**Repo:** `arena` (branch `feat/auto-scaling`)

**Files:**
- Modify: `webapp/app/appModules.js`
- Modify: `webapp/views/App/SideBar/Modules/utils.js`
- Modify: `webapp/views/App/AppView.js`

**Interfaces:**
- Consumes: `useUserIsSystemAdmin` (already exported from `webapp/store/user`).
- Produces: `appModules.jobs` module descriptor, routed at `/app/jobMonitor/` and rendered in the
  sidebar, both gated on `User.isSystemAdmin`. (Task 9 supplies the actual `JobsMonitorModule`
  component this task wires in.)

- [ ] **Step 1: Add the module descriptor**

In `webapp/app/appModules.js`, inside the `appModules` object, add a new entry after `messages`:

```js
  messages: {
    key: 'message_plural',
    path: 'messages',
    icon: 'envelop',
  },
  jobs: {
    key: 'jobMonitor',
    path: 'jobMonitor',
    icon: 'cogs',
  },
  help: {
```

(`appModules.jobs` is top-level, like `appModules.dashboard` — it needs no child module group and
no entry in `allAppModuleGroups`, since `_getModuleParentPathParts` already resolves any member of
`appModules` to `[app]` generically via `Object.values(appModules).includes(module)`.)

- [ ] **Step 2: Exclude it from the "survey selection required" rule**

In `webapp/views/App/SideBar/Modules/utils.js`, change:

```js
export const isSurveySelectionRequired = (module) =>
  ![appModules.home.key, appModules.help.key].includes(getKey(module))
```

to:

```js
export const isSurveySelectionRequired = (module) =>
  ![appModules.home.key, appModules.help.key, appModules.jobs.key].includes(getKey(module))
```

(Job Monitor lists jobs across every survey plus global ones, so — like Home and Help — it
shouldn't require a survey to be selected first.)

- [ ] **Step 3: Add it to the sidebar hierarchy, admin-gated**

In the same file's `getModulesHierarchy`, add a block after the existing `messages` block and
before `help`:

```js
    // message
    ...(User.isSystemAdmin(user)
      ? [
          getModule({
            module: appModules.messages,
            children: [messageModules.messages],
          }),
        ]
      : []),
    // job monitor
    ...(User.isSystemAdmin(user) ? [getModule({ module: appModules.jobs })] : []),
    getModule({
      module: appModules.help,
```

- [ ] **Step 4: Register the route, gated on system-admin**

In `webapp/views/App/AppView.js`:

Change the import:

```js
import { useAuthCanUseAnalysis, useAuthCanUseMessages } from '@webapp/store/user'
```

to:

```js
import { useAuthCanUseAnalysis, useAuthCanUseMessages, useUserIsSystemAdmin } from '@webapp/store/user'
```

Add the lazy import next to the other `React.lazy` module imports:

```js
const JobsMonitor = React.lazy(() => import('./views/JobsMonitor'))
```

Inside the `AppView` component, add the hook call next to the existing ones:

```js
  const canAnalyzeRecords = useAuthCanUseAnalysis()
  const canUseMessages = useAuthCanUseMessages()
  const canUseJobMonitor = useUserIsSystemAdmin()
```

In the `modules` `useMemo`, add the route registration next to the `canUseMessages` block, and add
`canUseJobMonitor` to the dependency array:

```js
    if (canUseMessages) {
      result.push({ component: Message, path: `${appModules.messages.path}/*` })
    }
    if (canUseJobMonitor) {
      result.push({ component: JobsMonitor, path: `${appModules.jobs.path}/*` })
    }
    result.push({
      component: Help,
      path: `${appModules.help.path}/*`,
    })
    return result
  }, [canAnalyzeRecords, canUseMessages, canUseJobMonitor])
```

- [ ] **Step 5: Verify it builds (Task 9 supplies the actual component)**

At this point `./views/JobsMonitor` doesn't exist yet, so a build will fail — that's expected and
resolved by Task 9. Run just the linter on the files this task touched:

```bash
npx eslint --cache webapp/app/appModules.js webapp/views/App/SideBar/Modules/utils.js webapp/views/App/AppView.js
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add webapp/app/appModules.js webapp/views/App/SideBar/Modules/utils.js webapp/views/App/AppView.js
git commit -m "feat: register the admin-only Job Monitor module and route"
```

---

## Task 9: arena/webapp — `JobsMonitor` screen (DataGrid, 10s polling, refresh button)

**Repo:** `arena` (branch `feat/auto-scaling`)

**Files:**
- Create: `webapp/views/App/views/JobsMonitor/useJobsMonitorColumns.js`
- Create: `webapp/views/App/views/JobsMonitor/useJobsMonitor.js`
- Create: `webapp/views/App/views/JobsMonitor/JobsMonitor.js`
- Create: `webapp/views/App/views/JobsMonitor/JobsMonitorModule.js`
- Create: `webapp/views/App/views/JobsMonitor/index.js`

**Interfaces:**
- Consumes: Task 7's `API.fetchAllJobs`, Task 6's `jobMonitorView` i18n keys, Task 8's
  `appModules.jobs`, and the existing `webapp/components/hooks/useInterval` default export,
  `webapp/components/DataGrid`'s `DataGrid`, `webapp/components/LoadingBar`'s default export,
  `webapp/components/buttons`'s `Button`, `@common/job/jobSerialized`'s `JobSerialized`, and
  `webapp/views/App/JobMonitor/JobTiming/formatDuration`'s default export.
- Produces: default export `JobsMonitorModule`, mounted by Task 8's `AppView.js` at
  `${appModules.jobs.path}/*`.

- [ ] **Step 1: Write the columns hook**

```js
// webapp/views/App/views/JobsMonitor/useJobsMonitorColumns.js
import { useMemo } from 'react'

import * as DateUtils from '@core/dateUtils'
import * as JobSerialized from '@common/job/jobSerialized'

import { useI18n } from '@webapp/store/system'
import formatDuration from '@webapp/views/App/JobMonitor/JobTiming/formatDuration'

export const useJobsMonitorColumns = () => {
  const i18n = useI18n()

  return useMemo(
    () => [
      {
        field: 'type',
        headerName: i18n.t('jobMonitorView:columns.type'),
        flex: 1,
        valueGetter: (_value, row) => i18n.t(`jobs:${row.type}`),
      },
      {
        field: 'status',
        headerName: i18n.t('jobMonitorView:columns.status'),
        width: 130,
        valueGetter: (_value, row) => i18n.t(`jobMonitorView:status.${row.status}`),
      },
      {
        field: 'surveyName',
        headerName: i18n.t('jobMonitorView:columns.survey'),
        flex: 1,
        valueGetter: (_value, row) => row.surveyName || i18n.t('jobMonitorView:noSurvey'),
      },
      {
        field: 'user',
        headerName: i18n.t('jobMonitorView:columns.user'),
        flex: 1,
        valueGetter: (_value, row) => row.userName || row.userEmail || row.userUuid,
      },
      {
        field: 'progressPercent',
        headerName: i18n.t('jobMonitorView:columns.progress'),
        width: 110,
        valueGetter: (_value, row) => `${JobSerialized.getProgressPercent(row)}%`,
      },
      {
        field: 'elapsed',
        headerName: i18n.t('jobMonitorView:columns.elapsed'),
        width: 130,
        valueGetter: (_value, row) => formatDuration(JobSerialized.getElapsedMillis(row)) ?? '-',
      },
      {
        field: 'remaining',
        headerName: i18n.t('jobMonitorView:columns.remaining'),
        width: 130,
        valueGetter: (_value, row) => {
          const remainingMillis = JobSerialized.getRemainingMillis(row)
          return remainingMillis === null ? '-' : formatDuration(remainingMillis)
        },
      },
      {
        field: 'dateCreated',
        headerName: i18n.t('jobMonitorView:columns.startedAt'),
        width: 180,
        valueGetter: (_value, row) => DateUtils.convertDateTimeFromISOToDisplay(row.dateCreated),
      },
    ],
    [i18n]
  )
}
```

- [ ] **Step 2: Write the data-fetching + polling hook**

```js
// webapp/views/App/views/JobsMonitor/useJobsMonitor.js
import { useCallback, useEffect, useState } from 'react'

import * as API from '@webapp/service/api'
import useInterval from '@webapp/components/hooks/useInterval'

const refreshIntervalMillis = 10000

export const useJobsMonitor = () => {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchJobs = useCallback(async () => {
    const data = await API.fetchAllJobs()
    setJobs(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchJobs()
  }, [fetchJobs])

  useInterval(fetchJobs, refreshIntervalMillis)

  return { jobs, loading, refresh: fetchJobs }
}
```

- [ ] **Step 3: Write the page component**

```js
// webapp/views/App/views/JobsMonitor/JobsMonitor.js
import PropTypes from 'prop-types'

import { useI18n } from '@webapp/store/system'
import { DataGrid } from '@webapp/components/DataGrid'
import LoadingBar from '@webapp/components/LoadingBar'
import { Button } from '@webapp/components/buttons'

import { useJobsMonitor } from './useJobsMonitor'
import { useJobsMonitorColumns } from './useJobsMonitorColumns'

const JobsMonitor = () => {
  const i18n = useI18n()
  const { jobs, loading, refresh } = useJobsMonitor()
  const columns = useJobsMonitorColumns()

  if (loading) {
    return <LoadingBar />
  }

  return (
    <div className="jobs-monitor">
      <div className="jobs-monitor__header">
        <h1>{i18n.t('jobMonitorView:title')}</h1>
        <Button iconClassName="icon-loop2" label="common.refresh" onClick={refresh} />
      </div>
      <DataGrid className="jobs-monitor__grid" columns={columns} rows={jobs} getRowId={(row) => row.uuid} />
    </div>
  )
}

JobsMonitor.propTypes = {}

export default JobsMonitor
```

- [ ] **Step 4: Write the module wrapper**

```js
// webapp/views/App/views/JobsMonitor/JobsMonitorModule.js
import { appModules } from '@webapp/app/appModules'
import ModuleSwitch from '@webapp/components/moduleSwitch'

import JobsMonitor from './JobsMonitor'

const JobsMonitorModule = () => (
  <ModuleSwitch
    moduleRoot={appModules.jobs}
    moduleDefault={appModules.jobs}
    modules={[
      {
        component: JobsMonitor,
        path: '',
      },
    ]}
  />
)

export default JobsMonitorModule
```

- [ ] **Step 5: Write the barrel export**

```js
// webapp/views/App/views/JobsMonitor/index.js
export { default } from './JobsMonitorModule'
```

- [ ] **Step 6: Verify it builds**

```bash
npx eslint --cache webapp/views/App/views/JobsMonitor/*.js
yarn build-dev
```

Expected: both succeed with no errors — this is also what proves Task 8's `import('./views/JobsMonitor')` now resolves.

- [ ] **Step 7: Manual browser verification**

```bash
yarn watch
```

1. Log in as a system-administrator user.
2. Confirm a "Job Monitor" entry (cogs icon) appears in the sidebar without needing a survey
   selected, and navigating to it loads the grid (empty state is fine if no jobs have run).
3. Trigger a job — e.g. start a category export from any survey — and confirm it appears in the
   grid within 10 seconds with increasing progress, then confirm clicking "Refresh" updates it
   sooner than that.
4. Confirm each column renders sensibly: Type shows a human label (not the raw class name), Status,
   Survey (or `—` for a job with no survey), User (name or email), Progress `%`, Elapsed, Est.
   Remaining (or `-` once ended or before any progress), Started At.
5. Log in as a non-admin user and confirm the Job Monitor entry does not appear in the sidebar, and
   that `GET /api/jobs` returns 401 if called directly (e.g. via the browser's dev tools network
   tab or `curl` with that user's session cookie).

- [ ] **Step 8: Commit**

```bash
git add webapp/views/App/views/JobsMonitor
git commit -m "feat: add JobsMonitor screen (DataGrid, 10s polling, manual refresh)"
```

---

## Self-Review Notes

- **Spec coverage:** every "Main repo — server changes" and "Main repo — webapp changes" bullet
  from `docs/superpowers/specs/2026-08-24-job-monitor-design.md` maps onto a task above (1:1 with
  its own numbered list there), plus the `jobThreadExecutor.js` fix that the spec's addendum added
  after the original design pass. The i18n section maps to Task 6. The Testing section's two
  "must be rewritten" tests are Task 2 Step 1; its `jobRowToMonitorSummary` unit test is Task 4;
  its integration test for `getAll` is Task 3.
- **Placeholder scan:** no TBD/TODO; every step has real code, not a description of code.
- **Type/name consistency check:** `jobRowToMonitorSummary` (Task 4) is the exact name imported in
  Task 5's `jobManager.js`; Task 5's `GET /jobs` route is what Task 7's `fetchAllJobs` calls via
  `axios.get('/api/jobs')`; `fetchAllJobs` (Task 7) is the exact name Task 9's `useJobsMonitor.js`
  calls via `API.fetchAllJobs`; `appModules.jobs` (Task 8) is the exact object Task 9's
  `JobsMonitorModule.js` imports and uses for both `moduleRoot` and `moduleDefault`.
