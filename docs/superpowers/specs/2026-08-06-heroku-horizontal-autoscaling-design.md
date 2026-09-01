# Heroku Horizontal Auto-Scaling — Design Spec

**Date:** 2026-08-06
**Branch:** `feat/auto-scaling`
**Companion repo:** `../arena-server` (`feat/auto-scaling`) — `docs/superpowers/specs/2026-08-06-heroku-horizontal-autoscaling-design.md`
**Predecessor:** none

---

## 1. Overview

Arena runs on Heroku as a single dyno. Auto-scaling (running N dynos behind
Heroku's router) is unsafe today because several subsystems keep authoritative
state in the memory of one Node process, or on that process's local disk,
instead of somewhere every dyno can see. Two issues were named up front
(WebSockets, the record-update thread); investigation of the actual source in
both `arena` and `@openforis/arena-server` surfaced three more that would
misbehave identically once >1 dyno is running: the background job
queue/progress, the six cron schedulers, and the chunked file-upload pipeline.

Session/auth state is **already stateless** (Passport JWT strategy + DB-backed
refresh tokens, see `@openforis/arena-server`'s `authentication.js` /
`userAuthToken` service) — confirmed not a blocker, no changes needed there.

Goal: N Heroku dynos can run concurrently against the same Postgres database
with no correctness regressions, so Heroku's dyno autoscaling can be turned on.

---

## 2. Problem

| Symptom (once >1 dyno) | Cause |
|---|---|
| A user's WebSocket update (job progress, record edit from another tab, role/survey change) silently never arrives | `WebSocketServer` (`arena-server/src/webSocket/server.ts`) keeps `socketsById`/`socketIdsByUserUuid` as process-local `static` `Map`s, plain `socket.io` `Server`, no cross-instance adapter. `notifySocket`/`notifyUser` no-op if the target socket isn't in *this* process. The client's axios interceptor (`webapp/app/appWebSocket.js`) stamps its own `socket.id` on every REST call as a `socketid` header, but that REST call can land on a different dyno than the one holding the actual socket connection — Heroku's router has no session affinity. |
| Two users (or two tabs) editing the same record can silently clobber each other's changes, or see stale/incorrect validation state | `server/modules/record/service/update/`: despite the name, `SurveyRecordsThreadMap.getKey()` returns a **constant** string (`survey_records_thread`) — there is exactly **one** worker thread per dyno (`thread/recordsUpdateThread.js`), serializing *all* record mutations for that process through an internal `Queue`, and holding the authoritative in-memory copy of loaded records + survey definitions (`this.surveysDataCache` / nested `recordsCache`). Two dynos editing the same record keep **independent, uncoordinated** in-memory copies. |
| Job progress / status polling shows nothing or stale data depending which dyno answers | `server/job/JobQueue.js` + `jobThreadExecutor.js` hold all queue/progress/concurrency-limit state in module-level `Map`s (`_jobInfoByUuid`, `_runningJobUuidByUserUuid`, `activeJobSummariesByUserUuid`, …). No DB-backed job table exists; `server/job/jobApi.js`'s `GET /jobs/:jobUuid` and `GET /jobs/active` read straight from these local maps. |
| Daily/weekly cleanup jobs run N times instead of once | `server/system/schedulers/*.js` (6 files) each call `schedule.scheduleJob(cron, fn)` directly, unconditionally started in `server/system/appCluster.js`. No leader election. |
| Chunked CSV/data-import or survey-file uploads fail intermittently | `server/modules/file/manager/tempFileManager.js`: files under 10MB *always* use local disk for chunks regardless of configured final storage type, and `mergeTempChunks` always writes the merged output to local disk. A multi-request chunked upload whose chunks land on different dynos breaks outright, not hypothetically. |

---

## 3. Decisions

| Topic | Choice |
|---|---|
| Infra | **No Redis.** Everything built on Postgres (already a hard dependency): advisory locks + `LISTEN`/`NOTIFY`. |
| `@openforis/arena-server` | User-maintained sibling package (`../arena-server`, same org). Low-level `WebSocketServer` fix happens there, published as a new version, then the dependency is bumped in `arena` (currently `^1.3.27`). |
| Record concurrency | Keep the existing per-dyno worker-thread design (it exists for CPU offloading of expression evaluation). Serialize cross-dyno edits to the same record with a **Postgres advisory lock** keyed by record UUID, rather than reworking to fully stateless per-request processing. |
| Scope | Full auto-scaling readiness: WebSockets, record concurrency, jobs, cron dedup, chunked uploads. Not just the two originally-named issues. |
| Shared primitive | One Postgres-backed "cluster bus" (presence table + `LISTEN`/`NOTIFY` relay), built once in `arena-server`, reused by every fix below instead of a bespoke mechanism per subsystem. |

---

## 4. Architecture

### 4.1 Foundational primitive: Postgres cluster bus (lives in `arena-server`)

1. **Presence table** `connected_socket` (`socket_id` PK, `user_uuid`,
   `connected_at`, `last_seen_at`) — written by `WebSocketServer`'s existing
   connect/disconnect handlers. Gives any dyno a cheap, indexed, cluster-wide
   answer to "is this socket/user connected" without a request/reply protocol.
   Graceful shutdown (SIGTERM) removes this dyno's own rows; a periodic
   heartbeat + TTL cleanup (via the scheduler lock utility, §4.4) catches
   ungraceful termination (SIGKILL/crash).
2. **`LISTEN`/`NOTIFY` relay** on one channel (e.g. `arena_cluster_event`), one
   dedicated `pg-promise` direct connection per dyno held open for `LISTEN`.
   `notifySocket`/`notifyUser` try the local `socketsById` map first (cheap,
   correct on a hit); on a miss they `NOTIFY` the channel with
   `{ targetType, targetId, eventType, message }` — every dyno's listener
   checks its own local map and delivers if it owns the target, no-ops
   otherwise. Postgres caps `NOTIFY` payloads at 8000 bytes: payloads over a
   safe threshold get written to `ws_relay_message(id, payload jsonb,
   created_at)` first, with just the row id in the `NOTIFY` message; a TTL
   sweep (§4.4) prunes old rows.

This relay is **not** WebSocket-specific — it's reused unmodified as the
general "invalidate this on every dyno" broadcast for record/survey cache
invalidation (§4.3).

### 4.2 WebSocket delivery (repo: `arena-server`)

Files: `src/webSocket/server.ts`, new migration under
`src/db/dbMigrator/migration/public/migrations/`.

- Add `connected_socket` + `ws_relay_message` tables (new migration, follow
  the pattern of e.g. `20251030103141-add-table-user-refresh-token.js`).
- `addSocket`/`deleteSocket` write through to `connected_socket` in addition
  to the existing local `Map`s (local maps stay — needed to actually call
  `.emit()` on a real `Socket` object; the table is the cluster-wide index).
- `notifySocket`, `notifyUser`, `isSocketConnected` become cluster-aware per
  §4.1.
- Version bump + publish; bump `"@openforis/arena-server"` in `arena`'s
  `package.json`.

This alone fixes cross-dyno delivery for job-progress updates
(`server/job/jobThreadExecutor.js`), user/role/survey notifications
(`server/modules/user/service/userService.js`), and AI translation streaming
(`server/modules/ai/api/translationApi.js`) with **no call-site changes** —
they already go through `WebSocketServer.notifySocket`/`notifyUser`.

### 4.3 Record-update concurrency (repo: `arena`)

Files: `server/modules/record/service/update/thread/recordsUpdateThread.js`,
`recordSocketsMap.js`, `surveyRecordsThreadService.js`.

- **Advisory lock per record**: in `RecordsUpdateThread.processMessage`,
  before `processRecordNodePersistMsg`/`processRecordNodeDeleteMsg` (and, for
  consistency, `processRecordInitMsg`/`processRecordReloadMsg`), acquire
  `pg_advisory_xact_lock(hash(recordUuid))` for the duration of the DB
  transaction that `RecordManager.persistNode`/`deleteNode` already opens
  (transaction-scoped locks auto-release on commit/rollback — no leaked-lock
  risk from a crashed dyno). Verify `persistNode`/`deleteNode` wrap their
  writes in one transaction today; if not, that boundary needs to exist first
  (fall back to a session-held `pg_advisory_lock` + explicit `finally` unlock
  only if a single enclosing transaction isn't practical).
- **Staleness check**: records already carry a `date_modified` column (added
  by arena-server migration
  `20230802195435-alter-table-record-add-column-date-modified.js`). After
  acquiring the lock, compare the cached record's `date_modified` against the
  DB's current value (cheap indexed lookup). On mismatch — another dyno
  committed a change since this dyno cached the record — drop the cache entry
  and re-fetch via `RecordManager.fetchRecordAndNodesByUuid` before applying
  the new mutation. This is what actually prevents lost updates; the lock
  alone only serializes ordering.
- **`recordSocketsMap.js` → DB table**: replace the in-memory
  `socketIdsByRecordUuid` Map with a small table (e.g.
  `record_socket_association(record_uuid, socket_id, created_at)`, new
  arena-server migration) behind the same function signatures (`assocSocket`,
  `dissocSocket`, `dissocSocketBySocketId`, `getSocketIdsByRecordUuid`,
  `dissocSocketsByRecordUuid`) so `surveyRecordsThreadService.js`'s callers
  don't change. Needed because a record's `checkIn` (association) and a later
  `persistNode` (delivery) can land on different dynos.
- **Cluster-wide cache invalidation**: `clearSurveyDataFromThread`/
  `clearRecordDataFromThread` (called from `surveyService.js` on survey
  structure changes) currently only clear the *initiating* dyno's local
  thread cache — other dynos serve a stale survey/dependency-graph for up to
  the thread's 10-minute inactivity timeout. Publish these as events on the
  §4.1 cluster bus so every dyno's `RecordsUpdateThreadService` posts the
  equivalent `surveyClear`/`recordClear` message to its own local thread on
  receipt.

### 4.4 Job queue/progress (repo: `arena`)

Files: `server/job/JobQueue.js`, `server/job/jobThreadExecutor.js`,
`server/job/jobManager.js`, `server/job/jobApi.js`.

- Add a `job` table (uuid PK, `user_uuid`, `survey_id`, `type`, `status`,
  `progress`/`props` jsonb, `created_at`, `updated_at`) via new migration.
- Move "one job per user" / "one job per survey" enforcement from in-memory
  maps to a DB check against this table.
- `jobApi.js`'s `GET /jobs/:jobUuid`, `GET /jobs/active` read from the DB
  instead of `JobManager`'s local state, so polling works regardless which
  dyno serves it.
- Execution stays as-is (per-dyno `worker_threads` for CPU offloading) — only
  the coordination bookkeeping moves to the DB. Progress push notifications
  keep using `WebSocketServer.notifyUser`, cluster-safe per §4.2.

### 4.5 Cron scheduler deduplication (repo: `arena`)

Files: all six under `server/system/schedulers/`.

- Add one `runWithClusterLock({ lockName, fn })` utility using
  `pg_try_advisory_lock`/`pg_advisory_unlock` (non-blocking — skip silently
  if another dyno already holds the lock for this tick). Wrap each
  scheduler's cron callback body with it. Same utility backs the
  `ws_relay_message`/`connected_socket` TTL sweeps from §4.1.
- Also verify `DataMigrator.migrateData()` and
  `UserService.insertSystemAdminUserIfNotExisting()` in `appCluster.js` — both
  run unconditionally on every boot. Check whether the migration runner
  already locks (many do); if not, wrap with the same utility so concurrent
  dyno startups during a deploy don't race.

### 4.6 Chunked upload / temp file storage (repo: `arena`)

Files: `server/modules/file/manager/tempFileManager.js`,
`server/modules/file/repository/tempFileRepositoryFileSystem.js` /
`tempFileRepositoryS3Bucket.js`.

- Remove the unconditional "files under 10MB always use local filesystem"
  branch and the local-disk-only merge target in `mergeTempChunks` — for
  multi-dyno deployments, chunk storage and the merged output must both go to
  the same externalized store (S3, already supported via
  `FILE_STORAGE_AWS_S3_BUCKET_NAME`) regardless of file size.
- Apply the same fix to `keepFileForLaterUse`/`getKeptFilePath` (persists a
  merged import file keyed by `fileId` for a later "confirm import" request —
  same cross-dyno local-disk dependency).
- `FILE_STORAGE_AWS_S3_BUCKET_NAME` (+ region/keys) becomes effectively
  required once running >1 dyno; local-disk temp storage remains fine for
  single-dyno/dev setups.

---

## 5. Edge cases

| Case | Behavior |
|---|---|
| Dyno killed without clean disconnect (SIGKILL, OOM) | `connected_socket` rows go stale until the heartbeat TTL sweep (§4.1) prunes them; delivery attempts to a dead socket fail locally and self-heal the same way `notifyRecordUpdateToSockets` already does today (checks `isSocketConnected` before emitting). |
| `NOTIFY` payload > ~7KB (safety margin under the 8000-byte Postgres cap) | Spill to `ws_relay_message` table, `NOTIFY` carries only the row id. |
| Record edited on dyno A while dyno B is mid-processing the same record | Dyno B's `pg_advisory_xact_lock` acquisition blocks until dyno A's transaction (holding the same lock) commits; on acquiring, dyno B's staleness check (§4.3) detects the `date_modified` change and refetches before applying its mutation. |
| Survey structure changed while another dyno has it cached | Cluster-bus broadcast (§4.3) invalidates every dyno's local thread cache immediately, instead of waiting out the 10-minute idle timeout. |
| Two dynos deploy simultaneously, both run `DataMigrator.migrateData()` on boot | Needs verification (§4.5) — wrap with the advisory-lock utility if the migration runner has no built-in locking. |
| User connects on dyno A, browser reconnects mid-session and lands on dyno B | New `socket.id` is issued on reconnect (socket.io default); the client's axios interceptor picks up the new id automatically. No special handling needed beyond the cluster-aware delivery already covering this. |

---

## 6. Out of scope

- Adding Redis or any new infra dependency — Postgres-only per decision in §3.
- Reworking record processing to be fully stateless (rejected in favor of the
  advisory-lock approach, which is a smaller, more contained change).
- Changing PM2 from fork mode to cluster mode inside a single dyno — scaling
  here is at the Heroku dyno level, not intra-dyno multi-core; that's a
  separate, independent concern not requested.
- Session/auth changes — already stateless, no work needed.
- `express-rate-limit`'s in-memory store — currently disabled by default
  (`RATE_LIMIT_ENABLED`); noted as a follow-up if it's ever turned on, not
  fixed in this pass.
- RStudio callback token map (`server/modules/analysis/service/rStudio/index.js`)
  — same class of bug (in-memory `tokenInfoByToken`), lower blast radius;
  noted as a follow-up, not required for this pass to ship.

---

## 7. Test plan

### Local multi-instance simulation

Run two instances of the built server on different ports against the same
Postgres DB, with a minimal round-robin proxy in front. Confirm:

1. Two browser sessions editing the same record see each other's node updates
   and validation state live, regardless of which instance each session's
   socket/REST calls land on.
2. A job started via one instance shows correct progress and final status
   when polled/streamed through the other instance.
3. Server logs show a scheduled job body executing on only one instance per
   tick (temporarily shorten a cron expression for the test).
4. A chunked upload succeeds when consecutive chunk requests are proxied to
   alternating instances.

### Staging on Heroku

Scale to 2+ dynos, repeat the same checks against real Heroku routing (no
artificial proxy needed — the router already load-balances without
affinity).

### Rollout gate

Only after both pass: enable Heroku's dyno autoscaling (Performance-tier
dynos) and monitor a scale-up event in production.
