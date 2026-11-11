# Heroku Auto-Scaling — Job Queue Persistence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** With N Heroku dynos, `GET /jobs/:jobUuid` and `GET /jobs/active` must return correct status/progress regardless of which dyno started the job and which dyno serves the polling request, and "one job per user"/"one job per survey" must be enforced cluster-wide, not just within one dyno's in-memory queue.

**Architecture:** Job *execution* stays exactly as it is today — one dyno's `JobQueue` picks a job from its own local queue and runs it in a per-dyno `worker_threads` thread (`jobThread.js`) for CPU offloading, unchanged. What moves to Postgres is the *coordination bookkeeping*: `JobRepository` (from `@openforis/arena-server`, already implemented — `insert`, `updateStatus`, `updateProgress`, `getByUuid`, `getActiveByUserUuid`, `getActiveBySurveyId`) backs a `job` table that every dyno writes progress/status to and every dyno can read from for polling. `JobQueue.enqueue()` stays synchronous (unchanged contract, unchanged callers, unchanged existing test) — a DB row is inserted as a fire-and-forget side effect. Status/progress updates are persisted from the single existing chokepoint that already sees every job update on the main thread (`jobThreadExecutor.js`'s `_notifyJobUpdate`). `jobApi.js`'s GET endpoints read the DB first, falling back to local in-memory state only when the DB has no row yet (a genuine race-window fallback, and the only path for the small set of jobs that are never persisted — see the Global Constraints note on global jobs).

**Tech Stack:** `JobRepository` from `@openforis/arena-server` (pg-promise, Postgres `job` table).

## Global Constraints

- No Redis — Postgres-only, per the design spec's decision table (`docs/superpowers/specs/2026-08-06-heroku-horizontal-autoscaling-design.md` §3).
- Requires `docs/superpowers/plans/2026-08-19-autoscaling-0-dependency-setup.md` (both tasks — this plan needs `JobRepository`, which is only exported from arena-server's package entry point after Task 1 of that plan, and only reachable at all after Task 2's portal link).
- **`job.survey_id` is `NOT NULL` in the arena-server migration** (`../arena-server/src/db/dbMigrator/migration/public/migrations/sqls/20260819100000-create-table-job-up.sql:6`, with an FK to `survey(id)`). Two real, currently-shipping top-level job types have no `surveyId` at all: `SurveysListExportJob` (`server/modules/survey/service/surveyService.js:103`) and `MessageSendJob` (`server/modules/message/service/messageService.js:6`). **This plan does not persist global (no-`surveyId`) jobs to the `job` table at all** — every write in this plan is guarded by `if (surveyId)`. Cross-dyno polling and cross-dyno duplicate-prevention for these two job types remain exactly as reliable as they are today (same-dyno only) — not a regression, but not fixed either. If cluster-wide correctness for global jobs is needed later, it requires a separate arena-server migration to relax the constraint — out of scope here.
- `JobRepository.insert(params: { uuid, userUuid, surveyId, type }, client?)`, `.updateStatus(params: { uuid, status, props? }, client?)`, `.updateProgress(params: { uuid, processed, total }, client?)`, `.getByUuid(uuid, client?)`, `.getActiveByUserUuid(userUuid, client?)`, `.getActiveBySurveyId(surveyId, client?)` — all verified against `../arena-server/src/repository/job/*.ts`. `status` values must be plain strings matching arena's own `jobStatus` constants (`server/job/jobUtils.js:3-9`: `pending`/`running`/`succeeded`/`canceled`/`failed`) — Task 1 Step 5 below includes a test asserting these line up with `@openforis/arena-core`'s `JobStatus` enum (which `JobRepository.insert` uses internally), since the two are separate, independently-maintained string sets.
- Fire-and-forget DB writes (insert/update calls not awaited by their synchronous caller, errors caught and logged) is the established idiom in the sibling repo for this exact class of problem (`ClusterBus.publish`, `ConnectedSocketRepository` calls in `../arena-server/src/webSocket/server.ts`) — this plan follows the same pattern rather than threading `async`/`await` through `JobQueue.enqueue`'s 12 call sites across the codebase.

---

### Task 1: Add a `jobRowToSummary` mapper and persist a job row on enqueue

**Files:**
- Modify: `server/job/jobUtils.js`
- Modify: `server/job/JobQueue.js`
- Test: `test/unit/tests/jobRowToSummary.test.js` (new)
- Test: `test/unit/tests/016jobQueue.test.js` (extend)

**Interfaces:**
- Consumes: `JobRepository` from `@openforis/arena-server`.
- Produces: `jobRowToSummary(jobRow): object` (matches the `JobSerialized` shape the webapp already consumes via `common/job/jobSerialized.js`) — consumed by Task 2.

- [ ] **Step 1: Write the failing mapper test**

Create `test/unit/tests/jobRowToSummary.test.js`:

