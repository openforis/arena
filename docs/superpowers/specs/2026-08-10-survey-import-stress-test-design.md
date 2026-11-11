# Survey Import Concurrency Stress Test

## Purpose

This branch (`fix/survey-import-concurrency`) fixed two DB connection-pool /
lock bugs in survey creation and import:

- `7dcc03c12` "run survey creation in job" — `SurveyManager.insertSurvey` used
  to hold a DB transaction open while `DBMigrator.migrateSurveySchema`
  acquired another connection from the same pool; concurrent creations could
  exhaust the pool and hang the server.
- `b0c3375c8` "fix import survey db lock" — same bug in
  `SurveyManager.importSurvey` (used for Arena backup restore and cloning).
- `2b35dd58a` "fixed survey creation starvation lock in user access request".

Existing regression coverage
(`test/integration/tests/_survey/surveyTest.js`:
`createSurveysConcurrentlyTest`, `importSurveysConcurrentlyTest`) calls
`SurveyManager` directly, in-process, with only 2 concurrent calls. It does
not exercise the real HTTP API, JWT auth, multipart file upload, or the
background `JobQueue` (concurrency controlled by the `jobQueueConcurrency` env
var) that a real client goes through.

This tool drives the actual HTTP API with a higher, configurable concurrency
(default 50) to validate the fix under conditions closer to real concurrent
usage, using a real Arena survey export zip as the import source.

## Scope

A standalone, manually-run Node script. Not wired into `yarn test` / CI — it
targets a running Arena server (typically local dev) and is a load-testing
tool, not an automated regression test.

## Behavior

1. Parse CLI flags (see Configuration).
2. `POST /auth/login` with `{ email, password }` → JWT `authToken`. All
   further requests send `Authorization: Bearer <authToken>`.
3. Read the given zip file into memory once (`fs.readFileSync`); reused as
   the multipart body for every request.
4. Build `count` requests, each `POST /api/survey/arena-import` as a single
   (non-chunked) `multipart/form-data` upload:
   - field `file`: the zip bytes (as a `Blob`)
   - field `survey`: JSON string `{ "name": "stress_test_<runId>_<i>",
     "options": { "includeData": false } }`
   Fire all `count` requests simultaneously via `Promise.allSettled` (true
   burst — matches the exact scenario the fixed bugs occurred in).
5. Each successful accept returns `{ job }` (a job UUID + initial status).
   Requests that fail at the HTTP layer (network error, non-2xx, timeout) are
   recorded as failed immediately with no job to poll.
6. For every accepted job, poll `GET /api/jobs/:jobUuid` (interval ~1s) until
   its status is `succeeded`, `failed`, or `canceled`, or until
   `--job-timeout` (default 120000 ms) elapses (recorded as `timed-out`).
   Polling for all jobs happens concurrently.
7. Print a summary report:
   - counts by outcome: succeeded / failed / timed-out / rejected-at-http
   - accept latency (time to HTTP response) and job latency (time from
     accept to terminal status): min / avg / max / p95
   - full error detail for every non-succeeded request (HTTP status/body,
     job status message) so failure classes (e.g. pool timeouts, 5xx,
     deadlocks) are visible, not just counts
8. Cleanup: for every request that produced a survey (job succeeded, or a
   survey was created despite eventual failure), `DELETE
   /api/survey/:surveyId` best-effort. Cleanup failures are logged but don't
   fail the run. Skipped entirely when `--keep` is passed.
9. Exit code: non-zero if any request did not succeed, so the script is
   usable as a simple pass/fail gate as well as an interactive tool.

## Configuration

CLI flags (env var fallback in parentheses):

- `--zip <path>` (required) — path to an Arena survey export/backup zip.
- `--count <n>` (default `50`)
- `--url <base>` (`ARENA_URL`, default `http://localhost:9090`)
- `--email <email>` (`ARENA_EMAIL`, then `ADMIN_EMAIL` from `.env`)
- `--password <pw>` (`ARENA_PASSWORD`, then `ADMIN_PASSWORD` from `.env`)
- `--job-timeout <ms>` (default `120000`)
- `--keep` — skip auto-cleanup of created surveys

`.env` at repo root is loaded via `dotenv` (matching `server/server.js`
convention) so `ADMIN_EMAIL`/`ADMIN_PASSWORD` are picked up automatically in
a typical local dev checkout without extra setup.

## Confirmed API contract (read from source, not assumed)

- `POST /auth/login` — mounted at server root (not under `/api`), see
  `node_modules/@openforis/arena-server/dist/api/auth/login.js`. Body
  `{ email, password }`, response `{ user, survey, authToken }`.
- `POST /api/survey/arena-import` —
  `server/modules/arenaImport/api/arenaImportApi.js`. Reads `survey` (JSON
  string, fields `name`/`options` used) and an uploaded `file` via
  `server/modules/file/service/requestChunkedFileProcessor.js`; omitting
  `chunk`/`totalChunks`/`totalFileSize` selects the non-chunked single-file
  path. Response `{ job }`.
- `GET /api/jobs/:jobUuid` — `server/job/jobApi.js`. Response is a job
  summary with a `status` field using values from
  `server/job/jobUtils.js:jobStatus` (`pending`, `running`, `succeeded`,
  `canceled`, `failed`).
- `DELETE /api/survey/:surveyId` — `server/modules/survey/api/surveyApi.js`.
- Route mounting: `authApi.init(app)` at root, `app.use('/api',
  apiRouter.router)` for everything else
  (`server/system/appCluster.js`, `server/system/apiRouter.js`).
