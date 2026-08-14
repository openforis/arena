# Survey Import Stress Test

A Node CLI that fires concurrent
`POST /api/survey/arena-import` requests at a running Arena server. It exists
to validate two DB connection-pool / lock fixes made on the
`fix/survey-import-concurrency` branch (survey creation and import used to
hold a DB transaction open while acquiring another connection from the same
pool, which could exhaust the pool under concurrent load). Existing
integration coverage exercises `SurveyManager` directly, in-process, with
only 2 concurrent calls; this tool drives the real HTTP API — JWT auth,
multipart upload, the background job queue — at a higher, configurable
concurrency, using a real Arena survey export zip as the import source.

It runs as a CI step in `.github/workflows/test.js.yml`, after the main
test suite, against the same server and database the rest of the suite
already uses. That CI server process explicitly sets
`RATE_LIMIT_ENABLED=false` — the login rate limiter is already off there by
default (no `.env` exists on the runner and the setting has no
default-true fallback), but pinning it explicitly avoids relying on that
default, and more importantly avoids the client-side login-retry backoff
(see `test/load/lib/httpApi.ts`) that would otherwise slow the run down
whenever a stricter local `.env` is in play (see
`docs/superpowers/specs/2026-08-13-survey-stress-test-ci-design.md`). The
sample survey zip it imports is generated at run time by
`test/load/buildSampleSurveyZip.ts` (`yarn test:load:build-fixture`) rather
than committed as a binary file.

It's still usable standalone for local dev against any running server (see
Usage below).

## Usage

```bash
node test/load/surveyImportStressTest.ts --zip path/to/survey.zip --count 20
```

Requires a running Arena server and a system-admin login (`--email`/
`--password`, or `ARENA_EMAIL`/`ARENA_PASSWORD` — or `ADMIN_EMAIL`/
`ADMIN_PASSWORD` from `.env` — as fallbacks). See `--help` for the full flag
list.

Each run provisions `--count` new user accounts
(`stress_test_<runId>_<i>@loadtest.local`, granted `surveyManager`
privileges, random per-run password) to import through, one account per
request, so the burst isn't serialized by the server's one-job-per-user
rule. Both the surveys and the user accounts created by a run are deleted
afterward (unless `--keep` is passed), via `DELETE /api/survey/:id` and
`DELETE /api/user/:userUuid` respectively.

## Limitations

**This is a burst-request test, not a true-concurrency test.**
`server/job/JobQueue.js` serializes survey-creation/import jobs globally, one
at a time, regardless of `--count`. All `--count` requests are still fired
simultaneously (which is what reproduces the pool-exhaustion bug class this
tool targets), but the server processes the resulting jobs one after
another. Expect run times to scale roughly linearly with `--count`, and
`timed-out` outcomes if `--job-timeout` is too low for a large `--count`.

**A user whose survey failed to clean up earlier in the same run will also
fail to delete** — the server blocks deleting a user who still owns a
survey — and that's logged as a per-user cleanup failure, not swallowed,
since it's a signal the survey cleanup didn't fully succeed.
