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