- Auth: JWT bearer token (`passport-jwt`,
  `node_modules/@openforis/arena-server/dist/server/middleware/authentication.js`),
  sent as `Authorization: Bearer <token>`.

## Implementation notes

- Node 24 (per `package.json` engines) provides global `fetch`, `FormData`,
  and `Blob` — no HTTP client or multipart dependency needed.
- Plain CommonJS `.js` (no ESM extension, no babel/webpack) so it runs
  directly via `node test/load/surveyImportStressTest.js` with zero build
  step.
- Unique survey names use a per-run id (e.g. timestamp) + request index, so
  repeated runs never collide on survey name uniqueness validation.

## Non-goals

- Not added to `yarn test:*` scripts or CI.
- No ramped/staged load pattern (batches + delay) — true burst only, since
  that's what reproduces the fixed bug class. Can be added later if needed.
- No new npm dependencies.

## Addendum (post-implementation, found during final review)

Implementation (Tasks 1-5) and its per-task reviews are complete and clean.
The final whole-branch review then found that the tool's original premise —
firing N concurrent requests as a single logged-in user — cannot exercise
concurrent job execution at all, and found a real bug in how job results are
read. Both are addressed by Tasks 6-8 below.

**Discovery: `server/job/JobQueue.js` serializes survey creation/import
globally, not just per-user.** This is pre-existing queue infrastructure
(PR #3731, unrelated to this branch); survey creation/import only started
routing through it via this branch's own `7dcc03c12` ("run survey creation
in job"). `JobQueue.enqueue()` (`server/job/JobQueue.js:176-193`) throws
synchronously if the same user already has a running job
(`Only one job per user can run at a time`). Independently of that, both
`ArenaImportJob` and `SurveyCreatorJob` are constructed with no `surveyId`
in their job `params` (it's only set later, on the job's *context*, once
the survey row exists — `server/modules/arenaImport/service/arenaImport/jobs/surveyCreatorJob.js:75-77`,
`server/modules/survey/service/surveyCreateJob.js:24-27`), so
`_findNextJobIndex` (`JobQueue.js:120-138`) classifies them as *global*
jobs, gated by the single `_runningGlobalJob` slot
(`JobQueue.js:21,102,128-133,148-153,166`) — server-wide, across every user,
one survey-creation/import job executes at a time, period. Verified
directly against the server source (not inferred from behavior).

Consequence: firing N requests under one shared login gets 1 accepted job
and N-1 immediate HTTP 500s. Even N *distinct* users would only ever get
one job running at a time — true concurrent execution of the code this
branch fixed (`SurveyManager.insertSurvey`/`importSurvey`) is reachable
only by bypassing the job queue entirely, which is exactly what the
existing Jest regression tests already do
(`test/integration/tests/_survey/surveyTest.js`:
`createSurveysConcurrentlyTest`, `importSurveysConcurrentlyTest` — they call
`SurveyManager` directly).

**Decision (user-confirmed):** re-scope from "one shared login" to "N
distinct throwaway users, each importing their own survey." This can't
reproduce literal concurrent DB transactions (queue serialization still
applies), but it does exercise something the existing tests don't: whether
a burst of many different real users hitting the import endpoint at once —
auth, multipart upload, queueing, and eventual processing of a real backlog
— holds up without errors, leaks, or starvation, which is a legitimate and
different kind of load than the in-process regression tests cover.

**User provisioning is possible without new server changes.** Verified
`POST /api/user` (`server/modules/user/api/userApi.js:398`,
`AuthMiddleware.requireUserCreatePermission` → systemAdmin only): body
`{ "user": "<JSON-stringified user object>" }` with `name`, `email`,
`password` (top-level, read directly by
`server/modules/user/service/userService.js:322-334` via
`User.getPassword` — validation only checks `newPassword`/`confirmPassword`,
which don't need to be sent), and `props.title` (required; valid values
`mr`/`ms`/`preferNotToSay`, `core/user/_user/userProps.ts:25-29`). Status
is hardcoded to `ACCEPTED` on insert (`userService.js:324`) — the new user
can log in immediately, no invite/email step. There is no user-delete HTTP
endpoint (`UserManager.deleteUser` is internal-only,
`server/modules/user/repository/userRepository.js:494`), so throwaway users
are left in the database after a run — documented as a known limitation,
not fixed. Cleanup of the *surveys* those users create still works with the
admin's own token: `Authorizer.canEditSurvey`
(`node_modules/@openforis/arena-core/dist/auth/authorizer.js:12-23,43`)
has a systemAdmin bypass, so `DELETE /api/survey/:surveyId` as the admin
works regardless of which throwaway user owns the survey.

**Second bug, independent of the above:** `getJobStatus`'s response shape
differs between an *active* job (`JobThreadExecutor.getActiveJobSummary`,
full `jobToJSON` — has `surveyId`/`errors`/`result`) and a job read *after*
it has ended (`JobQueue.getJobSummary`'s fallback branch, `JobQueue.js:40-51`,
returns the bare `{params, status, type, uuid}` — none of those fields).
Since the poller's very last read is always the one that observes the
terminal status, it always hits the impoverished shape — `surveyId` is
never available at the point the code was reading it, so cleanup silently
deleted nothing, and failures always reported "unknown error." Fixed by
having the poller remember `surveyId`/`errors`/`result` from the last
*non-terminal* read (where the rich shape is available) and falling back
to those values when the terminal read lacks them.
