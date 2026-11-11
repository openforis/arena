# Wire the Survey Import Stress Test into CI

## Purpose

`test/load/surveyImportStressTest.ts` (added per
`2026-08-10-survey-import-stress-test-design.md`) fires `--count` (default
50) concurrent `POST /api/survey/arena-import` requests, as `--count`
distinct throwaway users, at a running Arena server, and reports pass/fail.
It was deliberately left standalone: "not wired into `yarn test` / CI",
because at the time there was no sample survey zip to feed it and no
consideration of the login rate limiter.

This spec covers making it a real CI regression gate: generating a sample
survey zip fixture for it to import, running it in `.github/workflows/test.js.yml`
against the same server/DB the other tests already use, and neutralizing the
login rate limiter (which the tool's admin + 50 throwaway-user logins would
otherwise trip) for that CI run.

## Scope

1. A committed-as-code (not binary) sample survey zip fixture, generated at
   run time.
2. A new CI step in the existing `build` job of `test.js.yml`.
3. `RATE_LIMIT_ENABLED=false` for the CI server process.
4. `test/load/README.md` updated to reflect CI wiring.

Out of scope: changing `yarn test`'s default local behavior (unit + e2e);
changing the stress test tool's own CLI/behavior; any change to production
rate-limit defaults (`.env.template`, non-CI environments).

## 1. Sample survey zip fixture

### Format (confirmed against source, not assumed)

Single authoritative source for zip entry paths: `ExportFile`
(`server/modules/survey/service/surveyExport/exportFile.js`), read on import
by `ArenaSurveyFileZip` (`server/modules/arenaImport/service/arenaImport/model/arenaSurveyFileZip.js`).
`survey.json` is the only entry with no safe default (`arenaSurveyFileZip.js`'s
`getSurvey` has none; every other `get*` falls back to `{}`/`[]`/0 when the
entry is missing).

### `survey.json` contents (minimal, verified field-by-field against source)

```json
{
  "uuid": "<random-uuid>",
  "ownerUuid": "<random-uuid>",
  "draft": true,
  "published": false,
  "template": false,
  "authGroups": [
    {
      "name": "surveyAdmin",
      "permissions": [
        "permissionsEdit", "surveyEdit", "recordView", "recordCreate",
        "recordEdit", "recordCleanse", "recordAnalyse", "userEdit", "userInvite"
      ],
      "recordSteps": { "1": "all", "2": "all", "3": "all" }
    }
  ],
  "props": {
    "name": "stress_test_template",
    "languages": ["en"],
    "labels": { "en": "Stress Test Survey" }
  },
  "propsDraft": {},
  "nodeDefs": {
    "<rootUuid>": {
      "uuid": "<rootUuid>", "type": "entity", "parentUuid": null,
      "props": { "name": "root_entity", "labels": { "en": "Root entity" }, "cycles": ["0"] },
      "meta": { "h": [] }
    },
    "<idUuid>": {
      "uuid": "<idUuid>", "type": "integer", "parentUuid": "<rootUuid>",
      "props": { "name": "id", "labels": { "en": "Id" }, "key": true, "cycles": ["0"] },
      "meta": { "h": ["<rootUuid>"] }
    },
    "<notesUuid>": {
      "uuid": "<notesUuid>", "type": "text", "parentUuid": "<rootUuid>",
      "props": { "name": "notes", "labels": { "en": "Notes" }, "cycles": ["0"] },
      "meta": { "h": ["<rootUuid>"] }
    }
  },
  "categories": {},
  "taxonomies": {}
}
```

Field-by-field justification:

- **`authGroups`** — required. `SurveyCreatorJob` passes
  `Survey.getAuthGroups(surveyInfoArenaSurvey)` (=
  `R.propOr([], 'authGroups')` — an *explicit* empty-array default, which
  suppresses `SurveyManager.importSurvey`'s own `authGroups = Survey.getDefaultAuthGroups()`
  parameter default since that only applies to a literal `undefined`) into
  `SurveyManager.importSurvey`. Zero groups means `_addUserToSurveyAdmins`
  can't find a `surveyAdmin` group and the import fails. One group
  (`surveyAdmin`) is sufficient; permission strings copied from
  `core/auth/authGroup.ts` (`permissionsByGroupName.surveyAdmin`).
- **`props.languages`** — required, no default (`Survey.newSurvey`'s
  `languages` destructure has none); `getDefaultLanguage = R.head(getLanguages(...))`
  is relied on downstream.
