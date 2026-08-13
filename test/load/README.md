# Survey Import Stress Test

A standalone, manually-run Node CLI that fires concurrent
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
already uses — with `RATE_LIMIT_ENABLED=false` for that CI server process
(the login rate limiter would otherwise throttle the burst of throwaway-user
logins this tool performs; see
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

## Limitations

**This is a burst-request test, not a true-concurrency test.**
`server/job/JobQueue.js` serializes survey-creation/import jobs globally, one
at a time, regardless of `--count`. All `--count` requests are still fired
simultaneously (which is what reproduces the pool-exhaustion bug class this
tool targets), but the server processes the resulting jobs one after
another. Expect run times to scale roughly linearly with `--count`, and
`timed-out` outcomes if `--job-timeout` is too low for a large `--count`.

**Throwaway user accounts are permanent.** Each run provisions `--count`
new user accounts (`stress_test_<runId>_<i>@loadtest.local`, granted
`surveyManager` privileges, random per-run password) to import through, one
account per request, so the burst isn't serialized by the server's
one-job-per-user rule. There is no API to delete a user account, so these
accumulate in the database across runs. Created *surveys* are cleaned up
automatically after each run (unless `--keep` is passed); user accounts are
not.

This doesn't apply to the CI run: the Postgres service container backing
each `test.js.yml` job is destroyed at the end of the run, so leftover
`stress_test_*@loadtest.local` rows never persist.

To remove them manually, run against the Arena database:

```sql
DELETE FROM "user" WHERE email LIKE 'stress_test_%@loadtest.local';
```

Their `auth_group_user` rows are removed automatically by this — the FK has
`ON DELETE CASCADE` on the `user` table (see
`20181130124534-create-auth-tables-up.sql` in `@openforis/arena-server`) —
but double-check that's still the case if you're running against an older
schema version, and delete the matching `auth_group_user` rows by hand if
not.
