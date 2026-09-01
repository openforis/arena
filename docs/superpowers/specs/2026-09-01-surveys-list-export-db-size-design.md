# Surveys list export: add DB schema size columns

Date: 2026-09-01

## Problem

`SurveysListExportJob` (`server/modules/survey/service/SurveysListExportJob.js`) exports one row
per survey with counts (records, files, chains, node defs, etc.) via
`SurveyManager.fetchUserSurveysInfo`. It has no visibility into how much Postgres storage each
survey actually occupies — only file storage (`filesSize`) is exported. There's no way to see, per
survey, the size of its main schema (`survey_<id>`) or its RDB/data schema (`survey_<id>_data`)
without querying Postgres manually.

The building blocks for this already exist and are used for the single-survey storage dashboard
(`surveyService.fetchAndAssocStorageInfo`, `server/modules/survey/service/surveyService.js:36-48`):

- `DbUtils.fetchSchemaTablesSize({ schema })` (`server/db/dbUtils.js:221`) — sums
  `pg_relation_size` across all tables in a schema, returns bytes as a `Number`. Returns `0` (not an
  error) if the schema doesn't exist.
- `Schemata.getSchemaSurvey(surveyId)` / `Schemata.getSchemaSurveyRdb(surveyId)` (from
  `@openforis/arena-server`) — give the two schema names (`survey_<id>` and `survey_<id>_data`).

## Goal

Add two columns to the surveys list export — `dbSize` (main schema) and `dbDataSize` (RDB/data
schema) — reusing the existing size-calculation utilities, **without** slowing down any other
caller of `fetchUserSurveysInfo` (e.g. the survey list UI), since these queries scan Postgres
catalog data per survey and are only worth paying for in an export/reporting context.

## Design

### `SurveyManager.fetchUserSurveysInfo` / `_fetchSurveysWithCounts` / `_fetchSurveyWithCounts`

(`server/modules/survey/manager/surveyManager.js`)

- `fetchUserSurveysInfo` gains a new parameter `includeDbSize = false`, passed through
  `_fetchSurveysWithCounts` to `_fetchSurveyWithCounts` alongside the existing `draft` parameter.
- Inside `_fetchSurveyWithCounts`'s existing `try` block (the same block that already computes
  `filesCount`, `filesSize`, `recordsCount`, etc.), when `includeDbSize` is `true`, add:
  ```js
  dbSize: await DbUtils.fetchSchemaTablesSize({ schema: Schemata.getSchemaSurvey(surveyId) }),
  dbDataSize: await DbUtils.fetchSchemaTablesSize({ schema: Schemata.getSchemaSurveyRdb(surveyId) }),
  ```
- When `includeDbSize` is `false` (the default, used by every existing caller), no extra queries
  run and `dbSize`/`dbDataSize` are absent from the result — identical behavior to today.
- Failures fall inside the existing `catch` (logs and continues), same as the other per-survey
  counts — one survey's size-query failure doesn't abort the whole batch.
- New imports needed in `surveyManager.js`: `import * as DbUtils from '@server/db/dbUtils'`, and
  add `Schemata` to the existing `import { DBMigrator } from '@openforis/arena-server'` line.

### `SurveysListExportJob`

(`server/modules/survey/service/SurveysListExportJob.js`)

- Passes `includeDbSize: true` to `SurveyManager.fetchUserSurveysInfo` (alongside the existing
  `includeCounts: true`).
- Adds `'dbSize'` and `'dbDataSize'` to the `fields` array, placed next to `filesSize`.
- No changes to `objectTransformer` — these are plain numeric byte counts, exported as-is (same
  treatment as `filesSize` today, which is also raw bytes with no human-readable formatting in the
  export).

### Other callers

No other caller of `fetchUserSurveysInfo` passes `includeDbSize`, so it defaults to `false`
everywhere else (survey list UI, etc.) — zero behavior or performance change outside the export
job.

## Out of scope

- Human-readable size formatting in the export (e.g. "1.2 GB") — exported as raw byte counts,
  consistent with the existing `filesSize` column.
- Any change to the single-survey storage dashboard (`fetchAndAssocStorageInfo`) — it already does
  its own thing and isn't touched by this change.
- Caching or parallelizing the per-survey size queries — same sequential-loop cost profile as the
  existing counts in `_fetchSurveyWithCounts`.

## Testing

`test/integration/tests/_survey/surveyTest.js` has an integration test
(`fetchUserSurveysInfoDbSizeTest`) covering `SurveyManager.fetchUserSurveysInfo`'s
`includeDbSize` option against a real Postgres DB: it asserts `dbSize` and `dbDataSize`
are present and numeric when `includeDbSize: true`, that `dbDataSize` is `0` for a
draft/unpublished survey (RDB schema not yet created), and that both fields are absent
when `includeDbSize` is omitted.

Manual verification of the actual export file (running the surveys list export end-to-end
and opening the output) is still recommended before merge, since no automated test covers
`SurveysListExportJob`'s file-writing path itself.