- **`props.srs` and `props.cycles` are deliberately omitted.**
  `SurveyCreatorJob` spreads `surveyInfoArenaSurvey.props` (merged with
  `propsDraft`) as `...rest` into `Survey.newSurvey(...)`
  (`core/survey/survey.js:37-59`). `newSurvey`'s own defaults —
  `srs && srs.length > 0 ? srs : [WGS84 default]` and
  `cycles: { "0": SurveyCycle.newCycle() }` (overwritten by `...rest.cycles`
  only if that key is *present*) — only kick in when the key is absent from
  props entirely, which it is here. Omitting them means the resulting cycle
  key is always exactly `"0"` (`SurveyInfo.cycleOneKey`), matching what the
  node defs reference in `props.cycles: ["0"]`.
- **NodeDef `props.cycles`** — not read anywhere in the import path itself
  (verified: no reference in `nodeDefRepository.insertNodeDefsBatch` or
  `NodeDefsImportJob`), included anyway for realism/forward-safety at
  negligible cost.
- **NodeDef `meta.h`** — ancestor-uuid chain, not read by the import
  repository either, but cheap and correct to set (`newNodeDef` in
  `core/survey/nodeDef.js:502-527` builds it the same way).
- **Everything else** (`categories/categories.json`, `taxonomies/taxonomies.json`,
  `chains/chains.json`, `users/*.json`, `info.json`) — confirmed optional via
  `ArenaSurveyFileZip`'s `_getJson(zipFile, path, defaultValue)` helper,
  which returns the given default when the entry is absent. Omitted from the
  fixture entirely rather than writing empty placeholders, since the code
  already tolerates their absence and this keeps the builder shorter.

### Runtime behavior specific to this endpoint (why draft-only is correct here)

`arenaImportApi.js` calls `ArenaImportService.startArenaImportJob` without
an explicit `backup` param, and the stress test's multipart `survey` field
sends `options: { includeData: false }`
(`test/load/lib/httpApi.ts:buildImportFormData`). `ArenaImportJob`'s
`transformParams` computes `backup = backupParam(default true) && includeData`,
so **`backup` evaluates to `false`** for every request this tool makes —
contrary to the earlier stress-test design doc's assumption that the
endpoint always treats requests as a full backup restore. Consequences,
traced through `core/objectUtils.ts:getPropsAndPropsDraft` and
`core/survey/nodeDef.js:getAllPropsAndAllPropsDraft`:

