# Job Monitor — Design Spec

Date: 2026-08-24
Repos affected: `arena` (this repo, branch `feat/job-monitor`) and `arena-server` (sibling repo, branch `feat/auto-scaling`, unreleased)

## Problem

Arena's background job system persists job rows to a shared `job` table (introduced on the
`feat/auto-scaling` branch of `arena-server`, not yet released) so any dyno in a cluster can poll
a job's status. There is currently no way for an operator to see, in one place, everything running
or recently run across the whole server — only a per-user "current job" modal exists in the webapp.

Separately, `job.survey_id` is `NOT NULL`, which means "global" jobs (not tied to a survey) are
never persisted at all — `JobQueue.enqueue()` in the main repo explicitly skips the DB insert for
them. This is called out in the existing code comments as a known gap in the cluster-wide
one-job-per-user/survey conflict check, not just a monitoring blind spot.

## Goals

- A new admin-only screen listing all jobs (active + recent history) running on the server:
  type, completion percent, the user who started it, and an estimated completion time (where
  computable), at minimum.
- `job.survey_id` becomes nullable, and global jobs start being persisted like survey-scoped ones,
  closing the existing conflict-detection gap as a side effect.
- Auto-refreshes every 10 seconds; a manual "Refresh" button allows refreshing sooner.
- Restricted to system administrators only, both client- and server-side.
- Uses `webapp/components/DataGrid` for the table, per existing conventions in the codebase (e.g.
  `UserGroupsList`, `JobErrors`).

## Non-goals

- No per-job actions from this screen (cancel, retry, delete). The existing per-user "cancel
  active job" flow (`DELETE /jobs/active`) is untouched.
- No pagination UI or configurable time range — the query is capped at a fixed row limit (200),
  ordered by most recent first. Nothing currently purges finished job rows from the table; if this
  ever becomes a real volume problem, retention/pagination can be added later.
- No translations beyond English for the new UI strings in this pass (matches how other admin-only
  screens like Messages have been introduced incrementally).

## arena-server changes (branch `feat/auto-scaling`, edited in place — this version is unreleased)

1. `src/db/dbMigrator/migration/public/migrations/sqls/20260819100000-create-table-job-up.sql`:
   drop `NOT NULL` from `survey_id`. FK (`job_survey_fk`) and index are unaffected — a nullable FK
   column simply isn't checked when null.
2. `src/repository/job/utils.ts`: `JobRow.surveyId` type becomes `number | null`.
3. `src/repository/job/insert.ts`: `surveyId` parameter becomes optional; when absent, the column
   is written as `NULL` explicitly (pg-promise named params require the key to be present).
4. Existing tests in `src/repository/job/tests` / `src/job/tests` that assume `surveyId` is always
   a number get updated for the nullable case.

No other arena-server changes — the join query for the monitor (job + user + survey) is written
directly in the main repo, following the precedent already set by
`server/system/schedulers/staleJobsCleanup.js`, which queries the `job` table directly with raw SQL
from the main app's own DB connection rather than going through `JobRepository`.

## Main repo (`arena`) — server changes