```js
import * as JobSerialized from '@common/job/jobSerialized'
import { jobRowToSummary, jobStatus } from '../../../server/job/jobUtils'

describe('jobRowToSummary', () => {
  test('maps a running job row', () => {
    const dateCreated = new Date('2026-08-19T10:00:00.000Z')
    const jobRow = {
      uuid: 'job-1',
      userUuid: 'user-1',
      surveyId: 42,
      type: 'DataExportJob',
      status: jobStatus.running,
      processed: 3,
      total: 10,
      props: {},
      dateCreated,
      dateModified: new Date('2026-08-19T10:00:05.000Z'),
    }

    const summary = jobRowToSummary(jobRow)

    expect(JobSerialized.getUuid(summary)).toBe('job-1')
    expect(JobSerialized.getStatus(summary)).toBe(jobStatus.running)
    expect(JobSerialized.isRunning(summary)).toBe(true)
    expect(JobSerialized.isEnded(summary)).toBe(false)
    expect(JobSerialized.getProgressPercent(summary)).toBe(30)
  })

  test('maps a succeeded job row with a result in props', () => {
    const jobRow = {
      uuid: 'job-2',
      userUuid: 'user-1',
      surveyId: 42,
      type: 'DataExportJob',
      status: jobStatus.succeeded,
      processed: 10,
      total: 10,
      props: { result: { filePath: '/tmp/export.zip' } },
      dateCreated: new Date('2026-08-19T10:00:00.000Z'),
      dateModified: new Date('2026-08-19T10:00:05.000Z'),
    }

    const summary = jobRowToSummary(jobRow)

    expect(JobSerialized.isSucceeded(summary)).toBe(true)
    expect(JobSerialized.isEnded(summary)).toBe(true)
    expect(JobSerialized.getProgressPercent(summary)).toBe(100)
    expect(JobSerialized.getResult(summary)).toEqual({ filePath: '/tmp/export.zip' })
  })
})
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `yarn build:test:unit && jest dist/__tests__/bundle.unit.js -t "jobRowToSummary"`
Expected: FAIL — `jobRowToSummary` is not exported from `jobUtils.js` yet.

- [ ] **Step 3: Implement `jobRowToSummary`**

In `server/job/jobUtils.js`, add (after the existing `jobToJSON` function):

```js
export const jobRowToSummary = (jobRow) => {
  const { uuid, userUuid, surveyId, type, status, processed, total, props, dateCreated, dateModified } = jobRow
  const ended = [jobStatus.succeeded, jobStatus.failed, jobStatus.canceled].includes(status)
  const progressPercent =
    status === jobStatus.succeeded ? 100 : total > 0 ? Math.floor((100 * processed) / total) : 0
  const elapsedMillis = (ended ? new Date(dateModified) : new Date()).getTime() - new Date(dateCreated).getTime()

  return {
    [JobSerialized.keys.uuid]: uuid,
    [JobSerialized.keys.type]: type,
    [JobSerialized.keys.userUuid]: userUuid,
    [JobSerialized.keys.surveyId]: surveyId,
    [JobSerialized.keys.innerJobs]: [],
    [JobSerialized.keys.currentInnerJobIndex]: -1,
    [JobSerialized.keys.status]: status,
    [JobSerialized.keys.pending]: status === jobStatus.pending,
    [JobSerialized.keys.running]: status === jobStatus.running,
    [JobSerialized.keys.succeeded]: status === jobStatus.succeeded,
    [JobSerialized.keys.canceled]: status === jobStatus.canceled,
    [JobSerialized.keys.failed]: status === jobStatus.failed,
    [JobSerialized.keys.ended]: ended,
    [JobSerialized.keys.total]: total,
    [JobSerialized.keys.processed]: processed,
    [JobSerialized.keys.progressPercent]: progressPercent,
    [JobSerialized.keys.elapsedMillis]: elapsedMillis,
    [JobSerialized.keys.errors]: props?.errors ?? null,
    [JobSerialized.keys.result]: props?.result ?? null,
  }
}
```

- [ ] **Step 4: Run the test again to verify it passes**

Run: `yarn build:test:unit && jest dist/__tests__/bundle.unit.js -t "jobRowToSummary"`
Expected: PASS.

- [ ] **Step 5: Add the status-string parity check against `@openforis/arena-core`**

Add to the same test file:

```js
import { JobStatus } from '@openforis/arena-core'

test('arena job statuses match @openforis/arena-core JobStatus values used by JobRepository.insert', () => {
  expect(jobStatus.pending).toBe(JobStatus.pending)
  expect(jobStatus.running).toBe(JobStatus.running)
  expect(jobStatus.succeeded).toBe(JobStatus.succeeded)
  expect(jobStatus.canceled).toBe(JobStatus.canceled)
  expect(jobStatus.failed).toBe(JobStatus.failed)
})
```

Run: `yarn build:test:unit && jest dist/__tests__/bundle.unit.js -t "JobStatus values"`
Expected: PASS. If any assertion fails, the DB `status` column will end up with values arena's own `jobStatus`/`JobSerialized` helpers don't recognize — stop and reconcile the two string sets before continuing (do not proceed to Task 2+ with a mismatch).

- [ ] **Step 6: Write the failing enqueue-persists test**

**Note (discovered while executing this step — record kept for reference, see Task 2's note for the general pattern used from here on):** the `jest.mock('@openforis/arena-server', ...)` factory shown below does not work in this repo's bundled unit-test setup (object-spread-in-factory rejected by Jest's out-of-scope-variable guard after babel/webpack transforms it, and — even past that — webpack's single shared external-module object across the whole concatenated `bundle.unit.js` makes `jest.mock()`'s effectiveness depend on load order relative to other test files). Use `jest.spyOn(JobRepository, 'insert').mockResolvedValue({})` in a `beforeAll`/`afterAll` within the `describe('JobQueue test', ...)` block instead — it mutates the method on the real, shared `JobRepository` object directly, which works correctly regardless of load order.

Add to `test/unit/tests/016jobQueue.test.js`:

```js
import { JobRepository } from '@openforis/arena-server'

// ... inside describe('JobQueue test', () => { ... }, add:

let insertSpy

beforeAll(() => {
  insertSpy = jest.spyOn(JobRepository, 'insert')
})