- `UsersImportJob`, `ActivityLogImportJob`, `RecordsImportJob`,
  `FilesImportJob` are all skipped (each gated on `backup` or
  `backup && includeData` in `arenaImportJob.js`'s `createInnerJobs`).
- Survey/node-def content lands entirely in `props_draft` (`props: {}`,
  `propsDraft: {...props, ...propsDraft}`) — i.e. the imported survey is a
  normal **draft** survey. This is expected and fine; it does not exercise
  publish/RDB-creation code (`CreateRdbJob.shouldExecute()` no-ops for an
  unpublished, non-Collect survey), which keeps the fixture and the import
  itself simpler.
- The survey's final *name* is unaffected by any of this: `arenaImportApi.js`
  builds `surveyInfoTarget = Survey.newSurvey({ ownerUuid, name })` directly
  from the per-request multipart `survey.name` field
  (`stress_test_<runId>_<i>`, already unique per request), and
  `SurveyCreatorJob` prefers `Survey.getName(surveyInfoTarget)` over the
  zip's own `props.name` whenever it's present. The zip's `props.name` is
  just a fallback, never actually used by this tool.

### Concurrency safety of reusing one zip 50 times

`node_def` (and `record`, `category`, etc.) live in a **per-survey Postgres
schema** (`survey_<id>`, created by `DBMigrator.migrateSurveySchema`,
confirmed via the `public` vs `survey` split in
`arena-server/src/db/dbMigrator/migration/`), not a shared table keyed
globally by uuid. Reusing byte-identical node-def/category/taxonomy UUIDs
across 50 concurrent imports of the same zip is therefore safe — each import
gets its own isolated schema. The survey's own top-level `uuid` is
regenerated unconditionally by `Survey.newSurvey()` (`uuidv4()`) regardless
of what's in the zip, so that never collides either.

### Implementation

- `test/load/lib/sampleSurveyZip.ts` — exports
  `buildSampleSurveyZipBuffer(): Buffer`, assembling the structure above with
  `adm-zip` (already a dependency; synchronous, simple in-memory API — no
  need for the `archiver` streaming API the real export job uses). UUIDs via
  `crypto.randomUUID()` (matches `lib/userProvisioning.ts`'s existing
  convention; no new dependency on the `uuid` package for this file).
- `test/load/lib/sampleSurveyZip.test.ts` — unit tests: the buffer is a
  valid zip (round-trips through `adm-zip`'s reader), contains exactly the
  expected entries, `survey.json` parses and has the required shape
  (`authGroups` non-empty, `languages` non-empty, three node defs with the
  expected `type`/`parentUuid` relationships).
- `test/load/buildSampleSurveyZip.ts` — top-level CLI, same style as
  `surveyImportStressTest.ts` (`import.meta.main` entry guard): writes
  `buildSampleSurveyZipBuffer()` to a path given as `process.argv[2]`
  (default `./sample-survey.zip` if omitted).
- `package.json`: new script
  `"test:load:build-fixture": "node --experimental-strip-types test/load/buildSampleSurveyZip.ts"`.

## 2. CI wiring (`.github/workflows/test.js.yml`)

Two changes to the existing `build` job, no new job/service (reuses the
already-built `dist/`, already-running server on `:9090`, already-running
Postgres):

1. **"Run server" step** — add `RATE_LIMIT_ENABLED: false` to its `env:`
   block. This is the only place server env is configured in this workflow.
   Scoped to this CI server process only; does not touch `.env.template` or
   any other environment. Confirmed safe: `RATE_LIMIT_ENABLED` only gates
   `express-rate-limit` on `/auth/login`, `/auth/loginTemp`,
   `/auth/tokenRefresh` (`node_modules/@openforis/arena-server/dist/server/middleware/rateLimit.js`),
   and no test in `test/e2e`, `test/integration`, or `test/unit` asserts on
   429/rate-limit responses (grepped for `429`, `rateLimit`, `Too many
   requests`, `RATE_LIMIT` across `test/` — only hits are the stress test's
   own client-side retry logic in `test/load/lib/httpApi.ts`, which becomes
   inert but harmless once the limiter is off).
2. **New step**, after the existing "Run tests" step:
   ```yaml
   - name: Build sample survey zip for stress test
     run: yarn test:load:build-fixture /tmp/sample-survey.zip
   - name: Run survey import stress test
     run: node --experimental-strip-types test/load/surveyImportStressTest.ts --zip /tmp/sample-survey.zip
     env:
       ADMIN_EMAIL: ${{secrets.ADMIN_EMAIL}}
       ADMIN_PASSWORD: ${{secrets.ADMIN_PASSWORD}}
   ```
   No `--url` needed (`ARENA_URL` defaults to `http://localhost:9090`,
   matching the already-running server). No `--count` override — the tool's
   existing default (50) already matches "50 survey imports at the same
   time". `ADMIN_EMAIL`/`ADMIN_PASSWORD` are the same secrets the "Run
   server" step already uses to provision the bootstrap admin account, so
   the stress test logs in as that same admin to provision its 50 throwaway
   users. Exit code non-zero fails the job (already built into the tool's
   `main()`).

Throwaway user accounts (documented in `test/load/README.md` as a permanent,
undeletable side effect for local runs) are a non-issue in CI: the Postgres
service container is destroyed at the end of every workflow run.

## 3. `test/load/README.md` updates

- Remove "It is not wired into `yarn test` / CI."; replace with a note that
  it runs as a CI step in `test.js.yml` (after the main test suite, against
  the same server) using a fixture built by `test/load/buildSampleSurveyZip.ts`,
  with `RATE_LIMIT_ENABLED=false` for that job.
- Note that the "throwaway accounts accumulate forever" caveat doesn't apply
  to CI (fresh DB per run) — it's a local-dev-only concern.

## Verification plan

Before wiring the new step into `test.js.yml`, validate locally against a
real server (not just static source tracing, since that already caught one
wrong assumption in the original design doc):

1. `yarn build:server:dev` (or existing local dev workflow) against a local
   Postgres, `ADMIN_EMAIL`/`ADMIN_PASSWORD` set.
2. `yarn test:load:build-fixture /tmp/sample-survey.zip`, inspect the zip
   manually (`unzip -l`, `unzip -p ... survey.json | jq`) once.
3. `node --experimental-strip-types test/load/surveyImportStressTest.ts --zip /tmp/sample-survey.zip --count 3` —
   confirm all 3 succeed, inspect one resulting survey in the Designer UI
   (root entity + 2 attributes, as a draft).
4. Re-run at `--count 50` (the real default) to confirm nothing breaks at
   full concurrency and the run completes in a reasonable time.
5. Only then add the CI step and env change, and confirm on a real PR run.

## Non-goals

- Not folding `test:load` into the `yarn test` aggregate script — it stays a
  CI-only step, not part of every local `yarn test` run.
- Not changing default rate-limit values for non-CI environments.
- No new npm dependencies (`adm-zip` is already present).