1. `server/job/JobQueue.ts`: remove the `if (surveyId)` guard that currently skips
   `JobRepository.insert(...)` for global jobs — every job is now persisted regardless of whether
   it's survey-scoped. Update the surrounding comments that describe the old NOT-NULL limitation
   (in `enqueue()` and the comment inside `_hasActiveJobElsewhere`'s docblock referencing it).
2. New `server/job/jobRepository.js` — one function, `getAll({ limit = 200 })`, running:
   ```sql
   SELECT j.uuid, j.type, j.status, j.processed, j.total, j.props,
          j.date_created, j.date_modified, j.user_uuid, j.survey_id,
          u.name AS user_name, u.email AS user_email,
          COALESCE(s.props->>'name', s.props_draft->>'name') AS survey_name
   FROM job j
   LEFT JOIN "user" u ON u.uuid = j.user_uuid
   LEFT JOIN survey s ON s.id = j.survey_id
   ORDER BY j.date_created DESC
   LIMIT $1
   ```
   via `@server/db/db` (`db.map(...)`), mapping snake_case columns to a camelCase row shape
   (`{ uuid, type, status, processed, total, props, dateCreated, dateModified, userUuid, userName,
   userEmail, surveyId, surveyName }`).
3. `server/job/jobUtils.js`: new `jobRowToMonitorSummary(row)` — calls the existing
   `jobRowToSummary(row)` (unchanged, still used by the per-user modal path) and merges in
   `dateCreated`, `userName`, `userEmail`, `surveyName`.
4. `server/job/jobManager.js`: new `getAllJobsSummary()` — calls `jobRepository.getAll()` and maps
   each row through `jobRowToMonitorSummary`.
5. `server/job/jobApi.js`: new route `GET /jobs`, gated with
   `ApiAuthMiddleware.requireAdminPermission` (imported from `@openforis/arena-server`, same
   middleware already gating the Messages module's API — resolves to `Users.isSystemAdmin`).
   Returns the array from `JobManager.getAllJobsSummary()` as JSON.

## Main repo (`arena`) — webapp changes

Mirrors the existing **Messages** module, the only other system-admin-only top-level module in the
app, end to end:

1. `webapp/app/appModules.js`: new top-level module `appModules.jobs` (key `jobMonitor`, path
   `jobMonitor`, icon `cogs` — available in `webapp/style/ico.scss` and not used by any other
   top-level module). Added to the `_getModuleParentPathParts` module-group table alongside
   `messages`.
2. `webapp/views/App/SideBar/Modules/utils.js`:
   - `isSurveySelectionRequired`: add `appModules.jobs.key` to the exclusion list (alongside
     `home`/`help`) — jobs span all surveys, so selecting a survey shouldn't be required to view
     it.
   - `getModulesHierarchy`: add the module block gated on `User.isSystemAdmin(user)`, next to the
     existing `messages` block.
3. `webapp/views/App/AppView.js`: lazy-load the new module component; register its route only when
   `useUserIsSystemAdmin()` is true (existing hook in `webapp/store/user/hooks.js`, same one backing
   `useAuthCanUseMessages`).
4. New `webapp/views/App/views/JobsMonitor/` (named distinctly from the existing
   `webapp/views/App/JobMonitor/` per-user modal, to avoid confusion):
   - `JobsMonitor.js` — page component rendering `DataGrid` with the columns below.
   - `useJobsMonitor.js` — fetches via the new API call, re-fetches every 10s via the existing
     `webapp/components/hooks/useInterval` hook, and exposes a `refresh()` callback for the manual
     button (which does an immediate fetch and doesn't reset the 10s timer).
   - `useJobsMonitorColumns.js` — `GridColDef[]` for the table (see Columns below).
5. `webapp/service/api/job/index.js`: add `fetchAllJobs()` → `GET /api/jobs`. Exported from
   `webapp/service/api/index.js` alongside `fetchActiveJob`.
6. Refresh button: existing `Button` component with `iconClassName="icon-loop2"` and
   `label="common.refresh"` (same combination already used for the QR-login refresh button).

### Columns

| Column | Source |
|---|---|
| Type | `i18n.t(\`jobs:${type}\`)` — reuses the ~90 existing job-type translations |
| Status | new i18n keys (pending/running/succeeded/failed/canceled) |
| Survey | `surveyName`, rendered as `—` for global jobs |
| User | `userName`, falling back to `userEmail` |
| Progress | `${progressPercent}%` (already computed by `jobRowToSummary`) |
| Elapsed | `formatDuration(elapsedMillis)`, reusing the helper at `webapp/views/App/JobMonitor/JobTiming/formatDuration.js` |
| Est. remaining | `formatDuration(JobSerialized.getRemainingMillis(job))`, `—` when null (0% progress or already ended) — reuses the existing estimation logic in `common/job/jobSerialized.js`, unchanged |
| Started At | `DateUtils.convertDateTimeFromISOToDisplay(dateCreated)`, same formatter `MessageList` uses |

## i18n

New `jobMonitorView` resource under `core/i18n/resources/en/index.js` for the page title and the
five status labels. English only for this pass.

## Testing

- arena-server: existing job repository/queue unit tests updated for nullable `surveyId`; still
  cover insert/getActive/updateStatus paths.
- arena main repo: unit test for `jobRowToMonitorSummary` (join-field passthrough) and for the new
  `getAll` query shape if the existing job repository tests provide a harness to extend; otherwise
  covered via integration test against a real DB (following the pattern of other repository tests
  in `test/integration/`).
- Manual verification: log in as a system admin, confirm the module is visible and the API route
  rejects non-admins with 401; trigger a job (e.g. category import) and confirm it appears in the
  grid with live progress, then confirm auto-refresh and the manual refresh button both work.