afterAll(() => {
  insertSpy.mockRestore()
})

beforeEach(() => {
  insertSpy.mockReset().mockResolvedValue({})
})

test('enqueue persists a job row for survey-scoped jobs', async () => {
  const job = new Job('SurveyJob', { surveyId: surveyId1, user: user1 })

  await enqueueJobs({ jobs: [job] })

  expect(insertSpy).toHaveBeenCalledWith({
    uuid: job.uuid,
    userUuid: user1.uuid,
    surveyId: surveyId1,
    type: 'SurveyJob',
  })
})

test('enqueue does not persist a job row for global (no-surveyId) jobs', async () => {
  const job = new Job('GlobalJob', { user: user1 })

  await enqueueJobs({ jobs: [job] })

  expect(insertSpy).not.toHaveBeenCalled()
})
```

- [ ] **Step 7: Run it and confirm it fails**

Run: `yarn build:test:unit && jest dist/__tests__/bundle.unit.js -t "enqueue persists"`
Expected: FAIL — `JobRepository.insert` isn't called anywhere yet.

- [ ] **Step 8: Wire the fire-and-forget insert into `JobQueue.enqueue`**

In `server/job/JobQueue.js`, add the import:

```js
import { JobRepository } from '@openforis/arena-server'
```

and change the `enqueue` method from:

```js
  enqueue(job) {
    const { params, status, type, uuid } = job
    const jobInfo = { params, status, type, uuid }
    const { user } = params ?? {}
    const { uuid: userUuid } = user

    if (this._runningJobUuidByUserUuid[userUuid]) {
      // only one job per user and per survey
      throw new Error('Only one job per user can run at a time')
    }
    this._logger.debug(`enqueuing job ${type} (${uuid})`)

    this._queue.push(jobInfo)
    this._jobInfoByUuid[uuid] = jobInfo
    this._jobUuidByUserUuid[userUuid] = uuid

    this._startNextJob()
  }
```

to:

```js
  enqueue(job) {
    const { params, status, type, uuid } = job
    const jobInfo = { params, status, type, uuid }
    const { user, surveyId } = params ?? {}
    const { uuid: userUuid } = user

    if (this._runningJobUuidByUserUuid[userUuid]) {
      // only one job per user and per survey
      throw new Error('Only one job per user can run at a time')
    }
    this._logger.debug(`enqueuing job ${type} (${uuid})`)

    this._queue.push(jobInfo)
    this._jobInfoByUuid[uuid] = jobInfo
    this._jobUuidByUserUuid[userUuid] = uuid

    if (surveyId) {
      // Fire-and-forget: makes the job pollable from any dyno via JobManager.getJobSummary/getActiveJobSummary.
      // Not persisted for global (no-surveyId) jobs - the job table's survey_id column is NOT NULL.
      JobRepository.insert({ uuid, userUuid, surveyId, type }).catch((error) =>
        this._logger.error(`error persisting job ${uuid}: ${error}`)
      )
    }

    this._startNextJob()
  }
```

- [ ] **Step 9: Run the tests again to verify they pass**

Run: `yarn build:test:unit && jest dist/__tests__/bundle.unit.js -t "016jobQueue"`
Expected: PASS, including the three pre-existing tests in this file (unchanged behavior — `enqueue` is still synchronous and still throws synchronously on a same-dyno duplicate).

- [ ] **Step 10: Commit**

```bash
git add server/job/jobUtils.js server/job/JobQueue.js test/unit/tests/jobRowToSummary.test.js test/unit/tests/016jobQueue.test.js
git commit -m "feat: add jobRowToSummary mapper and persist a job row on enqueue for survey-scoped jobs"
```

---

### Task 2: Read job status from the DB in `jobApi.js`, with local fallback

**Files:**
- Modify: `server/job/jobManager.js`
- Modify: `server/job/jobApi.js`
- Test: `test/unit/tests/jobManager.test.js` (new)

**Interfaces:**
- Consumes: `JobRepository.getByUuid`, `JobRepository.getActiveByUserUuid` (from Task 1's already-verified signatures), `jobRowToSummary` (Task 1).
- Produces: `JobManager.getJobSummary(jobUuid): Promise<object|null>`, `JobManager.getActiveJobSummary(userUuid): Promise<object|null>` — both now `async` (were sync before). `JobManager.enqueueJob`/`cancelActiveJobByUserUuid` are unchanged.

**Note (established while executing an earlier task in this plan):** the pattern originally specified here — `jest.mock('@openforis/arena-server', () => ({ ...jest.requireActual(...), JobRepository: {...} }))` — does not work in this repo's bundled unit-test setup. Two independent reasons: (1) the object-spread inside the mock factory gets transpiled to a helper Jest's "module factory cannot reference out-of-scope variables" guard rejects; (2) `test/unit/config/webpack.config.js` bundles every unit test file into one `bundle.unit.js`, and `@openforis/arena-server` is externalized (kept as a real `node_modules` require) — webpack guarantees a single shared exports object for that module across the whole bundle, so whichever test file's code runs first "wins" the real reference, making `jest.mock()`'s effectiveness depend on load order rather than working reliably. Use `jest.spyOn(RealModule, 'methodName')` instead — it mutates the method on the actual shared object at test-run time, which works correctly regardless of load order. Every test in this plan that touches `@openforis/arena-server` uses this pattern from here on.

- [ ] **Step 1: Write the failing test**

Create `test/unit/tests/jobManager.test.js`:

```js
import { JobRepository } from '@openforis/arena-server'
import * as JobManager from '../../../server/job/jobManager'
import { jobStatus } from '../../../server/job/jobUtils'

