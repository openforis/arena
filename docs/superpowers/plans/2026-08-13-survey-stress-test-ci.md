# Wire Survey Import Stress Test into CI — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `test/load/surveyImportStressTest.ts` run as a real CI gate in `.github/workflows/test.js.yml`, importing a freshly-generated minimal sample survey zip 50 times concurrently, with the server's login rate limiter disabled for that CI run.

**Architecture:** A new `test/load/lib/sampleSurveyZip.ts` module builds a minimal, spec-valid Arena survey export zip (`adm-zip`, in memory, no binary committed to git). A new top-level CLI `test/load/buildSampleSurveyZip.ts` writes that buffer to a path on disk, exposed as `yarn test:load:build-fixture`. Two changes to the existing `build` job in `test.js.yml` wire it in: `RATE_LIMIT_ENABLED: false` on the already-existing "Run server" step, and two new steps after "Run tests" that build the fixture and run the stress test against the already-running server.

**Tech Stack:** Node 24 (`--experimental-strip-types`, no build step), TypeScript (loose/unchecked — `tsc --noEmit` not part of this repo's CI), `adm-zip` (already a dependency), `node:test` + `node:assert/strict` for unit tests, GitHub Actions.

## Global Constraints

- No new npm dependencies (`adm-zip` is already present in `package.json`).
- Do not modify `yarn test`'s (`test:unit` + `test:e2e`) default local behavior — the stress test stays a CI-only step, not folded into the `test` aggregate script.
- Do not change rate-limit defaults for non-CI environments (`.env.template` untouched).
- `RATE_LIMIT_ENABLED: false` goes only on the CI server process env in `test.js.yml`.
- New `.ts` files follow the existing `test/load/lib/*.ts` conventions: named exports, one JSDoc block per exported function (required project-wide per `CLAUDE.md`: description ending in a period, `@param`/`@returns` with types), `node:test`/`node:assert/strict` for tests, no new runtime dependencies.
- Full field-by-field justification for every value in the generated `survey.json` is in `docs/superpowers/specs/2026-08-13-survey-stress-test-ci-design.md` — consult it if a step here seems under-explained.

---

### Task 1: Sample survey zip builder module

**Files:**
- Create: `test/load/lib/sampleSurveyZip.ts`
- Test: `test/load/lib/sampleSurveyZip.test.ts`

**Interfaces:**
- Consumes: nothing from other tasks (this is the first task).
- Produces (relied on by Task 2):
  - `export interface SampleSurveyUuids { surveyUuid: string; ownerUuid: string; rootEntityUuid: string; idAttributeUuid: string; notesAttributeUuid: string }`
  - `export const generateSampleSurveyUuids = (): SampleSurveyUuids => ...`
  - `export const buildSampleSurveyZipBuffer = (uuids: SampleSurveyUuids = generateSampleSurveyUuids()): Buffer => ...`

- [ ] **Step 1: Write the failing tests**

Create `test/load/lib/sampleSurveyZip.test.ts`:

```ts
import test from 'node:test'
import assert from 'node:assert/strict'
import AdmZip from 'adm-zip'

import { buildSampleSurveyZipBuffer, generateSampleSurveyUuids, type SampleSurveyUuids } from './sampleSurveyZip.ts'

const fixedUuids: SampleSurveyUuids = {
  surveyUuid: '11111111-1111-1111-1111-111111111111',
  ownerUuid: '22222222-2222-2222-2222-222222222222',
  rootEntityUuid: '33333333-3333-3333-3333-333333333333',
  idAttributeUuid: '44444444-4444-4444-4444-444444444444',
  notesAttributeUuid: '55555555-5555-5555-5555-555555555555',
}

const readEntries = (buffer: Buffer): AdmZip => new AdmZip(buffer)

test('buildSampleSurveyZipBuffer produces a valid zip with the expected entries', () => {
  const buffer = buildSampleSurveyZipBuffer(fixedUuids)
  const zip = readEntries(buffer)
  const entryNames = zip.getEntries().map((entry) => entry.entryName)

  assert.deepEqual(
    [...entryNames].sort(),
    ['categories/categories.json', 'survey.json', 'taxonomies/taxonomies.json']
  )
})

test('survey.json has a non-empty authGroups with a surveyAdmin group', () => {
  const buffer = buildSampleSurveyZipBuffer(fixedUuids)
  const survey = JSON.parse(readEntries(buffer).readAsText('survey.json'))

  assert.ok(Array.isArray(survey.authGroups))
  assert.ok(survey.authGroups.length > 0)
  assert.ok(survey.authGroups.some((group: { name: string }) => group.name === 'surveyAdmin'))
})

test('survey.json has one non-empty language and no srs/cycles overrides', () => {
  const buffer = buildSampleSurveyZipBuffer(fixedUuids)
  const survey = JSON.parse(readEntries(buffer).readAsText('survey.json'))

  assert.deepEqual(survey.props.languages, ['en'])
  assert.equal(survey.props.srs, undefined)
  assert.equal(survey.props.cycles, undefined)
})

test('survey.json nodeDefs describe one root entity with two child attributes, one of them a key', () => {
  const buffer = buildSampleSurveyZipBuffer(fixedUuids)
  const survey = JSON.parse(readEntries(buffer).readAsText('survey.json'))
  const nodeDefs = Object.values(survey.nodeDefs) as Array<{
    uuid: string
    type: string
    parentUuid: string | null
    props: { name: string; key?: boolean }
  }>

  assert.equal(nodeDefs.length, 3)

  const root = nodeDefs.find((nodeDef) => nodeDef.uuid === fixedUuids.rootEntityUuid)
  assert.equal(root?.type, 'entity')
  assert.equal(root?.parentUuid, null)

  const idAttribute = nodeDefs.find((nodeDef) => nodeDef.uuid === fixedUuids.idAttributeUuid)
  assert.equal(idAttribute?.type, 'integer')
  assert.equal(idAttribute?.parentUuid, fixedUuids.rootEntityUuid)
  assert.equal(idAttribute?.props.key, true)

  const notesAttribute = nodeDefs.find((nodeDef) => nodeDef.uuid === fixedUuids.notesAttributeUuid)
  assert.equal(notesAttribute?.type, 'text')
  assert.equal(notesAttribute?.parentUuid, fixedUuids.rootEntityUuid)
})

test('categories.json and taxonomies.json are empty but present', () => {
  const buffer = buildSampleSurveyZipBuffer(fixedUuids)
  const zip = readEntries(buffer)

  assert.equal(zip.readAsText('categories/categories.json'), '{}')
  assert.equal(zip.readAsText('taxonomies/taxonomies.json'), '[]')
})

test('generateSampleSurveyUuids returns a fresh, distinct set on every call', () => {
  const first = generateSampleSurveyUuids()
  const second = generateSampleSurveyUuids()

  assert.notEqual(first.surveyUuid, second.surveyUuid)
  assert.notEqual(first.rootEntityUuid, second.rootEntityUuid)
})

test('buildSampleSurveyZipBuffer called with no arguments still produces a valid, parseable zip', () => {
  const buffer = buildSampleSurveyZipBuffer()
  const survey = JSON.parse(readEntries(buffer).readAsText('survey.json'))

  assert.ok(survey.uuid)
  assert.equal(Object.keys(survey.nodeDefs).length, 3)
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --experimental-strip-types --test test/load/lib/sampleSurveyZip.test.ts`
Expected: FAIL — `Cannot find module './sampleSurveyZip.ts'` (the module doesn't exist yet).

- [ ] **Step 3: Implement `test/load/lib/sampleSurveyZip.ts`**

```ts
import crypto from 'node:crypto'

import AdmZip from 'adm-zip'

export interface SampleSurveyUuids {
  surveyUuid: string
  ownerUuid: string
  rootEntityUuid: string
  idAttributeUuid: string
  notesAttributeUuid: string
}

// Minimal set of permissions/steps for a single surveyAdmin auth group, copied from
// core/auth/authGroup.ts (permissionsByGroupName.surveyAdmin) rather than imported: files in
// test/load run standalone via `node --experimental-strip-types` with no path-alias resolution
// for @core/*, matching every other file in this directory (see test/load/lib/config.ts etc.).
// A survey.json with zero authGroups fails import: SurveyCreatorJob passes
// Survey.getAuthGroups(...) (an explicit R.propOr([], 'authGroups') default) straight into
// SurveyManager.importSurvey, which only falls back to its own default authGroups when the
// argument is literally undefined -- an explicit [] suppresses that fallback, leaving no
// surveyAdmin group for _addUserToSurveyAdmins to add the importing user to.
const SAMPLE_SURVEY_AUTH_GROUPS = [
  {
    name: 'surveyAdmin',
    permissions: [
      'permissionsEdit',
      'surveyEdit',
      'recordView',
      'recordCreate',
      'recordEdit',
      'recordCleanse',
      'recordAnalyse',
      'userEdit',
      'userInvite',
    ],
    recordSteps: { '1': 'all', '2': 'all', '3': 'all' },
  },
]

/**
 * Builds the survey.json content for a minimal, valid Arena survey export: one root entity with
 * an integer key attribute and a text attribute, one language, and one authGroups entry. `srs`
 * and `cycles` are deliberately omitted from `props` so the server fills in its own defaults
 * (core/survey/survey.js `newSurvey`) instead of this fixture having to replicate them exactly.
 * @param uuids - UUIDs to embed for the survey and its node defs.
 * @returns The survey.json object, ready to JSON.stringify.
 */
const buildSurveyJson = (uuids: SampleSurveyUuids): Record<string, unknown> => {
  const { surveyUuid, ownerUuid, rootEntityUuid, idAttributeUuid, notesAttributeUuid } = uuids
  return {
    uuid: surveyUuid,
    ownerUuid,
    draft: true,
    published: false,
    template: false,
    authGroups: SAMPLE_SURVEY_AUTH_GROUPS,
    props: {
      name: 'stress_test_template',
      languages: ['en'],
      labels: { en: 'Stress Test Survey' },
    },
    propsDraft: {},
    nodeDefs: {
      [rootEntityUuid]: {
        uuid: rootEntityUuid,
        type: 'entity',
        parentUuid: null,
        props: { name: 'root_entity', labels: { en: 'Root entity' }, cycles: ['0'] },
        meta: { h: [] },
      },
      [idAttributeUuid]: {
        uuid: idAttributeUuid,
        type: 'integer',
        parentUuid: rootEntityUuid,
        props: { name: 'id', labels: { en: 'Id' }, key: true, cycles: ['0'] },
        meta: { h: [rootEntityUuid] },
      },
      [notesAttributeUuid]: {
        uuid: notesAttributeUuid,
        type: 'text',
        parentUuid: rootEntityUuid,
        props: { name: 'notes', labels: { en: 'Notes' }, cycles: ['0'] },
        meta: { h: [rootEntityUuid] },
      },
    },
    categories: {},
    taxonomies: {},
  }
}

/**
 * Generates a fresh set of UUIDs for one sample survey zip build.
 * @returns A new, distinct UUID for the survey and each of its node defs.
 */
export const generateSampleSurveyUuids = (): SampleSurveyUuids => ({
  surveyUuid: crypto.randomUUID(),
  ownerUuid: crypto.randomUUID(),
  rootEntityUuid: crypto.randomUUID(),
  idAttributeUuid: crypto.randomUUID(),
  notesAttributeUuid: crypto.randomUUID(),
})

/**
 * Builds a minimal, valid Arena survey export/backup zip in memory: one root entity with an
 * integer key attribute and a text attribute. The same returned buffer can be reused for many
 * concurrent POST /api/survey/arena-import requests -- node defs live in a per-survey Postgres
 * schema (survey_<id>), so identical UUIDs across concurrent imports of one buffer never collide.
 * @param [uuids] - UUIDs to embed in the zip (defaults to a freshly generated set).
 * @returns The zip file content, ready to write to disk or upload directly.
 */
export const buildSampleSurveyZipBuffer = (uuids: SampleSurveyUuids = generateSampleSurveyUuids()): Buffer => {
  const zip = new AdmZip()
  zip.addFile('survey.json', Buffer.from(JSON.stringify(buildSurveyJson(uuids)), 'utf-8'))
  zip.addFile('categories/categories.json', Buffer.from('{}', 'utf-8'))
  zip.addFile('taxonomies/taxonomies.json', Buffer.from('[]', 'utf-8'))
  return zip.toBuffer()
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `node --experimental-strip-types --test test/load/lib/sampleSurveyZip.test.ts`
Expected: PASS — all 7 tests green.

- [ ] **Step 5: Run the full load-test unit suite to make sure nothing else broke**

Run: `yarn test:load:unit`
Expected: PASS — includes the new file via the existing `test/load/**/*.test.ts` glob, plus all pre-existing `test/load/lib/*.test.ts` files.

- [ ] **Step 6: Commit**

```bash
git add test/load/lib/sampleSurveyZip.ts test/load/lib/sampleSurveyZip.test.ts
git commit -m "$(cat <<'EOF'
Add sample survey zip builder for the load-test stress tool

Builds a minimal, valid Arena survey export zip in memory (one root
entity, two attributes) so the stress test has a fixture to import
without a binary file committed to the repo.
EOF
)"
```

---

### Task 2: CLI wrapper + npm script

**Files:**
- Create: `test/load/buildSampleSurveyZip.ts`
- Modify: `package.json` (add one script line)

**Interfaces:**
- Consumes: `buildSampleSurveyZipBuffer` from `test/load/lib/sampleSurveyZip.ts` (Task 1).
- Produces (relied on by Task 3 and Task 4's CI step): the `yarn test:load:build-fixture <output-path>` command, and the underlying `node --experimental-strip-types test/load/buildSampleSurveyZip.ts <output-path>` invocation.

- [ ] **Step 1: Create `test/load/buildSampleSurveyZip.ts`**

```ts
/* eslint-disable no-console -- this file's entire purpose is CLI output */
import fs from 'node:fs'
import path from 'node:path'

import { buildSampleSurveyZipBuffer } from './lib/sampleSurveyZip.ts'

const DEFAULT_OUTPUT_PATH = './sample-survey.zip'

/**
 * CLI entry point: builds the minimal sample Arena survey zip and writes it to the path given as
 * the first CLI argument (or DEFAULT_OUTPUT_PATH when none is given).
 * @returns Resolves once the file has been written.
 */
export const main = async (): Promise<void> => {
  const outputPath = path.resolve(process.argv[2] || DEFAULT_OUTPUT_PATH)
  fs.writeFileSync(outputPath, buildSampleSurveyZipBuffer())
  console.log(`Sample survey zip written to ${outputPath}`)
}

if (import.meta.main) {
  main().catch((error) => {
    console.error('Failed to build sample survey zip:', error)
    process.exitCode = 1
  })
}
```

- [ ] **Step 2: Add the npm script**

In `package.json`, in the `"scripts"` block, directly below the existing `"test:load:unit"` line:

```diff
     "test:load": "node --experimental-strip-types test/load/surveyImportStressTest.ts",
     "test:load:unit": "node --experimental-strip-types --test test/load/**/*.test.ts",
+    "test:load:build-fixture": "node --experimental-strip-types test/load/buildSampleSurveyZip.ts",
     "test": "run-s test:unit test:e2e",
```

- [ ] **Step 3: Run it and inspect the output**

Run: `yarn test:load:build-fixture /tmp/sample-survey.zip`
Expected: prints `Sample survey zip written to /tmp/sample-survey.zip`, and the file exists.

Then inspect it:

```bash
unzip -l /tmp/sample-survey.zip
unzip -p /tmp/sample-survey.zip survey.json | node -e "console.log(JSON.parse(require('fs').readFileSync(0, 'utf-8')))"
```

Expected: entries `survey.json`, `categories/categories.json`, `taxonomies/taxonomies.json`; the parsed `survey.json` has a non-empty `authGroups`, `props.languages: ["en"]`, and 3 `nodeDefs`.

- [ ] **Step 4: Commit**

```bash
git add test/load/buildSampleSurveyZip.ts package.json
git commit -m "$(cat <<'EOF'
Add CLI to write the sample survey zip fixture to disk

Exposes buildSampleSurveyZipBuffer as `yarn test:load:build-fixture`
so both CI and local devs can generate the stress test's fixture
without a binary checked into git.
EOF
)"
```

---

### Task 3: Empirical verification against a real local dev server

**Why this task exists:** the design doc for this feature already caught one wrong assumption from pure source-reading (the `backup` flag's actual value at this endpoint) — this task is a required gate before touching CI, not optional polish. It needs a locally running Arena server with a real Postgres database, so it can only run in an environment with that available (a sandboxed/isolated worktree without DB access cannot complete it — if that's the situation, stop and hand this task back rather than skipping it).

**Files:** none (verification only — no commit at the end of this task).

**Interfaces:**
- Consumes: `yarn test:load:build-fixture` (Task 2), the pre-existing `test/load/surveyImportStressTest.ts` CLI (`yarn test:load --zip <path> --count <n>`).
- Produces: confidence that Task 4's CI wiring will actually pass, and prints/output pasted into the task's completion notes for the next reviewer.

- [ ] **Step 1: Start a local Postgres and the dev server**

Follow this repo's normal local dev setup (`CLAUDE.md`): ensure `.env` has `PGHOST`/`PGPORT`/`PGDATABASE`/`PGUSER`/`PGPASSWORD` pointing at a real local Postgres, and `ADMIN_EMAIL`/`ADMIN_PASSWORD` set. Then:

```bash
yarn dev:server
```

Wait until it logs that it's listening (default `http://localhost:9090`).

- [ ] **Step 2: Build the fixture**

```bash
yarn test:load:build-fixture /tmp/sample-survey.zip
```

Expected: same as Task 2 Step 3.

- [ ] **Step 3: Run the stress test at low concurrency first**

```bash
yarn test:load --zip /tmp/sample-survey.zip --count 3
```

Expected: exit code 0, summary shows `succeeded: 3`, `failed: 0`, `timed-out: 0`, `rejected-at-http: 0`.

- [ ] **Step 4: Manually inspect one resulting survey**

Log into the Arena UI as the admin, open the Designer for one of the `stress_test_<runId>_<i>` surveys created in Step 3. Confirm: it opens without error, has a root entity with an `id` (integer, key) and `notes` (text) attribute, and is in draft state.

- [ ] **Step 5: Run at the real default concurrency**

```bash
yarn test:load --zip /tmp/sample-survey.zip
```

(No `--count` — uses the default of 50.) Expected: exit code 0, summary shows `succeeded: 50` and completes in well under the default `--job-timeout` budget (120000ms × 50 worst case) — note the actual total duration printed in the summary for the CI step's own sanity-checking later.

- [ ] **Step 6: If anything failed, fix it before proceeding**

If any outcome is `failed`/`timed-out`/`rejected-at-http`, read the printed error detail for that entry (the tool prints full error detail per non-succeeded request), fix the root cause in `test/load/lib/sampleSurveyZip.ts` (Task 1), re-run `yarn test:load:unit`, then repeat Steps 2–5 until a full `--count 50` run succeeds cleanly. Do not proceed to Task 4 until this step is clean — this is the gate the task exists for.

- [ ] **Step 7: Stop the local dev server**

Stop the `yarn dev:server` process (Ctrl-C or kill the process). No commit for this task.

---

### Task 4: CI wiring in `.github/workflows/test.js.yml`

**Files:**
- Modify: `.github/workflows/test.js.yml`

**Interfaces:**
- Consumes: `yarn test:load:build-fixture` and `node --experimental-strip-types test/load/surveyImportStressTest.ts` (Tasks 2 and the pre-existing tool), gated on Task 3 having passed cleanly at `--count 50`.
- Produces: nothing further downstream — this is the CI-facing deliverable.

- [ ] **Step 1: Disable rate limiting for the CI server process**

In the `"Run server"` step's `env:` block, add `RATE_LIMIT_ENABLED: false`:

```diff
       - name: Run server
         run: |
           ln -s dist/server.js .
           exec pm2-runtime server.js &
         env:
           PGHOST: localhost
           PGPORT: 5444
           PGDATABASE: of-arena-test
           PGUSER: arena
           PGPASSWORD: arena
           SESSION_ID_COOKIE_SECRET: my-cookie-secret-key
           ADMIN_EMAIL: ${{secrets.ADMIN_EMAIL}}
           ADMIN_PASSWORD: ${{secrets.ADMIN_PASSWORD}}
           SENDGRID_API_KEY: ${{secrets.SENDGRID_API_KEY}}
+          RATE_LIMIT_ENABLED: false
```

- [ ] **Step 2: Add the fixture-build and stress-test steps after "Run tests"**

At the end of the `steps:` list (after the existing `"Run tests"` step), add:

```diff
       - name: Run tests
         run: yarn test
         env:
           PGHOST: localhost
           PGPORT: 5444
           PGDATABASE: of-arena-test
           PGUSER: arena
           PGPASSWORD: arena
+      - name: Build sample survey zip for stress test
+        run: yarn test:load:build-fixture /tmp/sample-survey.zip
+      - name: Run survey import stress test
+        run: node --experimental-strip-types test/load/surveyImportStressTest.ts --zip /tmp/sample-survey.zip
+        env:
+          ADMIN_EMAIL: ${{secrets.ADMIN_EMAIL}}
+          ADMIN_PASSWORD: ${{secrets.ADMIN_PASSWORD}}
```

No `--count` flag — the tool's own default (50) is what's requested. No `--url` — defaults to `http://localhost:9090`, which is where the already-running server (started earlier in this same job) listens.

- [ ] **Step 3: Validate the YAML**

Run: `python3 -c "import yaml; yaml.safe_load(open('.github/workflows/test.js.yml'))"` (or any YAML linter available) to catch indentation mistakes before pushing.
Expected: no output / no error.

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/test.js.yml
git commit -m "$(cat <<'EOF'
Run the survey import stress test in CI

Disables the login rate limiter for the CI server process (no test
asserts on 429 behavior) and adds steps to build the sample survey
zip fixture and run 50 concurrent survey imports against the same
server the rest of the suite already uses.
EOF
)"
```

- [ ] **Step 5: Push and confirm on a real PR run**

Push the branch and open (or update) a PR so the workflow actually runs on GitHub Actions. Watch the "Run survey import stress test" step's logs and confirm it passes. This is the only way to fully validate the CI wiring (service containers, secrets, networking) — local verification in Task 3 validates the tool and fixture, not the workflow YAML itself.

---

### Task 5: Update `test/load/README.md`

**Files:**
- Modify: `test/load/README.md`

**Interfaces:**
- Consumes: nothing (documentation only).
- Produces: nothing downstream.

- [ ] **Step 1: Replace the "not wired into CI" framing**

Old text (currently lines 13–15):

```markdown
It is not wired into `yarn test` / CI. It's a load-testing tool for local
dev use against a running server.
```

New text:

```markdown
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
```

- [ ] **Step 2: Note that the "permanent throwaway accounts" caveat doesn't apply to CI**

In the "Limitations" section, directly below the existing "Throwaway user accounts are permanent." paragraph, add:

```markdown
This doesn't apply to the CI run: the Postgres service container backing
each `test.js.yml` job is destroyed at the end of the run, so leftover
`stress_test_*@loadtest.local` rows never persist.
```

- [ ] **Step 3: Commit**

```bash
git add test/load/README.md
git commit -m "docs: document survey import stress test's new CI wiring"
```

---

## Plan self-review notes

- **Spec coverage:** fixture builder (Task 1), CLI + npm script (Task 2), empirical verification gate (Task 3), `RATE_LIMIT_ENABLED=false` + new CI steps (Task 4), README update (Task 5) — every section of `docs/superpowers/specs/2026-08-13-survey-stress-test-ci-design.md` has a corresponding task.
- **Placeholder scan:** no TBD/TODO markers; every step has literal code or literal commands.
- **Type consistency:** `SampleSurveyUuids`, `generateSampleSurveyUuids`, `buildSampleSurveyZipBuffer` are defined once in Task 1 and referenced with identical names/signatures in Task 2; no renames across tasks.