const jobRow = {
  uuid: 'job-1',
  userUuid: 'user-1',
  surveyId: 42,
  type: 'DataExportJob',
  status: jobStatus.running,
  processed: 1,
  total: 2,
  props: {},
  dateCreated: new Date(),
  dateModified: new Date(),
}

describe('JobManager DB-backed polling', () => {
  let getByUuidSpy
  let getActiveByUserUuidSpy

  beforeAll(() => {
    getByUuidSpy = jest.spyOn(JobRepository, 'getByUuid')
    getActiveByUserUuidSpy = jest.spyOn(JobRepository, 'getActiveByUserUuid')
  })

  afterAll(() => {
    getByUuidSpy.mockRestore()
    getActiveByUserUuidSpy.mockRestore()
  })

  beforeEach(() => {
    getByUuidSpy.mockReset()
    getActiveByUserUuidSpy.mockReset()
  })

  test('getJobSummary reads from the DB when a row exists', async () => {
    getByUuidSpy.mockResolvedValue(jobRow)

    const summary = await JobManager.getJobSummary('job-1')

    expect(getByUuidSpy).toHaveBeenCalledWith('job-1')
    expect(summary.uuid).toBe('job-1')
    expect(summary.running).toBe(true)
  })

  test('getJobSummary falls back to local state when the DB has no row (e.g. a global job)', async () => {
    getByUuidSpy.mockResolvedValue(null)

    const summary = await JobManager.getJobSummary('unknown-uuid')

    expect(summary).toBeNull()
  })

  test('getActiveJobSummary reads from the DB when a row exists', async () => {
    getActiveByUserUuidSpy.mockResolvedValue(jobRow)

    const summary = await JobManager.getActiveJobSummary('user-1')

    expect(getActiveByUserUuidSpy).toHaveBeenCalledWith('user-1')
    expect(summary.uuid).toBe('job-1')
  })
})
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `yarn build:test:unit && jest dist/__tests__/bundle.unit.js -t "DB-backed polling"`
Expected: FAIL — `getJobSummary`/`getActiveJobSummary` are currently synchronous and read only local `JobQueue` state.

- [ ] **Step 3: Rewrite `jobManager.js`**

Replace the full content of `server/job/jobManager.js`:

```js
import { JobRepository } from '@openforis/arena-server'

import * as ProcessUtils from '@core/processUtils'
import { JobQueue } from './JobQueue'
import { jobRowToSummary } from './jobUtils'

const queue = new JobQueue({ concurrency: ProcessUtils.ENV.jobQueueConcurrency })

// ====== READ

export const getActiveJobSummary = async (userUuid) => {
  const jobRow = await JobRepository.getActiveByUserUuid(userUuid)
  if (jobRow) return jobRowToSummary(jobRow)
  // Not every job is persisted (global jobs aren't - see job-queue-persistence plan's Global Constraints),
  // and there's a brief window right after enqueue before the fire-and-forget insert lands - fall back to
  // this dyno's own local state, which is always correct for a job this dyno actually knows about.
  return queue.getRunningJobSummaryByUserUuid(userUuid)
}

export const getJobSummary = async (jobUuid) => {
  const jobRow = await JobRepository.getByUuid(jobUuid)
  if (jobRow) return jobRowToSummary(jobRow)
  return queue.getJobSummary(jobUuid)
}

// ====== UPDATE

export const cancelActiveJobByUserUuid = async (userUuid) => queue.cancelJobByUserUuid(userUuid)

// ====== EXECUTE

export const enqueueJob = (job) => {
  queue.enqueue(job)
  return job
}
```

- [ ] **Step 4: Update `jobApi.js` to await the now-async functions**

In `server/job/jobApi.js`, change:

```js
  app.get('/jobs/active', async (req, res) => {
    const jobSummary = JobManager.getActiveJobSummary(Request.getUserUuid(req))
    res.json(jobSummary)
  })

  app.get('/jobs/:jobUuid', async (req, res) => {
    const { jobUuid } = Request.getParams(req)
    const jobSummary = JobManager.getJobSummary(jobUuid)
    res.json(jobSummary)
  })
```

to:

```js
  app.get('/jobs/active', async (req, res) => {
    const jobSummary = await JobManager.getActiveJobSummary(Request.getUserUuid(req))
    res.json(jobSummary)
  })

  app.get('/jobs/:jobUuid', async (req, res) => {
    const { jobUuid } = Request.getParams(req)
    const jobSummary = await JobManager.getJobSummary(jobUuid)
    res.json(jobSummary)
  })
```

- [ ] **Step 5: Run the test again to verify it passes**

Run: `yarn build:test:unit && jest dist/__tests__/bundle.unit.js -t "DB-backed polling"`
Expected: PASS.

- [ ] **Step 6: Run the full existing job test suite**

Run: `yarn build:test:unit && jest dist/__tests__/bundle.unit.js -t "job"`
Expected: PASS, no regressions.

- [ ] **Step 7: Commit**

```bash
git add server/job/jobManager.js server/job/jobApi.js test/unit/tests/jobManager.test.js
git commit -m "feat: read job status/progress from the DB for cross-dyno polling, with local fallback"
```

---

### Task 3: Persist status and progress updates as jobs run

**Files:**
- Modify: `server/job/jobThreadExecutor.js`
- Test: extend `test/unit/tests/jobThreadExecutor.test.js` (new, if none exists — verify with `find test/unit -iname "*jobThreadExecutor*"` first)

**Interfaces:**
- Consumes: `JobRepository.updateProgress`, `JobRepository.updateStatus` (Task 1's verified signatures).

- [ ] **Step 1: Check for an existing test file**

Run: `find test/unit test/integration -iname "*jobThreadExecutor*"`
If one exists, extend it following its existing conventions instead of creating a new one; otherwise create `test/unit/tests/jobThreadExecutor.test.js` as below.

- [ ] **Step 2: Write the failing test**

(Per this plan's Global Constraints note on Task 2: `jest.mock('@openforis/arena-server', ...)` doesn't work reliably in this repo's bundled test setup — use `jest.spyOn` on the real module instead. `_notifyJobUpdateForTest`/`_persistJobUpdate` never calls `WebSocketServer`/`WebSocketEvent` at all, so this test only needs to spy on `JobRepository.updateProgress`/`updateStatus`.)

```js
import { JobRepository } from '@openforis/arena-server'
import { _notifyJobUpdateForTest as _notifyJobUpdate } from '../../../server/job/jobThreadExecutor'

describe('jobThreadExecutor DB persistence', () => {
  let updateProgressSpy
  let updateStatusSpy

  beforeAll(() => {
    updateProgressSpy = jest.spyOn(JobRepository, 'updateProgress')
    updateStatusSpy = jest.spyOn(JobRepository, 'updateStatus')
  })

  afterAll(() => {
    updateProgressSpy.mockRestore()
    updateStatusSpy.mockRestore()
  })

  beforeEach(() => {
    updateProgressSpy.mockReset().mockResolvedValue(undefined)
    updateStatusSpy.mockReset().mockResolvedValue({})
  })

  test('persists progress and status for a survey-scoped job update', async () => {
    await _notifyJobUpdate({
      uuid: 'job-1',
      userUuid: 'user-1',
      surveyId: 42,
      type: 'DataExportJob',
      status: 'running',
      processed: 1,
      total: 2,
      ended: false,
    })

    expect(updateProgressSpy).toHaveBeenCalledWith({ uuid: 'job-1', processed: 1, total: 2 })
    expect(updateStatusSpy).toHaveBeenCalledWith({ uuid: 'job-1', status: 'running' })
  })

  test('merges result/errors into props when a survey-scoped job ends', async () => {
    await _notifyJobUpdate({
      uuid: 'job-1',
      userUuid: 'user-1',
      surveyId: 42,
      type: 'DataExportJob',
      status: 'succeeded',
      processed: 2,
      total: 2,
      ended: true,
      result: { filePath: '/tmp/export.zip' },
      errors: {},
    })

    expect(updateStatusSpy).toHaveBeenCalledWith({
      uuid: 'job-1',
      status: 'succeeded',
      props: { result: { filePath: '/tmp/export.zip' }, errors: {} },
    })
  })

  test('does not persist anything for a global (no-surveyId) job', async () => {
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

    expect(updateProgressSpy).not.toHaveBeenCalled()
    expect(updateStatusSpy).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 3: Run it and confirm it fails**

Run: `yarn build:test:unit && jest dist/__tests__/bundle.unit.js -t "jobThreadExecutor DB persistence"`
Expected: FAIL — `_notifyJobUpdateForTest` isn't exported, and no DB persistence exists yet.

- [ ] **Step 4: Add persistence to `jobThreadExecutor.js`**

In `server/job/jobThreadExecutor.js`, change the import line:

```js
import { WebSocketEvent, WebSocketServer } from '@openforis/arena-server'
```

to:

```js
import { JobRepository, WebSocketEvent, WebSocketServer } from '@openforis/arena-server'
```

and replace:

```js
const _notifyJobUpdate = (jobSerialized) => {
  const { userUuid } = jobSerialized

  activeJobSummariesByUserUuid.set(userUuid, jobSerialized)

  WebSocketServer.notifyUser(userUuid, WebSocketEvent.jobUpdate, jobSerialized)
  if (!jobSerialized.ended) {
    return
  }
```

with:

```js
const _persistJobUpdate = async (jobSerialized) => {
  const { uuid, surveyId, status, processed, total, result, errors, ended } = jobSerialized
  // Global (no-surveyId) jobs aren't persisted - see job-queue-persistence plan's Global Constraints
  // (the job table's survey_id column is NOT NULL).
  if (!surveyId) return

  try {
    await JobRepository.updateProgress({ uuid, processed, total })
    await JobRepository.updateStatus(ended ? { uuid, status, props: { result, errors } } : { uuid, status })
  } catch (error) {
    logger.error(`error persisting job update for job ${uuid}: ${error}`)
  }
}

export const _notifyJobUpdateForTest = _persistJobUpdate

const _notifyJobUpdate = (jobSerialized) => {
  const { userUuid } = jobSerialized

  activeJobSummariesByUserUuid.set(userUuid, jobSerialized)

  WebSocketServer.notifyUser(userUuid, WebSocketEvent.jobUpdate, jobSerialized)
  _persistJobUpdate(jobSerialized).catch((error) => logger.error(`error persisting job update: ${error}`))

  if (!jobSerialized.ended) {
    return
  }
```

(the rest of the function, from the `const jobThread = userJobThreads.getThread(userUuid)` line onward, is unchanged)

- [ ] **Step 5: Run the test again to verify it passes**

Run: `yarn build:test:unit && jest dist/__tests__/bundle.unit.js -t "jobThreadExecutor DB persistence"`
Expected: PASS.

- [ ] **Step 6: Run the full existing job test suite**

Run: `yarn build:test:unit && jest dist/__tests__/bundle.unit.js -t "job"`
Expected: PASS, no regressions.

- [ ] **Step 7: Commit**

```bash
git add server/job/jobThreadExecutor.js test/unit/tests/jobThreadExecutor.test.js
git commit -m "feat: persist job status and progress to the DB as jobs run"
```

---

### Task 4: Enforce "one job per user/survey" cluster-wide at job-start time

**Files:**
- Modify: `server/job/JobQueue.js`
- Test: extend `test/unit/tests/016jobQueue.test.js`

**Interfaces:**
- Consumes: `JobRepository.getActiveByUserUuid`, `JobRepository.getActiveBySurveyId`, `JobRepository.updateStatus` (Task 1/3's verified signatures), `WebSocketServer.notifyUser`, `WebSocketEvent.jobUpdate`, `jobStatus` from `./jobUtils`.

**Context:** The existing local `_runningJobUuidByUserUuid`/`_runningJobUuidBySurveyId` maps already prevent a *second* job for the same user/survey from starting on the *same* dyno (this stays unchanged — it's what today's `016jobQueue.test.js` tests). What's missing is the cross-dyno case: dyno A already has a job running for user X (dyno B doesn't know this locally). This task adds a DB check immediately before a queued job would actually start executing (not at `enqueue()` time, to keep `enqueue()` synchronous per this plan's Global Constraints) — if the DB shows an active job elsewhere for the same user or survey, the queued job is failed immediately with a clear error instead of starting a duplicate worker thread.

**Note (discovered while executing this task — the design below reflects the fix, not the plan's original text):** converting `_startNextJob` to `async` naively (as originally drafted here) introduces a real reentrancy race: `enqueue()` calls `this._startNextJob()` fire-and-forget, and when multiple `enqueue()` calls happen synchronously back-to-back (e.g. enqueueing several jobs in a tight loop, exactly what the pre-existing tests in this file do), each triggers an independent `_startNextJob()` invocation. Since the new DB check (`await this._hasActiveJobElsewhere(...)`) yields control back to the event loop before the queue is mutated, multiple invocations can each read the same unmutated `this._queue`, independently conclude "run the job at index 0", and then all proceed past their `await` and mutate/execute against a queue another one has already changed — reproduced as literal double/triple/quadruple execution of the same job with others silently skipped. Two more, smaller issues compound this: `enqueue()`'s synchronous per-user guard (`if (this._runningJobUuidByUserUuid[userUuid])`) also breaks, because it depended on `_startNextJob` synchronously promoting a job to "running" within the same call stack, which is no longer true once `_startNextJob` is async; and the new test can't use the file's shared `enqueueJobs` helper as originally drafted, since that helper only resolves/rejects via `_executeJob`'s callback path, which `_failQueuedJob` never reaches. The design below (a promise-chain serializing `_startNextJob` invocations, a guard fix, and a standalone test that doesn't depend on `enqueueJobs`) closes all three.

- [ ] **Step 1: Write the failing test**

Add to `test/unit/tests/016jobQueue.test.js`, extending Task 1's existing `jest.spyOn(JobRepository, 'insert')` `beforeAll`/`afterAll` setup in the `describe('JobQueue test', ...)` block with three more spies (`getActiveByUserUuid`, `getActiveBySurveyId`, `updateStatus`) plus a `WebSocketServer.notifyUser` spy (per this plan's Global Constraints note on Task 2 — `jest.mock()` on `@openforis/arena-server` doesn't work reliably in this repo's bundled test setup, use `jest.spyOn` on the real module instead):

```js
import { JobRepository, WebSocketServer } from '@openforis/arena-server'

// Extend Task 1's existing beforeAll/afterAll in this describe block:
//   getActiveByUserUuidSpy = jest.spyOn(JobRepository, 'getActiveByUserUuid').mockResolvedValue(null)
//   getActiveBySurveyIdSpy = jest.spyOn(JobRepository, 'getActiveBySurveyId').mockResolvedValue(null)
//   updateStatusSpy = jest.spyOn(JobRepository, 'updateStatus').mockResolvedValue({})
//   notifyUserSpy = jest.spyOn(WebSocketServer, 'notifyUser').mockImplementation(() => {})
// (declare each with `let`, assign in beforeAll, .mockRestore() in afterAll, .mockReset() + re-set
// the default resolved value in beforeEach - same shape as Task 1's insertSpy)

// This test does NOT use the shared enqueueJobs helper (which only settles via _executeJob's
// callback path - _failQueuedJob never reaches it, so a job failed pre-execution would hang the
// helper's promise forever). It uses a plain JobQueue instance directly (not TestJobQueue, since
// we specifically want the real _hasActiveJobElsewhere check to prevent _executeJob from running
// at all) and asserts via the WebSocketServer.notifyUser spy, which _failQueuedJob always calls.
test('a job is failed fast when another dyno already has an active job for the same survey', async () => {
  getActiveBySurveyIdSpy.mockResolvedValueOnce({ uuid: 'other-dyno-job-uuid' })

  const queue = new JobQueue()
  const job = new Job('SurveyJob', { surveyId: surveyId1, user: user1 })

  queue.enqueue(job)
  await queue._startNextJobChain

  expect(notifyUserSpy).toHaveBeenCalledWith(
    user1.uuid,
    expect.anything(),
    expect.objectContaining({ status: jobStatus.failed })
  )
})
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `yarn build:test:unit && jest dist/__tests__/bundle.unit.js -t "already has an active job"`
Expected: FAIL — no such check exists yet, so the job would just run normally (no `notifyUser` call with a failed status).

**Note (this task went through several rounds of discovery during execution — the design below is the final, fully-corrected one; do not implement the naive "just add `async`" version):**

- Converting `_startNextJob` to `async` naively creates a reentrancy race: concurrent fire-and-forget `enqueue()` calls (e.g. several enqueues in a synchronous burst) each read `this._queue` before any of them mutates it, causing the same job to run multiple times and others to be skipped or lost. Fix: split into a public `_startNextJob()` that serializes callers through a stored `this._startNextJobChain` promise, and an internal `_startNextJobInternal()` that does the actual work, recursing **directly into itself** (never back through the public wrapper — doing so creates a circular promise dependency that deadlocks the queue after the first job, since the wrapper's own promise ends up depending on a later link of itself).
- `enqueue()`'s synchronous per-user guard needs to become survey-aware, not simply "does this user have any outstanding job" — a user can legitimately have multiple simultaneously-queued jobs across *different* surveys (pre-existing, load-bearing behavior — see the `'global jobs executed before survey ones'` test). But a **global** job (no `surveyId`) must always conflict with anything else for that user, in either direction: global jobs are never persisted to the `job` table (`survey_id` is `NOT NULL`), so the cluster-wide `_hasActiveJobElsewhere` DB check can never catch a global+survey conflict for the same user — nothing else backstops it, and letting two jobs run concurrently for one user corrupts `jobThreadExecutor.js`'s userUuid-keyed caches (thread handles, active-summary cache all get clobbered by whichever job updates most recently).
- Moving the `_queue.splice(...)` calls to *after* the new `await this._hasActiveJobElsewhere(...)` (necessary, since the check needs the job's info first) opens a window where the pre-await `nextJobIndex` can go stale: `cancelJobByUserUuid()` (and `destroy()`, which loops it) mutate `this._queue` directly and synchronously, and are **not** routed through `_startNextJob`'s serialization chain. If a cancel removes a different queued job while a traversal is suspended on the DB check, the stale index can point at the wrong item — leading to the checked job running twice, an innocent job getting evicted without its bookkeeping cleaned up (permanently wedging that user), or a job that was just cancelled getting executed anyway. Fix: re-resolve the job's position by object identity (`this._queue.indexOf(jobInfo)`) after the await, rather than trusting the pre-await index, and bail cleanly (move to the next job) if it's no longer present.

- [ ] **Step 3: Add the DB pre-flight check to `JobQueue.js`, with a serialized, race-free `_startNextJob`**

Add the imports (alongside the `JobRepository` import from Task 1):

```js
import { JobRepository, WebSocketEvent, WebSocketServer } from '@openforis/arena-server'

import { jobStatus } from './jobUtils'
```

In the constructor, add `this._startNextJobChain = Promise.resolve()` alongside the other instance fields (so it's discoverable there rather than only implied by a fallback deep in `_startNextJob`).

Fix `enqueue()`'s per-user guard — change:

```js
    if (this._runningJobUuidByUserUuid[userUuid]) {
      // only one job per user and per survey
      throw new Error('Only one job per user can run at a time')
    }
```

to:

```js
    const existingJobUuid = this._jobUuidByUserUuid[userUuid]
    if (existingJobUuid) {
      const existingJobInfo = this._jobInfoByUuid[existingJobUuid]
      const existingSurveyId = existingJobInfo?.params?.surveyId
      if (existingSurveyId === surveyId || existingSurveyId === undefined || surveyId === undefined) {
        // Only one job per user and per survey (queued or running). A global job (no
        // surveyId) always conflicts with anything else for that user, since global jobs
        // are never persisted to the job table and so can't be caught by the cluster-wide
        // _hasActiveJobElsewhere DB check either - this synchronous guard is the only
        // thing that catches that case. Different-survey jobs for the same user are
        // allowed to coexist (see 'global jobs executed before survey ones' test).
        throw new Error('Only one job per user can run at a time')
      }
    }
```

(`_jobUuidByUserUuid[userUuid]` is set synchronously at the end of `enqueue()` for every job — queued or running — and cleared in `onJobEnd()` and the new `_failQueuedJob` below; this stays a same-tick synchronous check, preserving the guarantee the existing "user can enqueue only one job" test depends on.)

Replace `_startNextJob` and `_executeJob`:

```js
  _executeJob(jobInfo) {
    JobThreadExecutor.executeJobThread(jobInfo, this.onJobUpdate.bind(this))
  }

  async _hasActiveJobElsewhere({ uuid, userUuid, surveyId }) {
    const activeByUser = await JobRepository.getActiveByUserUuid(userUuid).catch((error) => {
      this._logger.error(`error checking active job by user: ${error}`)
      return null
    })
    if (activeByUser && activeByUser.uuid !== uuid) return true

    if (surveyId) {
      const activeBySurvey = await JobRepository.getActiveBySurveyId(surveyId).catch((error) => {
        this._logger.error(`error checking active job by survey: ${error}`)
        return null
      })
      if (activeBySurvey && activeBySurvey.uuid !== uuid) return true
    }
    return false
  }

  async _failQueuedJob({ jobInfo, message }) {
    const { uuid, params } = jobInfo
    const { user, surveyId } = params ?? {}
    const { uuid: userUuid } = user

    jobInfo.status = jobStatus.failed
    this.deleteJobInfo({ jobUuid: uuid })
    delete this._jobUuidByUserUuid[userUuid]

    if (surveyId) {
      await JobRepository.updateStatus({
        uuid,
        status: jobStatus.failed,
        props: { errors: { generic: { key: 'appErrors:generic', params: { text: message } } } },
      }).catch((error) => this._logger.error(`error persisting failed status for job ${uuid}: ${error}`))
    }

    WebSocketServer.notifyUser(userUuid, WebSocketEvent.jobUpdate, jobInfo)
  }

  // Public entry point: serializes concurrent external triggers (enqueue(), onJobEnd())
  // so at most one logical traversal of the queue is ever in flight. Each external call
  // chains onto whatever traversal is currently running (or starts a fresh one). Call
  // sites intentionally do NOT await this (fire-and-forget). Note cancelJobByUserUuid()/
  // destroy() mutate this._queue directly and are NOT routed through this chain - that's
  // exactly why _startNextJobInternal re-resolves a job's position by identity after its
  // await, below, rather than trusting a pre-await index.
  _startNextJob() {
    this._startNextJobChain = this._startNextJobChain
      .then(() => this._startNextJobInternal())
      .catch((error) => this._logger.error(`error in job queue loop: ${error}`))
    return this._startNextJobChain
  }

  // Recursive draining of the queue for a single triggered traversal. This recurses into
  // itself directly (NOT via _startNextJob()) so that a full drain resolves as one unit
  // and the chain above only advances to the next external caller once this traversal has
  // completely finished. Recursing through _startNextJob() instead would re-read
  // this._startNextJobChain while it still points at this very call, creating a circular
  // promise dependency that deadlocks the queue after the first job.
  async _startNextJobInternal() {
    if (this._queue.length === 0) {
      return false
    }
    if (Object.keys(this._runningJobUuidByUuid).length === this._maxConcurrentJobs) {
      this._logger.debug('max jobs running reached')
      return
    }
    const nextJobIndex = this._findNextJobIndex()
    if (nextJobIndex >= 0) {
      const jobInfo = this._queue[nextJobIndex]
      const { uuid, params } = jobInfo
      const { surveyId, user } = params ?? {}
      const { uuid: userUuid } = user

      const conflictsElsewhere = await this._hasActiveJobElsewhere({ uuid, userUuid, surveyId })

      // Re-resolve by identity: cancelJobByUserUuid()/destroy() can have mutated this._queue
      // while the DB check above was in flight, making the pre-await nextJobIndex stale.
      const currentIndex = this._queue.indexOf(jobInfo)
      if (currentIndex < 0) {
        // jobInfo was removed from the queue while the cluster-wide check was in flight
        // (e.g. cancelled) - nothing to do for it, move on to whatever's next.
        return this._startNextJobInternal()
      }

      if (conflictsElsewhere) {
        this._logger.debug(`job ${uuid} conflicts with an active job on another dyno; failing it`)
        this._queue.splice(currentIndex, 1)
        await this._failQueuedJob({ jobInfo, message: 'Another job is already running for this user or survey' })
        return this._startNextJobInternal()
      }

      this._queue.splice(currentIndex, 1)

      this._logger.debug(`starting next job: ${uuid} survey id: ${surveyId ?? ''} user uuid: ${userUuid}`)

      this._runningJobUuidByUuid[uuid] = uuid
      this._runningJobUuidByUserUuid[userUuid] = uuid
      if (surveyId) {
        this._runningJobUuidBySurveyId[surveyId] = uuid
      } else {
        this._runningGlobalJob = true
      }
      this._executeJob(jobInfo)

      return this._startNextJobInternal()
    } else {
      this._logger.debug('cannot run next job: wait for current one to complete.')
    }
  }
```

`enqueue()` and `onJobEnd()` still call the public `this._startNextJob()` exactly as before this task — fire-and-forget, unchanged call sites. `cancelJobByUserUuid()`/`destroy()` are unchanged too (still mutate `_queue` directly, still don't call `_startNextJob()`) — the identity-based re-resolution above is what makes that safe rather than requiring them to be routed through the chain.

- [ ] **Step 4: Run the test again to verify it passes**

Run: `yarn build:test:unit && jest dist/__tests__/bundle.unit.js -t "016jobQueue"`
Expected: PASS, including all pre-existing tests in this file (they don't mock `getActiveByUserUuid`/`getActiveBySurveyId` to return a conflict, so `_hasActiveJobElsewhere` resolves `false` for them and behavior is unchanged).

- [ ] **Step 5: Commit**

```bash
git add server/job/JobQueue.js test/unit/tests/016jobQueue.test.js
git commit -m "feat: fail a queued job fast when another dyno already has an active job for the same user or survey"
```

---

### Task 5: Verify cross-dyno job polling locally

**Files:** none (manual verification, per the design spec's test plan §7).

- [ ] **Step 1: Build and start two instances against the same DB on different ports**

```bash
yarn build:server:dev
PORT=9090 node dist/index.js &
PORT=9091 node dist/index.js &
```

- [ ] **Step 2: Start a job via one instance**

Trigger a survey-scoped job (e.g. a data export) via a request to `:9090`.

- [ ] **Step 3: Poll its status via the other instance**

`GET /api/jobs/:jobUuid` against `:9091` while the job is still running, and again after it completes.

- [ ] **Step 4: Confirm correct progress and final status**

Expected: the `:9091` response shows live progress while running and the correct final status/result once the job (running on `:9090`'s worker thread) completes — matching the design spec's "Local multi-instance simulation" test plan item 2 ("A job started via one instance shows correct progress and final status when polled/streamed through the other instance").

- [ ] **Step 5: Stop both instances**

```bash
kill %1 %2
```

This task has no commit — it's a manual verification step confirming Tasks 1–4 work end-to-end.
