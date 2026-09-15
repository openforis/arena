# Survey Import Concurrency Stress Test Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a standalone Node CLI tool that fires N (default 50) concurrent `POST /api/survey/arena-import` requests against a running Arena server, using a real Arena survey export zip, to validate the survey-creation/import concurrency fixes on this branch under real HTTP load.

**Architecture:** Four small, independently-testable CommonJS modules under `test/load/lib/` (CLI config parsing, latency statistics, report formatting, thin `fetch`-based HTTP API client) wired together by one orchestrator script, `test/load/surveyImportStressTest.js`, that logs in once, fires the burst, polls each resulting job to completion, prints a report, and cleans up.

**Tech Stack:** Plain Node 24 (global `fetch`/`FormData`/`Blob`/`Response`, `node:test`, `node:assert/strict`), `dotenv` (already a project dependency) for `.env` fallback. No new npm dependencies.

## Global Constraints

- No new npm dependencies — use Node 24 built-ins (`fetch`, `FormData`, `Blob`, `Response`, `crypto`) plus the already-present `dotenv`.
- Plain CommonJS `.js` files (`require`/`module.exports`), runnable directly via `node <file>` — no babel/webpack build step.
- Code style follows `.prettierrc`: no semicolons, single quotes, 120-char print width, ES5 trailing commas. Run `npx eslint --cache --fix <path>` on every new file (per `CLAUDE.md`) — the active config is the flat `eslint.config.js` at the repo root (the legacy `.eslintrc` is not used by this project's installed ESLint 9).
- Not wired into `yarn test` / `yarn test:unit` / `yarn test:e2e` / CI — this is a manual load-testing tool for pointing at a running server, invoked directly via `node` or a dedicated `yarn` script added in Task 5.
- True burst concurrency only (`Promise.all`/`Promise.allSettled`) — no ramped/staged batches.
- Auto-cleanup of every survey the run creates is the default behavior (`DELETE /api/survey/:surveyId`); `--keep` opts out.
- Confirmed API contracts (read from source, not assumed):
  - `POST /auth/login` — mounted at the server root, **not** under `/api` (`authApi.init(app)` in `server/system/appCluster.js`, route defined in `node_modules/@openforis/arena-server/dist/api/auth/login.js`). Body `{ email, password }`; response `{ user, survey, authToken }`.
  - `POST /api/survey/arena-import` — `server/modules/arenaImport/api/arenaImportApi.js`. Multipart form fields: `survey` (JSON string, only `name`/`options` are read) and `file` (the zip). Omitting `chunk`/`totalChunks`/`totalFileSize` selects the single-file (non-chunked) path in `server/modules/file/service/requestChunkedFileProcessor.js`. Response `{ job }` where `job` is `JobUtils.jobToJSON(job)`.
  - `GET /api/jobs/:jobUuid` — `server/job/jobApi.js`. Response is the job summary **directly** (not wrapped), with fields `uuid`, `status` (one of `pending`/`running`/`succeeded`/`canceled`/`failed`, see `server/job/jobUtils.js:jobStatus`), `surveyId` (populated once the survey row is created — see `server/modules/arenaImport/service/arenaImport/jobs/surveyCreatorJob.js:75-77`), `errors`, `result`.
  - `DELETE /api/survey/:surveyId` — `server/modules/survey/api/surveyApi.js`.
  - Auth: JWT bearer token on every request after login — header `Authorization: Bearer <authToken>`.

---

## File Structure

```
test/load/
  lib/
    stats.js          # computeStats(values) -> {count,min,max,avg,p95}
    stats.test.js
    config.js          # parseConfig({argv,env}) -> resolved config | {help:true}
    config.test.js
    report.js          # formatSummary({results,totalDurationMs}) -> string
    report.test.js
    httpApi.js          # login/importSurveyZip/getJobStatus/deleteSurvey (fetch wrappers)
    httpApi.test.js
  surveyImportStressTest.js   # CLI entry point / orchestrator (not unit tested — see Task 5)
```

---

### Task 1: Latency statistics module

**Files:**
- Create: `test/load/lib/stats.js`
- Test: `test/load/lib/stats.test.js`

**Interfaces:**
- Produces: `computeStats(values: number[]) -> { count: number, min: number|null, max: number|null, avg: number|null, p95: number|null }`. Empty/non-array input returns `{ count: 0, min: null, max: null, avg: null, p95: null }`.

- [ ] **Step 1: Write the failing tests**

Create `test/load/lib/stats.test.js`:

```js
const test = require('node:test')
const assert = require('node:assert/strict')

const { computeStats } = require('./stats')

test('computeStats returns nulls for an empty array', () => {
  assert.deepEqual(computeStats([]), { count: 0, min: null, max: null, avg: null, p95: null })
})

test('computeStats computes min/max/avg for a simple set', () => {
  const stats = computeStats([10, 20, 30])
  assert.equal(stats.count, 3)
  assert.equal(stats.min, 10)
  assert.equal(stats.max, 30)
  assert.equal(stats.avg, 20)
})

test('computeStats is not affected by input order', () => {
  const stats = computeStats([30, 10, 20])
  assert.equal(stats.min, 10)
  assert.equal(stats.max, 30)
})

test('computeStats computes p95 for a 100-sample set', () => {
  const values = Array.from({ length: 100 }, (_, i) => i + 1) // 1..100
  const stats = computeStats(values)
  assert.equal(stats.p95, 95)
})

test('computeStats handles a single value', () => {
  const stats = computeStats([42])
  assert.deepEqual(stats, { count: 1, min: 42, max: 42, avg: 42, p95: 42 })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --test test/load/lib/stats.test.js`
Expected: FAIL — `Cannot find module './stats'`.

- [ ] **Step 3: Implement `stats.js`**

Create `test/load/lib/stats.js`:

```js
/**
 * Computes summary statistics (min, max, average, p95) for a list of numeric samples.
 * @param {Array<number>} values - Numeric samples (e.g. latencies in milliseconds).
 * @returns {{count: number, min: number|null, max: number|null, avg: number|null, p95: number|null}} Summary statistics; all fields are null when values is empty.
 */
const computeStats = (values) => {
  if (!Array.isArray(values) || values.length === 0) {
    return { count: 0, min: null, max: null, avg: null, p95: null }
  }
  const sorted = [...values].sort((a, b) => a - b)
  const count = sorted.length
  const sum = sorted.reduce((total, value) => total + value, 0)
  const p95Index = Math.min(count - 1, Math.ceil(count * 0.95) - 1)

  return {
    count,
    min: sorted[0],
    max: sorted[count - 1],
    avg: sum / count,
    p95: sorted[p95Index],
  }
}

module.exports = { computeStats }
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `node --test test/load/lib/stats.test.js`
Expected: PASS (5 tests).

- [ ] **Step 5: Lint and commit**

```bash
npx eslint --cache --fix test/load/lib/stats.js test/load/lib/stats.test.js
git add test/load/lib/stats.js test/load/lib/stats.test.js
git commit -m "test(load): add latency stats helper for survey import stress test"
```

---

### Task 2: CLI configuration module

**Files:**
- Create: `test/load/lib/config.js`
- Test: `test/load/lib/config.test.js`

**Interfaces:**
- Consumes: nothing from other tasks.
- Produces: `parseConfig({ argv: string[], env: object }) -> config`, where `config` is either `{ help: true }` or `{ help: false, zipPath: string, url: string, email: string, password: string, count: number, jobTimeoutMs: number, keep: boolean }`. Throws `Error` (with a descriptive message) on missing/invalid input. Also exports `HELP_TEXT: string`, `DEFAULT_URL`, `DEFAULT_COUNT`, `DEFAULT_JOB_TIMEOUT_MS`.

- [ ] **Step 1: Write the failing tests**

Create `test/load/lib/config.test.js`:

```js
const test = require('node:test')
const assert = require('node:assert/strict')
const path = require('node:path')

const { parseConfig, DEFAULT_URL, DEFAULT_COUNT, DEFAULT_JOB_TIMEOUT_MS } = require('./config')

const baseEnv = {}

test('parseConfig throws when --zip is missing', () => {
  assert.throws(() => parseConfig({ argv: [], env: baseEnv }), /Missing required argument: --zip/)
})

test('parseConfig throws when email is missing', () => {
  assert.throws(() => parseConfig({ argv: ['--zip', 'survey.zip'], env: baseEnv }), /Missing email/)
})

test('parseConfig throws when password is missing', () => {
  assert.throws(
    () => parseConfig({ argv: ['--zip', 'survey.zip', '--email', 'a@b.com'], env: baseEnv }),
    /Missing password/
  )
})

test('parseConfig applies defaults when only required args are passed', () => {
  const config = parseConfig({
    argv: ['--zip', 'survey.zip', '--email', 'a@b.com', '--password', 'pw'],
    env: baseEnv,
  })
  assert.equal(config.zipPath, path.resolve('survey.zip'))
  assert.equal(config.url, DEFAULT_URL)
  assert.equal(config.email, 'a@b.com')
  assert.equal(config.password, 'pw')
  assert.equal(config.count, DEFAULT_COUNT)
  assert.equal(config.jobTimeoutMs, DEFAULT_JOB_TIMEOUT_MS)
  assert.equal(config.keep, false)
})

test('parseConfig falls back to env vars for url/email/password', () => {
  const config = parseConfig({
    argv: ['--zip', 'survey.zip'],
    env: { ARENA_URL: 'http://example.test/', ADMIN_EMAIL: 'admin@x.com', ADMIN_PASSWORD: 'secret' },
  })
  assert.equal(config.url, 'http://example.test')
  assert.equal(config.email, 'admin@x.com')
  assert.equal(config.password, 'secret')
})

test('parseConfig reads --count, --job-timeout and --keep', () => {
  const config = parseConfig({
    argv: [
      '--zip',
      'survey.zip',
      '--email',
      'a@b.com',
      '--password',
      'pw',
      '--count',
      '5',
      '--job-timeout',
      '1000',
      '--keep',
    ],
    env: baseEnv,
  })
  assert.equal(config.count, 5)
  assert.equal(config.jobTimeoutMs, 1000)
  assert.equal(config.keep, true)
})

test('parseConfig rejects a non-positive-integer --count', () => {
  assert.throws(
    () =>
      parseConfig({
        argv: ['--zip', 'survey.zip', '--email', 'a@b.com', '--password', 'pw', '--count', '0'],
        env: baseEnv,
      }),
    /--count must be a positive integer/
  )
})

test('parseConfig short-circuits with help:true on --help', () => {
  assert.deepEqual(parseConfig({ argv: ['--help'], env: baseEnv }), { help: true })
})

test('parseConfig rejects unknown flags', () => {
  assert.throws(() => parseConfig({ argv: ['--bogus'], env: baseEnv }), /Unknown argument: --bogus/)
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --test test/load/lib/config.test.js`
Expected: FAIL — `Cannot find module './config'`.

- [ ] **Step 3: Implement `config.js`**

Create `test/load/lib/config.js`:

```js
const path = require('node:path')

const DEFAULT_URL = 'http://localhost:9090'
const DEFAULT_COUNT = 50
const DEFAULT_JOB_TIMEOUT_MS = 120000

const FLAG_DEFS = [
  { flag: '--zip', key: 'zipPath', hasValue: true },
  { flag: '--count', key: 'count', hasValue: true },
  { flag: '--url', key: 'url', hasValue: true },
  { flag: '--email', key: 'email', hasValue: true },
  { flag: '--password', key: 'password', hasValue: true },
  { flag: '--job-timeout', key: 'jobTimeoutMs', hasValue: true },
  { flag: '--keep', key: 'keep', hasValue: false },
  { flag: '--help', key: 'help', hasValue: false },
]

const HELP_TEXT = `Usage: node test/load/surveyImportStressTest.js --zip <path> [options]

Options:
  --zip <path>          Path to an Arena survey export/backup zip (required)
  --count <n>           Number of concurrent import requests (default: ${DEFAULT_COUNT})
  --url <base>          Arena server base URL (default: ${DEFAULT_URL}, env: ARENA_URL)
  --email <email>       Login email (env: ARENA_EMAIL / ADMIN_EMAIL)
  --password <password> Login password (env: ARENA_PASSWORD / ADMIN_PASSWORD)
  --job-timeout <ms>    Max time to wait for each import job (default: ${DEFAULT_JOB_TIMEOUT_MS})
  --keep                Do not delete the surveys created by this run
  --help                Show this help message
`

/**
 * Parses raw CLI arguments into a flat object keyed by flag name.
 * @param {Array<string>} argv - Raw CLI arguments (without the node/script path entries).
 * @returns {object} Flag values keyed by their config key.
 */
const parseArgv = (argv) => {
  const parsed = {}
  let index = 0
  while (index < argv.length) {
    const arg = argv[index]
    const flagDef = FLAG_DEFS.find((def) => def.flag === arg)
    if (!flagDef) {
      throw new Error(`Unknown argument: ${arg}`)
    }
    if (flagDef.hasValue) {
      const value = argv[index + 1]
      if (value === undefined) {
        throw new Error(`Missing value for argument: ${arg}`)
      }
      parsed[flagDef.key] = value
      index += 2
    } else {
      parsed[flagDef.key] = true
      index += 1
    }
  }
  return parsed
}

/**
 * Parses and validates a value as a positive integer.
 * @param {object} params - Function parameters.
 * @param {string|number} params.value - Raw value to parse.
 * @param {string} params.label - Label used in the error message when invalid.
 * @returns {number} The parsed positive integer.
 */
const toPositiveInt = ({ value, label }) => {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${label} must be a positive integer, got: ${value}`)
  }
  return parsed
}

/**
 * Builds the stress test configuration from CLI arguments and environment variables.
 * @param {object} params - Function parameters.
 * @param {Array<string>} params.argv - Raw CLI arguments (e.g. process.argv.slice(2)).
 * @param {object} params.env - Environment variables (e.g. process.env).
 * @returns {object} Resolved configuration, or { help: true } when --help was passed.
 */
const parseConfig = ({ argv, env }) => {
  const args = parseArgv(argv)

  if (args.help) {
    return { help: true }
  }

  const zipPath = args.zipPath
  if (!zipPath) {
    throw new Error('Missing required argument: --zip <path-to-arena-survey-zip>')
  }

  const url = args.url || env.ARENA_URL || DEFAULT_URL
  const email = args.email || env.ARENA_EMAIL || env.ADMIN_EMAIL
  if (!email) {
    throw new Error('Missing email: pass --email, or set ARENA_EMAIL / ADMIN_EMAIL')
  }
  const password = args.password || env.ARENA_PASSWORD || env.ADMIN_PASSWORD
  if (!password) {
    throw new Error('Missing password: pass --password, or set ARENA_PASSWORD / ADMIN_PASSWORD')
  }

  const count = toPositiveInt({ value: args.count ?? DEFAULT_COUNT, label: '--count' })
  const jobTimeoutMs = toPositiveInt({ value: args.jobTimeoutMs ?? DEFAULT_JOB_TIMEOUT_MS, label: '--job-timeout' })

  return {
    help: false,
    zipPath: path.resolve(zipPath),
    url: url.replace(/\/+$/, ''),
    email,
    password,
    count,
    jobTimeoutMs,
    keep: Boolean(args.keep),
  }
}

module.exports = { parseConfig, HELP_TEXT, DEFAULT_URL, DEFAULT_COUNT, DEFAULT_JOB_TIMEOUT_MS }
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `node --test test/load/lib/config.test.js`
Expected: PASS (9 tests).

- [ ] **Step 5: Lint and commit**

```bash
npx eslint --cache --fix test/load/lib/config.js test/load/lib/config.test.js
git add test/load/lib/config.js test/load/lib/config.test.js
git commit -m "test(load): add CLI config parsing for survey import stress test"
```

---

### Task 3: Report formatting module

**Files:**
- Create: `test/load/lib/report.js`
- Test: `test/load/lib/report.test.js`

**Interfaces:**
- Consumes: `computeStats` from Task 1 (`require('./stats')`).
- Produces: `formatSummary({ results: ResultEntry[], totalDurationMs: number }) -> string`, where `ResultEntry = { index: number, name: string, outcome: 'succeeded'|'failed'|'timed-out'|'canceled'|'rejected-at-http', surveyId: number|null, acceptMs: number|null, jobMs: number|null, error: string|null }`. This exact `ResultEntry` shape is what Task 5's orchestrator builds and passes in.

- [ ] **Step 1: Write the failing tests**

Create `test/load/lib/report.test.js`:

```js
const test = require('node:test')
const assert = require('node:assert/strict')

const { formatSummary } = require('./report')

const baseResult = { index: 0, name: 'stress_test_0', outcome: 'succeeded', acceptMs: 100, jobMs: 500, error: null }

test('formatSummary counts outcomes and reports latency stats', () => {
  const results = [
    { ...baseResult, index: 0, name: 's0' },
    { ...baseResult, index: 1, name: 's1', acceptMs: 200, jobMs: 1000 },
    { ...baseResult, index: 2, name: 's2', outcome: 'failed', error: 'boom', acceptMs: 150, jobMs: 300 },
  ]
  const summary = formatSummary({ results, totalDurationMs: 2000 })

  assert.match(summary, /Total requests: 3/)
  assert.match(summary, /succeeded: 2/)
  assert.match(summary, /failed: 1/)
  assert.match(summary, /timed-out: 0/)
})

test('formatSummary lists failure detail lines', () => {
  const results = [{ ...baseResult, index: 4, name: 's4', outcome: 'failed', error: 'pool exhausted' }]
  const summary = formatSummary({ results, totalDurationMs: 500 })

  assert.match(summary, /Failures:/)
  assert.match(summary, /\[4\] s4 - failed: pool exhausted/)
})

test('formatSummary omits the Failures section when everything succeeded', () => {
  const results = [{ ...baseResult }]
  const summary = formatSummary({ results, totalDurationMs: 500 })

  assert.doesNotMatch(summary, /Failures:/)
})

test('formatSummary handles an empty results array', () => {
  const summary = formatSummary({ results: [], totalDurationMs: 0 })
  assert.match(summary, /Total requests: 0/)
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --test test/load/lib/report.test.js`
Expected: FAIL — `Cannot find module './report'`.

- [ ] **Step 3: Implement `report.js`**

Create `test/load/lib/report.js`:

```js
const { computeStats } = require('./stats')

const OUTCOME_ORDER = ['succeeded', 'failed', 'timed-out', 'canceled', 'rejected-at-http']

/**
 * Formats a millisecond duration for display, or 'n/a' when not available.
 * @param {number|null} value - Duration in milliseconds, or null.
 * @returns {string} Formatted duration.
 */
const formatMs = (value) => (value === null || value === undefined ? 'n/a' : `${Math.round(value)}ms`)

/**
 * Builds a human-readable summary report for a stress test run.
 * @param {object} params - Function parameters.
 * @param {Array<object>} params.results - Per-request result objects (see report.test.js for the shape).
 * @param {number} params.totalDurationMs - Total wall-clock duration of the run, in milliseconds.
 * @returns {string} The formatted report.
 */
const formatSummary = ({ results, totalDurationMs }) => {
  const total = results.length
  const byOutcome = results.reduce((acc, result) => {
    acc[result.outcome] = (acc[result.outcome] || 0) + 1
    return acc
  }, {})

  const acceptStats = computeStats(
    results.filter((result) => result.acceptMs !== null).map((result) => result.acceptMs)
  )
  const jobStats = computeStats(results.filter((result) => result.jobMs !== null).map((result) => result.jobMs))

  const lines = []
  lines.push('')
  lines.push('==================== Survey Import Stress Test Summary ====================')
  lines.push(`Total requests: ${total}`)
  lines.push(`Total duration: ${formatMs(totalDurationMs)}`)
  lines.push('')
  lines.push('Outcomes:')
  OUTCOME_ORDER.forEach((outcome) => {
    lines.push(`  ${outcome}: ${byOutcome[outcome] || 0}`)
  })
  lines.push('')
  lines.push(
    `Accept latency  (min/avg/max/p95): ${formatMs(acceptStats.min)} / ${formatMs(acceptStats.avg)} / ${formatMs(acceptStats.max)} / ${formatMs(acceptStats.p95)}`
  )
  lines.push(
    `Job latency     (min/avg/max/p95): ${formatMs(jobStats.min)} / ${formatMs(jobStats.avg)} / ${formatMs(jobStats.max)} / ${formatMs(jobStats.p95)}`
  )

  const failures = results.filter((result) => result.outcome !== 'succeeded')
  if (failures.length > 0) {
    lines.push('')
    lines.push('Failures:')
    failures.forEach((failure) => {
      lines.push(`  [${failure.index}] ${failure.name} - ${failure.outcome}: ${failure.error || 'no error detail'}`)
    })
  }
  lines.push('=============================================================================')
  lines.push('')

  return lines.join('\n')
}

module.exports = { formatSummary }
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `node --test test/load/lib/report.test.js`
Expected: PASS (4 tests).

- [ ] **Step 5: Lint and commit**

```bash
npx eslint --cache --fix test/load/lib/report.js test/load/lib/report.test.js
git add test/load/lib/report.js test/load/lib/report.test.js
git commit -m "test(load): add summary report formatting for survey import stress test"
```

---

### Task 4: HTTP API client module

**Files:**
- Create: `test/load/lib/httpApi.js`
- Test: `test/load/lib/httpApi.test.js`

**Interfaces:**
- Consumes: nothing from other tasks.
- Produces (all accept an injectable `fetchImpl`, defaulting to the global `fetch`, so callers can pass a stub in tests):
  - `login({ baseUrl, email, password, fetchImpl? }) -> Promise<string>` (the auth token)
  - `buildImportFormData({ zipBuffer, zipFileName, surveyName }) -> FormData`
  - `importSurveyZip({ baseUrl, authToken, zipBuffer, zipFileName, surveyName, fetchImpl? }) -> Promise<{ uuid, status, ... }>` (the job object)
  - `getJobStatus({ baseUrl, authToken, jobUuid, fetchImpl? }) -> Promise<object>` (the job summary)
  - `deleteSurvey({ baseUrl, authToken, surveyId, fetchImpl? }) -> Promise<void>`
  - All four network functions throw an `Error` (message includes the HTTP status and response body) on a non-2xx response.

- [ ] **Step 1: Write the failing tests**

Create `test/load/lib/httpApi.test.js`:

```js
const test = require('node:test')
const assert = require('node:assert/strict')

const { login, buildImportFormData, importSurveyZip, getJobStatus, deleteSurvey } = require('./httpApi')

const jsonResponse = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

test('login resolves the auth token and calls the right endpoint', async () => {
  const calls = []
  const fetchImpl = async (url, options) => {
    calls.push({ url, options })
    return jsonResponse({ authToken: 'tok-123' })
  }

  const authToken = await login({ baseUrl: 'http://x', email: 'a@b.com', password: 'pw', fetchImpl })

  assert.equal(authToken, 'tok-123')
  assert.equal(calls.length, 1)
  assert.equal(calls[0].url, 'http://x/auth/login')
  assert.equal(calls[0].options.method, 'POST')
  assert.deepEqual(JSON.parse(calls[0].options.body), { email: 'a@b.com', password: 'pw' })
})

test('login throws with status and body detail on failure', async () => {
  const fetchImpl = async () => jsonResponse({ message: 'bad creds' }, 401)

  await assert.rejects(
    () => login({ baseUrl: 'http://x', email: 'a@b.com', password: 'wrong', fetchImpl }),
    /Login failed \(status 401\).*bad creds/
  )
})

test('buildImportFormData sets the survey and file fields', async () => {
  const formData = buildImportFormData({
    zipBuffer: Buffer.from('zip-bytes'),
    zipFileName: 'survey.zip',
    surveyName: 'stress_test_1',
  })

  const surveyField = JSON.parse(formData.get('survey'))
  assert.deepEqual(surveyField, { name: 'stress_test_1', options: { includeData: false } })

  const fileField = formData.get('file')
  assert.equal(fileField.name, 'survey.zip')
  const content = Buffer.from(await fileField.arrayBuffer())
  assert.equal(content.toString(), 'zip-bytes')
})

test('importSurveyZip posts multipart form data with the bearer token', async () => {
  const calls = []
  const fetchImpl = async (url, options) => {
    calls.push({ url, options })
    return jsonResponse({ job: { uuid: 'job-1', status: 'pending' } })
  }

  const job = await importSurveyZip({
    baseUrl: 'http://x',
    authToken: 'tok-123',
    zipBuffer: Buffer.from('zip-bytes'),
    zipFileName: 'survey.zip',
    surveyName: 'stress_test_1',
    fetchImpl,
  })

  assert.deepEqual(job, { uuid: 'job-1', status: 'pending' })
  assert.equal(calls[0].url, 'http://x/api/survey/arena-import')
  assert.equal(calls[0].options.method, 'POST')
  assert.equal(calls[0].options.headers.Authorization, 'Bearer tok-123')
  assert.ok(calls[0].options.body instanceof FormData)
})

test('importSurveyZip throws when the response has no job', async () => {
  const fetchImpl = async () => jsonResponse({ message: 'pool exhausted' }, 503)

  await assert.rejects(
    () =>
      importSurveyZip({
        baseUrl: 'http://x',
        authToken: 'tok',
        zipBuffer: Buffer.from('x'),
        zipFileName: 'x.zip',
        surveyName: 'n',
        fetchImpl,
      }),
    /Import request failed \(status 503\).*pool exhausted/
  )
})

test('getJobStatus resolves the job summary', async () => {
  const fetchImpl = async () => jsonResponse({ uuid: 'job-1', status: 'succeeded', surveyId: 42 })

  const job = await getJobStatus({ baseUrl: 'http://x', authToken: 'tok', jobUuid: 'job-1', fetchImpl })

  assert.deepEqual(job, { uuid: 'job-1', status: 'succeeded', surveyId: 42 })
})

test('getJobStatus throws on a non-ok response', async () => {
  const fetchImpl = async () => jsonResponse({ message: 'not found' }, 404)

  await assert.rejects(
    () => getJobStatus({ baseUrl: 'http://x', authToken: 'tok', jobUuid: 'missing', fetchImpl }),
    /Job status request failed \(status 404\)/
  )
})

test('deleteSurvey resolves on a successful delete', async () => {
  const calls = []
  const fetchImpl = async (url, options) => {
    calls.push({ url, options })
    return new Response(null, { status: 200 })
  }

  await deleteSurvey({ baseUrl: 'http://x', authToken: 'tok', surveyId: 42, fetchImpl })

  assert.equal(calls[0].url, 'http://x/api/survey/42')
  assert.equal(calls[0].options.method, 'DELETE')
})

test('deleteSurvey throws on a failed delete', async () => {
  const fetchImpl = async () => jsonResponse({ message: 'cannot delete' }, 403)

  await assert.rejects(
    () => deleteSurvey({ baseUrl: 'http://x', authToken: 'tok', surveyId: 42, fetchImpl }),
    /Delete survey 42 failed \(status 403\)/
  )
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --test test/load/lib/httpApi.test.js`
Expected: FAIL — `Cannot find module './httpApi'`.

- [ ] **Step 3: Implement `httpApi.js`**

Create `test/load/lib/httpApi.js`:

```js
/**
 * Logs in against the Arena API and returns a bearer auth token.
 * @param {object} params - Function parameters.
 * @param {string} params.baseUrl - Arena server base URL (no trailing slash).
 * @param {string} params.email - Login email.
 * @param {string} params.password - Login password.
 * @param {Function} [params.fetchImpl] - Fetch implementation to use (defaults to the global fetch).
 * @returns {Promise<string>} The JWT auth token.
 */
const login = async ({ baseUrl, email, password, fetchImpl = fetch }) => {
  const response = await fetchImpl(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const body = await response.json()
  if (!response.ok || !body.authToken) {
    throw new Error(`Login failed (status ${response.status}): ${JSON.stringify(body)}`)
  }
  return body.authToken
}

/**
 * Builds the multipart form data for an Arena survey zip import request.
 * @param {object} params - Function parameters.
 * @param {Buffer} params.zipBuffer - The survey zip file content.
 * @param {string} params.zipFileName - The file name to send for the zip part.
 * @param {string} params.surveyName - The unique name for the new survey.
 * @returns {FormData} The multipart form data ready to send as a fetch body.
 */
const buildImportFormData = ({ zipBuffer, zipFileName, surveyName }) => {
  const formData = new FormData()
  formData.append('survey', JSON.stringify({ name: surveyName, options: { includeData: false } }))
  formData.append('file', new Blob([zipBuffer], { type: 'application/zip' }), zipFileName)
  return formData
}

/**
 * Starts an Arena survey import job from a zip file.
 * @param {object} params - Function parameters.
 * @param {string} params.baseUrl - Arena server base URL.
 * @param {string} params.authToken - JWT auth token from login.
 * @param {Buffer} params.zipBuffer - The survey zip file content.
 * @param {string} params.zipFileName - The file name to send for the zip part.
 * @param {string} params.surveyName - The unique name for the new survey.
 * @param {Function} [params.fetchImpl] - Fetch implementation to use (defaults to the global fetch).
 * @returns {Promise<object>} The created job summary (includes uuid and status).
 */
const importSurveyZip = async ({ baseUrl, authToken, zipBuffer, zipFileName, surveyName, fetchImpl = fetch }) => {
  const formData = buildImportFormData({ zipBuffer, zipFileName, surveyName })
  const response = await fetchImpl(`${baseUrl}/api/survey/arena-import`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${authToken}` },
    body: formData,
  })
  const body = await response.json()
  if (!response.ok || !body.job || !body.job.uuid) {
    throw new Error(`Import request failed (status ${response.status}): ${JSON.stringify(body)}`)
  }
  return body.job
}

/**
 * Fetches the current status of a background job.
 * @param {object} params - Function parameters.
 * @param {string} params.baseUrl - Arena server base URL.
 * @param {string} params.authToken - JWT auth token from login.
 * @param {string} params.jobUuid - UUID of the job to fetch.
 * @param {Function} [params.fetchImpl] - Fetch implementation to use (defaults to the global fetch).
 * @returns {Promise<object>} The job summary.
 */
const getJobStatus = async ({ baseUrl, authToken, jobUuid, fetchImpl = fetch }) => {
  const response = await fetchImpl(`${baseUrl}/api/jobs/${jobUuid}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${authToken}` },
  })
  const body = await response.json()
  if (!response.ok) {
    throw new Error(`Job status request failed (status ${response.status}): ${JSON.stringify(body)}`)
  }
  return body
}

/**
 * Deletes a survey.
 * @param {object} params - Function parameters.
 * @param {string} params.baseUrl - Arena server base URL.
 * @param {string} params.authToken - JWT auth token from login.
 * @param {number|string} params.surveyId - ID of the survey to delete.
 * @param {Function} [params.fetchImpl] - Fetch implementation to use (defaults to the global fetch).
 * @returns {Promise<void>} Resolves when the survey has been deleted.
 */
const deleteSurvey = async ({ baseUrl, authToken, surveyId, fetchImpl = fetch }) => {
  const response = await fetchImpl(`${baseUrl}/api/survey/${surveyId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${authToken}` },
  })
  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(`Delete survey ${surveyId} failed (status ${response.status}): ${JSON.stringify(body)}`)
  }
}

module.exports = { login, buildImportFormData, importSurveyZip, getJobStatus, deleteSurvey }
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `node --test test/load/lib/httpApi.test.js`
Expected: PASS (9 tests).

- [ ] **Step 5: Lint and commit**

```bash
npx eslint --cache --fix test/load/lib/httpApi.js test/load/lib/httpApi.test.js
git add test/load/lib/httpApi.js test/load/lib/httpApi.test.js
git commit -m "test(load): add HTTP client for survey import stress test"
```

---

### Task 5: CLI orchestrator and wiring

**Files:**
- Create: `test/load/surveyImportStressTest.js`
- Modify: `package.json` (add two `scripts` entries)

**Interfaces:**
- Consumes: `parseConfig`, `HELP_TEXT` from `./lib/config` (Task 2); `login`, `importSurveyZip`, `getJobStatus`, `deleteSurvey` from `./lib/httpApi` (Task 4); `formatSummary` from `./lib/report` (Task 3), which itself uses `./lib/stats` (Task 1).
- Produces: a runnable CLI. Also exports `{ main, runSingleImport, pollJobUntilTerminal, cleanupSurveys }` from `module.exports` for reference, though this task does not add automated tests for them (see rationale in Step 1).

This task has no automated test: it's the network-orchestration layer that talks to a real, running Arena server, which is exactly the non-goal called out in the spec ("Not wired into `yarn test`/CI — it targets a running Arena server"). The four lib modules it wires together are already unit-tested in Tasks 1-4. Verification here is a syntax/wiring smoke check (Step 3) plus a manual end-to-end run against a real server, which the user runs themselves (or asks the assistant to run) once a dev server and a sample zip are available.

- [ ] **Step 1: Implement `surveyImportStressTest.js`**

Create `test/load/surveyImportStressTest.js`:

```js
/* eslint-disable no-console -- this file's entire purpose is CLI reporting */
require('dotenv').config()

const fs = require('node:fs')
const path = require('node:path')

const { parseConfig, HELP_TEXT } = require('./lib/config')
const { login, importSurveyZip, getJobStatus, deleteSurvey } = require('./lib/httpApi')
const { formatSummary } = require('./lib/report')

const JOB_POLL_INTERVAL_MS = 1000
const TERMINAL_STATUSES = new Set(['succeeded', 'failed', 'canceled'])

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Polls a job until it reaches a terminal status or the timeout elapses.
 * @param {object} params - Function parameters.
 * @param {string} params.baseUrl - Arena server base URL.
 * @param {string} params.authToken - JWT auth token.
 * @param {string} params.jobUuid - UUID of the job to poll.
 * @param {number} params.timeoutMs - Max time to wait, in milliseconds.
 * @returns {Promise<object>} The last fetched job summary; its status is 'timed-out' if the timeout elapsed first.
 */
const pollJobUntilTerminal = async ({ baseUrl, authToken, jobUuid, timeoutMs }) => {
  const startedAt = Date.now()
  for (;;) {
    const job = await getJobStatus({ baseUrl, authToken, jobUuid })
    if (TERMINAL_STATUSES.has(job.status)) {
      return job
    }
    if (Date.now() - startedAt >= timeoutMs) {
      return { ...job, status: 'timed-out' }
    }
    await sleep(JOB_POLL_INTERVAL_MS)
  }
}

/**
 * Runs one survey import request end-to-end (accept + poll to completion) and reports its outcome.
 * @param {object} params - Function parameters.
 * @param {string} params.baseUrl - Arena server base URL.
 * @param {string} params.authToken - JWT auth token.
 * @param {Buffer} params.zipBuffer - The survey zip file content.
 * @param {string} params.zipFileName - The file name to send for the zip part.
 * @param {string} params.surveyName - The unique name for the new survey.
 * @param {number} params.index - Index of this request within the run (for reporting).
 * @param {number} params.jobTimeoutMs - Max time to wait for the job to finish.
 * @returns {Promise<object>} A result entry (see report.js for the shape).
 */
const runSingleImport = async ({ baseUrl, authToken, zipBuffer, zipFileName, surveyName, index, jobTimeoutMs }) => {
  const acceptStartedAt = Date.now()
  let job
  try {
    job = await importSurveyZip({ baseUrl, authToken, zipBuffer, zipFileName, surveyName })
  } catch (error) {
    return {
      index,
      name: surveyName,
      outcome: 'rejected-at-http',
      surveyId: null,
      acceptMs: Date.now() - acceptStartedAt,
      jobMs: null,
      error: error.message,
    }
  }
  const acceptMs = Date.now() - acceptStartedAt

  const jobStartedAt = Date.now()
  const finalJob = await pollJobUntilTerminal({ baseUrl, authToken, jobUuid: job.uuid, timeoutMs: jobTimeoutMs })
  const jobMs = Date.now() - jobStartedAt

  const outcome = finalJob.status
  const error = outcome === 'succeeded' ? null : JSON.stringify(finalJob.errors || finalJob.result || 'unknown error')

  return {
    index,
    name: surveyName,
    outcome,
    surveyId: finalJob.surveyId || null,
    acceptMs,
    jobMs,
    error,
  }
}

/**
 * Deletes every survey referenced by the given results, best-effort.
 * @param {object} params - Function parameters.
 * @param {string} params.baseUrl - Arena server base URL.
 * @param {string} params.authToken - JWT auth token.
 * @param {Array<object>} params.results - Result entries produced by runSingleImport.
 * @returns {Promise<void>} Resolves once every deletion attempt has settled.
 */
const cleanupSurveys = async ({ baseUrl, authToken, results }) => {
  const surveyIds = results.map((result) => result.surveyId).filter(Boolean)
  const cleanupResults = await Promise.allSettled(
    surveyIds.map((surveyId) => deleteSurvey({ baseUrl, authToken, surveyId }))
  )
  cleanupResults.forEach((cleanupResult, i) => {
    if (cleanupResult.status === 'rejected') {
      console.error(`Failed to delete survey ${surveyIds[i]}: ${cleanupResult.reason.message}`)
    }
  })
}

/**
 * CLI entry point: parses config, runs the concurrent import burst, reports, and cleans up.
 * @returns {Promise<void>} Resolves when the run is complete; sets process.exitCode on failure.
 */
const main = async () => {
  let config
  try {
    config = parseConfig({ argv: process.argv.slice(2), env: process.env })
  } catch (error) {
    console.error(error.message)
    console.error(HELP_TEXT)
    process.exitCode = 1
    return
  }

  if (config.help) {
    console.log(HELP_TEXT)
    return
  }

  const { zipPath, url, email, password, count, jobTimeoutMs, keep } = config

  console.log(`Reading zip file: ${zipPath}`)
  const zipBuffer = fs.readFileSync(zipPath)
  const zipFileName = path.basename(zipPath)

  console.log(`Logging in as ${email} at ${url}...`)
  const authToken = await login({ baseUrl: url, email, password })

  const runId = Date.now()
  console.log(`Firing ${count} concurrent survey imports (run ${runId})...`)

  const startedAt = Date.now()
  const results = await Promise.all(
    Array.from({ length: count }, (_, i) =>
      runSingleImport({
        baseUrl: url,
        authToken,
        zipBuffer,
        zipFileName,
        surveyName: `stress_test_${runId}_${i}`,
        index: i,
        jobTimeoutMs,
      })
    )
  )
  const totalDurationMs = Date.now() - startedAt

  console.log(formatSummary({ results, totalDurationMs }))

  if (!keep) {
    console.log('Cleaning up created surveys...')
    await cleanupSurveys({ baseUrl: url, authToken, results })
  }

  const anyFailed = results.some((result) => result.outcome !== 'succeeded')
  process.exitCode = anyFailed ? 1 : 0
}

if (require.main === module) {
  main().catch((error) => {
    console.error('Stress test failed to run:', error)
    process.exitCode = 1
  })
}

module.exports = { main, runSingleImport, pollJobUntilTerminal, cleanupSurveys }
```

- [ ] **Step 2: Add convenience `yarn` scripts**

In `package.json`, in the `"scripts"` object, add these two entries right after the `"test:e2e:watch"` line (`package.json:28`):

```json
    "test:load": "node test/load/surveyImportStressTest.js",
    "test:load:unit": "node --test test/load/lib/",
```

- [ ] **Step 3: Smoke-check the CLI wiring (no server required)**

Run each of these and confirm the described output — these exercise config parsing, help text, and error handling without needing a live server or network access:

```bash
node test/load/surveyImportStressTest.js --help
```
Expected: prints `HELP_TEXT` (usage block starting with `Usage: node test/load/surveyImportStressTest.js --zip <path> [options]`), exit code 0.

```bash
node test/load/surveyImportStressTest.js
```
Expected: prints `Missing required argument: --zip <path-to-arena-survey-zip>` followed by the help text, exits with a non-zero code.

```bash
node -e "require('./test/load/surveyImportStressTest.js')"
```
Expected: no output, no error (confirms the module loads without executing `main()`, since `require.main !== module` in this context).

- [ ] **Step 4: Run the full unit suite together and lint everything**

```bash
node --test test/load/lib/
npx eslint --cache --fix test/load/surveyImportStressTest.js
```

Expected: all unit tests (from Tasks 1-4) pass in one run; eslint reports no errors on the new orchestrator file (module-load smoke checks from Step 3 already confirm no syntax errors).

- [ ] **Step 5: Commit**

```bash
git add test/load/surveyImportStressTest.js package.json
git commit -m "feat(load): add survey import concurrency stress test CLI"
```

---

## Addendum Tasks (post-final-review)

The final whole-branch review (see ledger) found that firing N requests
under one shared login cannot exercise concurrent job execution at all
(the server's job queue serializes survey-creation/import jobs globally —
see the spec's Addendum section for the full, verified explanation), plus
a real bug in how job results are read. The user chose to re-scope the
tool to use N distinct throwaway users rather than one shared login. Tasks
6-8 implement the fixes and the rescope, in this order (7 depends on 6's
`readBody` helper; 8 depends on 6's `readBody` helper and on 7's
`fetchImpl`-threaded, always-total `runSingleImport`).

### Task 6: Safe error-body handling in httpApi.js

**Files:**
- Modify: `test/load/lib/httpApi.js`
- Modify: `test/load/lib/httpApi.test.js`

**Interfaces:**
- Consumes: nothing new.
- Produces: same five exports as before (`login`, `buildImportFormData`, `importSurveyZip`, `getJobStatus`, `deleteSurvey`) with identical signatures and behavior on success and on JSON error bodies. The only behavior change is on **non-JSON or empty** error response bodies: previously `response.json()` was called unconditionally and threw a raw, unhelpful `SyntaxError` in that case (losing the HTTP status); now the thrown `Error` always includes the HTTP status and whatever body text was available.

- [ ] **Step 1: Write the failing tests**

Add these test cases to `test/load/lib/httpApi.test.js` (keep all 9 existing tests unchanged; add these after them, before the final `module.exports`-adjacent code — there is none, just append at the end of the file):

```js
test('login throws with status and raw text when the error body is not JSON', async () => {
  const fetchImpl = async () => new Response('<html><body>Bad Gateway</body></html>', { status: 502 })

  await assert.rejects(
    () => login({ baseUrl: 'http://x', email: 'a@b.com', password: 'pw', fetchImpl }),
    /Login failed \(status 502\).*Bad Gateway/
  )
})

test('login throws with status when the error body is empty', async () => {
  const fetchImpl = async () => new Response(null, { status: 504 })

  await assert.rejects(
    () => login({ baseUrl: 'http://x', email: 'a@b.com', password: 'pw', fetchImpl }),
    /Login failed \(status 504\)/
  )
})

test('importSurveyZip throws with status and raw text when the error body is not JSON', async () => {
  const fetchImpl = async () => new Response('<html>Gateway Timeout</html>', { status: 504 })

  await assert.rejects(
    () =>
      importSurveyZip({
        baseUrl: 'http://x',
        authToken: 'tok',
        zipBuffer: Buffer.from('x'),
        zipFileName: 'x.zip',
        surveyName: 'n',
        fetchImpl,
      }),
    /Import request failed \(status 504\).*Gateway Timeout/
  )
})

test('getJobStatus throws with status and raw text when the error body is not JSON', async () => {
  const fetchImpl = async () => new Response('Service Unavailable', { status: 503 })

  await assert.rejects(
    () => getJobStatus({ baseUrl: 'http://x', authToken: 'tok', jobUuid: 'job-1', fetchImpl }),
    /Job status request failed \(status 503\).*Service Unavailable/
  )
})

test('deleteSurvey throws with status and raw text when the error body is not JSON', async () => {
  const fetchImpl = async () => new Response('<html>Forbidden</html>', { status: 403 })

  await assert.rejects(
    () => deleteSurvey({ baseUrl: 'http://x', authToken: 'tok', surveyId: 42, fetchImpl }),
    /Delete survey 42 failed \(status 403\).*Forbidden/
  )
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --test test/load/lib/httpApi.test.js`
Expected: the 5 new tests FAIL (the current code throws an unhandled `SyntaxError` from inside `response.json()` instead of the expected `Error` with status/body text — `assert.rejects` will report a mismatch, e.g. the thrown error's message won't match the regex, or a `SyntaxError` propagates uncaught).

- [ ] **Step 3: Replace `test/load/lib/httpApi.js` with this exact content**

```js
/**
 * Reads a fetch Response body once as text, and attempts to JSON-parse it.
 * Never throws: falls back to { message: <raw text> } (or {} for an empty body) when the body isn't valid JSON.
 * @param {Response} response - The fetch Response to read.
 * @returns {Promise<object>} The parsed JSON body, or a fallback object wrapping the raw text.
 */
const readBody = async (response) => {
  const text = await response.text()
  if (!text) {
    return {}
  }
  try {
    return JSON.parse(text)
  } catch {
    return { message: text }
  }
}

/**
 * Logs in against the Arena API and returns a bearer auth token.
 * @param {object} params - Function parameters.
 * @param {string} params.baseUrl - Arena server base URL (no trailing slash).
 * @param {string} params.email - Login email.
 * @param {string} params.password - Login password.
 * @param {Function} [params.fetchImpl] - Fetch implementation to use (defaults to the global fetch).
 * @returns {Promise<string>} The JWT auth token.
 */
const login = async ({ baseUrl, email, password, fetchImpl = fetch }) => {
  const response = await fetchImpl(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!response.ok) {
    const body = await readBody(response)
    throw new Error(`Login failed (status ${response.status}): ${JSON.stringify(body)}`)
  }
  const body = await response.json()
  if (!body.authToken) {
    throw new Error(`Login failed (status ${response.status}): ${JSON.stringify(body)}`)
  }
  return body.authToken
}

/**
 * Builds the multipart form data for an Arena survey zip import request.
 * @param {object} params - Function parameters.
 * @param {Buffer} params.zipBuffer - The survey zip file content.
 * @param {string} params.zipFileName - The file name to send for the zip part.
 * @param {string} params.surveyName - The unique name for the new survey.
 * @returns {FormData} The multipart form data ready to send as a fetch body.
 */
const buildImportFormData = ({ zipBuffer, zipFileName, surveyName }) => {
  const formData = new FormData()
  formData.append('survey', JSON.stringify({ name: surveyName, options: { includeData: false } }))
  formData.append('file', new Blob([zipBuffer], { type: 'application/zip' }), zipFileName)
  return formData
}

/**
 * Starts an Arena survey import job from a zip file.
 * @param {object} params - Function parameters.
 * @param {string} params.baseUrl - Arena server base URL.
 * @param {string} params.authToken - JWT auth token from login.
 * @param {Buffer} params.zipBuffer - The survey zip file content.
 * @param {string} params.zipFileName - The file name to send for the zip part.
 * @param {string} params.surveyName - The unique name for the new survey.
 * @param {Function} [params.fetchImpl] - Fetch implementation to use (defaults to the global fetch).
 * @returns {Promise<object>} The created job summary (includes uuid and status).
 */
const importSurveyZip = async ({ baseUrl, authToken, zipBuffer, zipFileName, surveyName, fetchImpl = fetch }) => {
  const formData = buildImportFormData({ zipBuffer, zipFileName, surveyName })
  const response = await fetchImpl(`${baseUrl}/api/survey/arena-import`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${authToken}` },
    body: formData,
  })
  if (!response.ok) {
    const body = await readBody(response)
    throw new Error(`Import request failed (status ${response.status}): ${JSON.stringify(body)}`)
  }
  const body = await response.json()
  if (!body.job || !body.job.uuid) {
    throw new Error(`Import request failed (status ${response.status}): ${JSON.stringify(body)}`)
  }
  return body.job
}

/**
 * Fetches the current status of a background job.
 * @param {object} params - Function parameters.
 * @param {string} params.baseUrl - Arena server base URL.
 * @param {string} params.authToken - JWT auth token from login.
 * @param {string} params.jobUuid - UUID of the job to fetch.
 * @param {Function} [params.fetchImpl] - Fetch implementation to use (defaults to the global fetch).
 * @returns {Promise<object>} The job summary.
 */
const getJobStatus = async ({ baseUrl, authToken, jobUuid, fetchImpl = fetch }) => {
  const response = await fetchImpl(`${baseUrl}/api/jobs/${jobUuid}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${authToken}` },
  })
  if (!response.ok) {
    const body = await readBody(response)
    throw new Error(`Job status request failed (status ${response.status}): ${JSON.stringify(body)}`)
  }
  return response.json()
}

/**
 * Deletes a survey.
 * @param {object} params - Function parameters.
 * @param {string} params.baseUrl - Arena server base URL.
 * @param {string} params.authToken - JWT auth token from login.
 * @param {number|string} params.surveyId - ID of the survey to delete.
 * @param {Function} [params.fetchImpl] - Fetch implementation to use (defaults to the global fetch).
 * @returns {Promise<void>} Resolves when the survey has been deleted.
 */
const deleteSurvey = async ({ baseUrl, authToken, surveyId, fetchImpl = fetch }) => {
  const response = await fetchImpl(`${baseUrl}/api/survey/${surveyId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${authToken}` },
  })
  if (!response.ok) {
    const body = await readBody(response)
    throw new Error(`Delete survey ${surveyId} failed (status ${response.status}): ${JSON.stringify(body)}`)
  }
}

/**
 * Creates a new user account. The caller must be a system admin.
 * @param {object} params - Function parameters.
 * @param {string} params.baseUrl - Arena server base URL.
 * @param {string} params.authToken - JWT auth token of a system admin user.
 * @param {string} params.name - Full name for the new user.
 * @param {string} params.email - Email address for the new user (must be unique).
 * @param {string} params.password - Password for the new user.
 * @param {Function} [params.fetchImpl] - Fetch implementation to use (defaults to the global fetch).
 * @returns {Promise<void>} Resolves when the user has been created.
 */
const createUser = async ({ baseUrl, authToken, name, email, password, fetchImpl = fetch }) => {
  const response = await fetchImpl(`${baseUrl}/api/user`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${authToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user: JSON.stringify({ name, email, password, props: { title: 'preferNotToSay' } }),
    }),
  })
  if (!response.ok) {
    const body = await readBody(response)
    throw new Error(`Create user ${email} failed (status ${response.status}): ${JSON.stringify(body)}`)
  }
}

module.exports = { login, buildImportFormData, importSurveyZip, getJobStatus, deleteSurvey, createUser }
```

Note: this step adds `createUser` (needed by Task 8) at the same time as the `readBody` fix, since it's the same file and the same "thin fetch wrapper" pattern as the other four functions — no separate task for it.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `node --test test/load/lib/httpApi.test.js`
Expected: PASS (14 tests: the original 9 plus the 5 new ones). `createUser` has no dedicated test yet — it's exercised by Task 8's tests via its use in `userProvisioning`/the orchestrator; that's acceptable since it's a straightforward instance of the same already-tested request/error pattern as the other four functions.

- [ ] **Step 5: Lint and commit**

```bash
npx eslint --cache --fix test/load/lib/httpApi.js test/load/lib/httpApi.test.js
git add test/load/lib/httpApi.js test/load/lib/httpApi.test.js
git commit -m "fix(load): read error response bodies safely, add createUser"
```

---

### Task 7: Fix job-result field extraction, null-summary crash, and poll-error handling in the orchestrator

**Files:**
- Modify: `test/load/surveyImportStressTest.js`
- Create: `test/load/surveyImportStressTest.test.js`

**Interfaces:**
- Consumes: `getJobStatus`, `importSurveyZip`, `deleteSurvey` from `./lib/httpApi` (Task 6, unchanged signatures).
- Produces (all now accept an optional injectable `fetchImpl`, defaulting to the global `fetch`, so this task's tests never touch the network):
  - `pollJobUntilTerminal({ baseUrl, authToken, jobUuid, timeoutMs, fetchImpl?, pollIntervalMs? }) -> Promise<object>` — **now never rejects.** Always resolves to a job-shaped object with a `.status` that is one of the real terminal statuses (`succeeded`/`failed`/`canceled`), `'timed-out'`, or `'rejected-at-http'` (after `MAX_CONSECUTIVE_POLL_ERRORS` consecutive `getJobStatus` failures). `.surveyId`/`.errors`/`.result` are backfilled from the last non-terminal read when the terminal read itself lacks them. A `null` read from `getJobStatus` (evicted/unknown job) no longer crashes the loop — it's treated like any other non-terminal read and polling continues.
  - `runSingleImport({ baseUrl, authToken, zipBuffer, zipFileName, surveyName, index, jobTimeoutMs, fetchImpl? }) -> Promise<ResultEntry>` — same result shape as before (see `report.js`), but the try/catch around the polling phase is removed since `pollJobUntilTerminal` is now total.
  - `cleanupSurveys({ baseUrl, authToken, results, fetchImpl? }) -> Promise<{ deletedCount: number, totalCount: number }>` — deletes surveys **sequentially** now (was: all at once via `Promise.allSettled` over every survey simultaneously), and returns/logs how many were actually deleted, so a regression back to "deletes nothing" is visible in the output instead of silent.

- [ ] **Step 1: Write the failing tests**

Create `test/load/surveyImportStressTest.test.js`:

```js
const test = require('node:test')
const assert = require('node:assert/strict')

const { runSingleImport, pollJobUntilTerminal, cleanupSurveys } = require('./surveyImportStressTest')

const jsonResponse = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

test('pollJobUntilTerminal carries surveyId forward from a non-terminal read when the terminal read lacks it', async () => {
  const responses = [
    jsonResponse({ uuid: 'job-1', status: 'running', surveyId: 42 }),
    jsonResponse({ uuid: 'job-1', status: 'succeeded' }),
  ]
  let call = 0
  const fetchImpl = async () => responses[call++]

  const job = await pollJobUntilTerminal({
    baseUrl: 'http://x',
    authToken: 'tok',
    jobUuid: 'job-1',
    timeoutMs: 5000,
    pollIntervalMs: 1,
    fetchImpl,
  })

  assert.equal(job.status, 'succeeded')
  assert.equal(job.surveyId, 42)
})

test('pollJobUntilTerminal tolerates a transient poll error and then succeeds', async () => {
  let call = 0
  const fetchImpl = async () => {
    call += 1
    if (call === 1) {
      throw new Error('ECONNRESET')
    }
    return jsonResponse({ uuid: 'job-1', status: 'succeeded', surveyId: 7 })
  }

  const job = await pollJobUntilTerminal({
    baseUrl: 'http://x',
    authToken: 'tok',
    jobUuid: 'job-1',
    timeoutMs: 5000,
    pollIntervalMs: 1,
    fetchImpl,
  })

  assert.equal(job.status, 'succeeded')
  assert.equal(job.surveyId, 7)
})

test('pollJobUntilTerminal gives up after too many consecutive poll errors, well before the timeout', async () => {
  const fetchImpl = async () => {
    throw new Error('ECONNRESET')
  }

  const job = await pollJobUntilTerminal({
    baseUrl: 'http://x',
    authToken: 'tok',
    jobUuid: 'job-1',
    timeoutMs: 60000,
    pollIntervalMs: 1,
    fetchImpl,
  })

  assert.equal(job.status, 'rejected-at-http')
  assert.match(job.error, /ECONNRESET/)
})

test('pollJobUntilTerminal times out when the job never reaches a terminal status', async () => {
  const fetchImpl = async () => jsonResponse({ uuid: 'job-1', status: 'running' })

  const job = await pollJobUntilTerminal({
    baseUrl: 'http://x',
    authToken: 'tok',
    jobUuid: 'job-1',
    timeoutMs: 0,
    pollIntervalMs: 1,
    fetchImpl,
  })

  assert.equal(job.status, 'timed-out')
})

test('pollJobUntilTerminal does not crash on a null job read and keeps polling', async () => {
  const responses = [jsonResponse(null), jsonResponse({ uuid: 'job-1', status: 'succeeded', surveyId: 9 })]
  let call = 0
  const fetchImpl = async () => responses[call++]

  const job = await pollJobUntilTerminal({
    baseUrl: 'http://x',
    authToken: 'tok',
    jobUuid: 'job-1',
    timeoutMs: 5000,
    pollIntervalMs: 1,
    fetchImpl,
  })

  assert.equal(job.status, 'succeeded')
  assert.equal(job.surveyId, 9)
})

test('runSingleImport returns rejected-at-http when the import request itself fails', async () => {
  const fetchImpl = async () => jsonResponse({ message: 'pool exhausted' }, 503)

  const result = await runSingleImport({
    baseUrl: 'http://x',
    authToken: 'tok',
    zipBuffer: Buffer.from('x'),
    zipFileName: 'x.zip',
    surveyName: 'stress_test_0',
    index: 0,
    jobTimeoutMs: 5000,
    fetchImpl,
  })

  assert.equal(result.outcome, 'rejected-at-http')
  assert.equal(result.surveyId, null)
  assert.equal(result.jobMs, null)
  assert.ok(result.acceptMs >= 0)
})

test('runSingleImport succeeds end-to-end and carries the surveyId through even though the terminal poll lacks it', async () => {
  const responses = [
    jsonResponse({ job: { uuid: 'job-1', status: 'pending' } }), // import accept
    jsonResponse({ uuid: 'job-1', status: 'running', surveyId: 99 }), // poll 1 (active)
    jsonResponse({ uuid: 'job-1', status: 'succeeded' }), // poll 2 (terminal, no surveyId)
  ]
  let call = 0
  const fetchImpl = async () => responses[call++]

  const result = await runSingleImport({
    baseUrl: 'http://x',
    authToken: 'tok',
    zipBuffer: Buffer.from('x'),
    zipFileName: 'x.zip',
    surveyName: 'stress_test_1',
    index: 1,
    jobTimeoutMs: 5000,
    fetchImpl,
  })

  assert.equal(result.outcome, 'succeeded')
  assert.equal(result.surveyId, 99)
})

test('cleanupSurveys deletes only entries with a surveyId and tolerates individual failures', async () => {
  const deleteCalls = []
  const fetchImpl = async (url, options) => {
    deleteCalls.push(url)
    if (url.endsWith('/api/survey/2')) {
      return new Response('nope', { status: 500 })
    }
    return new Response(null, { status: 200 })
  }

  const results = [
    { surveyId: 1 },
    { surveyId: null },
    { surveyId: 2 },
    { surveyId: 3 },
  ]

  const summary = await cleanupSurveys({ baseUrl: 'http://x', authToken: 'tok', results, fetchImpl })

  assert.equal(summary.totalCount, 3)
  assert.equal(summary.deletedCount, 2)
  assert.equal(deleteCalls.length, 3)
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --test test/load/surveyImportStressTest.test.js`
Expected: FAIL. Several ways: `pollJobUntilTerminal`/`runSingleImport`/`cleanupSurveys` don't yet accept `fetchImpl` (so tests hit the real network and hang/error), the null-job test throws `Cannot read properties of null`, the surveyId-carry-forward tests get `undefined` instead of the expected value, and `cleanupSurveys`'s return value doesn't have `deletedCount`/`totalCount` yet.

- [ ] **Step 3: Replace `test/load/surveyImportStressTest.js` with this exact content**

```js
/* eslint-disable no-console -- this file's entire purpose is CLI reporting */
require('dotenv').config()

const fs = require('node:fs')
const path = require('node:path')

const { parseConfig, HELP_TEXT } = require('./lib/config')
const { login, importSurveyZip, getJobStatus, deleteSurvey, createUser } = require('./lib/httpApi')
const { buildLoadTestUserCredentials } = require('./lib/userProvisioning')
const { formatSummary } = require('./lib/report')

const JOB_POLL_INTERVAL_MS = 1000
const MAX_CONSECUTIVE_POLL_ERRORS = 3
const TERMINAL_STATUSES = new Set(['succeeded', 'failed', 'canceled'])

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Polls a job until it reaches a terminal status, the timeout elapses, or too many consecutive poll
 * requests fail. Never rejects. surveyId/errors/result are backfilled from the last non-terminal read
 * when the terminal read itself lacks them (the server's terminal job-status response omits them).
 * @param {object} params - Function parameters.
 * @param {string} params.baseUrl - Arena server base URL.
 * @param {string} params.authToken - JWT auth token.
 * @param {string} params.jobUuid - UUID of the job to poll.
 * @param {number} params.timeoutMs - Max time to wait, in milliseconds.
 * @param {Function} [params.fetchImpl] - Fetch implementation to use (defaults to the global fetch).
 * @param {number} [params.pollIntervalMs] - Delay between polls, in milliseconds (defaults to 1000).
 * @returns {Promise<object>} The last known job summary; status is 'timed-out' or 'rejected-at-http' if polling didn't reach a terminal status.
 */
const pollJobUntilTerminal = async ({
  baseUrl,
  authToken,
  jobUuid,
  timeoutMs,
  fetchImpl = fetch,
  pollIntervalMs = JOB_POLL_INTERVAL_MS,
}) => {
  const startedAt = Date.now()
  let lastKnownSurveyId = null
  let lastKnownErrors = null
  let lastKnownResult = null
  let consecutivePollErrors = 0
  let lastPollError = null

  for (;;) {
    let job = null
    try {
      job = await getJobStatus({ baseUrl, authToken, jobUuid, fetchImpl })
      consecutivePollErrors = 0
    } catch (error) {
      consecutivePollErrors += 1
      lastPollError = error
      if (consecutivePollErrors > MAX_CONSECUTIVE_POLL_ERRORS) {
        return {
          status: 'rejected-at-http',
          surveyId: lastKnownSurveyId,
          errors: lastKnownErrors,
          result: lastKnownResult,
          error: lastPollError.message,
        }
      }
    }

    if (job && TERMINAL_STATUSES.has(job.status)) {
      return {
        ...job,
        surveyId: job.surveyId || lastKnownSurveyId,
        errors: job.errors || lastKnownErrors,
        result: job.result || lastKnownResult,
      }
    }
    if (job) {
      lastKnownSurveyId = job.surveyId || lastKnownSurveyId
      lastKnownErrors = job.errors || lastKnownErrors
      lastKnownResult = job.result || lastKnownResult
    }

    if (Date.now() - startedAt >= timeoutMs) {
      return {
        status: 'timed-out',
        surveyId: lastKnownSurveyId,
        errors: lastKnownErrors,
        result: lastKnownResult,
      }
    }
    await sleep(pollIntervalMs)
  }
}

/**
 * Runs one survey import request end-to-end (accept + poll to completion) and reports its outcome.
 * @param {object} params - Function parameters.
 * @param {string} params.baseUrl - Arena server base URL.
 * @param {string} params.authToken - JWT auth token.
 * @param {Buffer} params.zipBuffer - The survey zip file content.
 * @param {string} params.zipFileName - The file name to send for the zip part.
 * @param {string} params.surveyName - The unique name for the new survey.
 * @param {number} params.index - Index of this request within the run (for reporting).
 * @param {number} params.jobTimeoutMs - Max time to wait for the job to finish.
 * @param {Function} [params.fetchImpl] - Fetch implementation to use (defaults to the global fetch).
 * @returns {Promise<object>} A result entry (see report.js for the shape).
 */
const runSingleImport = async ({
  baseUrl,
  authToken,
  zipBuffer,
  zipFileName,
  surveyName,
  index,
  jobTimeoutMs,
  fetchImpl = fetch,
}) => {
  const acceptStartedAt = Date.now()
  let job
  try {
    job = await importSurveyZip({ baseUrl, authToken, zipBuffer, zipFileName, surveyName, fetchImpl })
  } catch (error) {
    return {
      index,
      name: surveyName,
      outcome: 'rejected-at-http',
      surveyId: null,
      acceptMs: Date.now() - acceptStartedAt,
      jobMs: null,
      error: error.message,
    }
  }
  const acceptMs = Date.now() - acceptStartedAt

  const jobStartedAt = Date.now()
  const finalJob = await pollJobUntilTerminal({
    baseUrl,
    authToken,
    jobUuid: job.uuid,
    timeoutMs: jobTimeoutMs,
    fetchImpl,
  })
  const jobMs = Date.now() - jobStartedAt

  const outcome = finalJob.status
  const error =
    outcome === 'succeeded'
      ? null
      : finalJob.error || JSON.stringify(finalJob.errors || finalJob.result || 'unknown error')

  return {
    index,
    name: surveyName,
    outcome,
    surveyId: finalJob.surveyId || null,
    acceptMs,
    jobMs,
    error,
  }
}

/**
 * Deletes every survey referenced by the given results, sequentially and best-effort.
 * @param {object} params - Function parameters.
 * @param {string} params.baseUrl - Arena server base URL.
 * @param {string} params.authToken - JWT auth token (a system admin token can delete any survey).
 * @param {Array<object>} params.results - Result entries produced by runSingleImport.
 * @param {Function} [params.fetchImpl] - Fetch implementation to use (defaults to the global fetch).
 * @returns {Promise<{deletedCount: number, totalCount: number}>} How many surveys were actually deleted.
 */
const cleanupSurveys = async ({ baseUrl, authToken, results, fetchImpl = fetch }) => {
  const surveyIds = results.map((result) => result.surveyId).filter(Boolean)
  let deletedCount = 0
  for (const surveyId of surveyIds) {
    try {
      await deleteSurvey({ baseUrl, authToken, surveyId, fetchImpl })
      deletedCount += 1
    } catch (error) {
      console.error(`Failed to delete survey ${surveyId}: ${error.message}`)
    }
  }
  return { deletedCount, totalCount: surveyIds.length }
}

/**
 * CLI entry point: parses config, runs the concurrent import burst, reports, and cleans up.
 * @returns {Promise<void>} Resolves when the run is complete; sets process.exitCode on failure.
 */
const main = async () => {
  let config
  try {
    config = parseConfig({ argv: process.argv.slice(2), env: process.env })
  } catch (error) {
    console.error(error.message)
    console.error(HELP_TEXT)
    process.exitCode = 1
    return
  }

  if (config.help) {
    console.log(HELP_TEXT)
    return
  }

  const { zipPath, url, email, password, count, jobTimeoutMs, keep } = config

  console.log(`Reading zip file: ${zipPath}`)
  const zipBuffer = fs.readFileSync(zipPath)
  const zipFileName = path.basename(zipPath)

  console.log(`Logging in as ${email} at ${url}...`)
  const authToken = await login({ baseUrl: url, email, password })

  const runId = Date.now()
  console.log(`Firing ${count} concurrent survey imports (run ${runId})...`)

  const startedAt = Date.now()
  const results = await Promise.all(
    Array.from({ length: count }, (_, i) =>
      runSingleImport({
        baseUrl: url,
        authToken,
        zipBuffer,
        zipFileName,
        surveyName: `stress_test_${runId}_${i}`,
        index: i,
        jobTimeoutMs,
      })
    )
  )
  const totalDurationMs = Date.now() - startedAt

  console.log(formatSummary({ results, totalDurationMs }))

  if (!keep) {
    console.log('Cleaning up created surveys...')
    const { deletedCount, totalCount } = await cleanupSurveys({ baseUrl: url, authToken, results })
    console.log(`Deleted ${deletedCount}/${totalCount} surveys created by this run.`)
  }

  const anyFailed = results.some((result) => result.outcome !== 'succeeded')
  process.exitCode = anyFailed ? 1 : 0
}

if (require.main === module) {
  main().catch((error) => {
    console.error('Stress test failed to run:', error)
    process.exitCode = 1
  })
}

module.exports = { main, runSingleImport, pollJobUntilTerminal, cleanupSurveys }
```

Note: this step deliberately does **not** yet wire in `createUser`/`buildLoadTestUserCredentials` inside `main()` — the `require` lines for them are added now (so the module resolves and `main()`'s shape is otherwise final) but `main()` itself still logs in once and uses one shared `authToken` for every import, exactly as before. Task 8 changes `main()` to provision and use N distinct users. Keeping this task scoped to "fix the bugs, thread fetchImpl through, make polling total" — without also changing `main()`'s user model in the same diff — keeps this task's diff reviewable on its own.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `node --test test/load/surveyImportStressTest.test.js`
Expected: PASS (8 tests).

- [ ] **Step 5: Re-run the Task 5 manual smoke checks, lint, and commit**

```bash
node test/load/surveyImportStressTest.js --help
node test/load/surveyImportStressTest.js
node -e "require('./test/load/surveyImportStressTest.js')"
node --test test/load/lib/*.test.js test/load/surveyImportStressTest.test.js
npx eslint --cache --fix test/load/surveyImportStressTest.js test/load/surveyImportStressTest.test.js
```

Expected: the three smoke checks behave exactly as in Task 5 (`--help` prints usage and exits 0; no args prints the missing-`--zip` error + help and exits 1; the bare `require()` produces no output of its own). The combined `node --test` run passes all lib tests (14, after Task 6) plus this file's 8 new tests. Eslint is clean.

```bash
git add test/load/surveyImportStressTest.js test/load/surveyImportStressTest.test.js
git commit -m "fix(load): make job polling total and thread fetchImpl through the orchestrator"
```

---

### Task 8: Provision N throwaway users instead of one shared login

**Files:**
- Create: `test/load/lib/userProvisioning.js`
- Create: `test/load/lib/userProvisioning.test.js`
- Modify: `test/load/surveyImportStressTest.js`

**Interfaces:**
- Consumes: `createUser`, `login` from `./lib/httpApi` (Task 6); `runSingleImport` from the same file (Task 7, unchanged signature — reused as-is, not modified by this task).
- Produces: `buildLoadTestUserCredentials({ runId, count }) -> Array<{name, email, password}>` (pure, deterministic — same `runId`+`count` always produces the same list, with emails `stress_test_<runId>_<i>@loadtest.local`). `main()`'s behavior changes: it now creates `count` throwaway users (as the configured admin account) and logs in as each before firing their imports, instead of using the admin's own token for every import.

- [ ] **Step 1: Write the failing tests**

Create `test/load/lib/userProvisioning.test.js`:

```js
const test = require('node:test')
const assert = require('node:assert/strict')

const { buildLoadTestUserCredentials } = require('./userProvisioning')

test('buildLoadTestUserCredentials returns the requested count', () => {
  const credentials = buildLoadTestUserCredentials({ runId: 123, count: 5 })
  assert.equal(credentials.length, 5)
})

test('buildLoadTestUserCredentials produces unique, deterministic emails per index', () => {
  const credentials = buildLoadTestUserCredentials({ runId: 123, count: 3 })
  const emails = credentials.map((c) => c.email)
  assert.deepEqual(emails, [
    'stress_test_123_0@loadtest.local',
    'stress_test_123_1@loadtest.local',
    'stress_test_123_2@loadtest.local',
  ])
})

test('buildLoadTestUserCredentials gives every user a name and a password at least 8 characters long', () => {
  const credentials = buildLoadTestUserCredentials({ runId: 999, count: 2 })
  credentials.forEach((c) => {
    assert.ok(c.name.length > 0)
    assert.ok(c.password.length >= 8)
  })
})

test('buildLoadTestUserCredentials returns an empty array for count 0', () => {
  assert.deepEqual(buildLoadTestUserCredentials({ runId: 1, count: 0 }), [])
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --test test/load/lib/userProvisioning.test.js`
Expected: FAIL — `Cannot find module './userProvisioning'`.

- [ ] **Step 3: Implement `test/load/lib/userProvisioning.js`**

```js
const LOAD_TEST_USER_PASSWORD = 'LoadTestUser1Aa!'
const LOAD_TEST_EMAIL_DOMAIN = 'loadtest.local'

/**
 * Builds deterministic credentials for N throwaway load-test users, unique to this run.
 * @param {object} params - Function parameters.
 * @param {number} params.runId - Unique identifier for this run (e.g. Date.now()).
 * @param {number} params.count - Number of user credential sets to build.
 * @returns {Array<{name: string, email: string, password: string}>} One credential set per user, in index order.
 */
const buildLoadTestUserCredentials = ({ runId, count }) =>
  Array.from({ length: count }, (_, i) => ({
    name: `Load Test User ${runId}_${i}`,
    email: `stress_test_${runId}_${i}@${LOAD_TEST_EMAIL_DOMAIN}`,
    password: LOAD_TEST_USER_PASSWORD,
  }))

module.exports = { buildLoadTestUserCredentials }
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `node --test test/load/lib/userProvisioning.test.js`
Expected: PASS (4 tests).

- [ ] **Step 5: Wire N distinct users into `main()`**

In `test/load/surveyImportStressTest.js`, add this new function after `runSingleImport` (before `cleanupSurveys`):

```js
/**
 * Creates one throwaway user, logs in as them, then runs their single survey import end-to-end.
 * If user creation or login fails, returns a rejected-at-http result without attempting the import.
 * @param {object} params - Function parameters.
 * @param {string} params.baseUrl - Arena server base URL.
 * @param {string} params.adminAuthToken - JWT auth token of the system admin used to create the user.
 * @param {{name: string, email: string, password: string}} params.credentials - Credentials for the throwaway user.
 * @param {Buffer} params.zipBuffer - The survey zip file content.
 * @param {string} params.zipFileName - The file name to send for the zip part.
 * @param {string} params.surveyName - The unique name for the new survey.
 * @param {number} params.index - Index of this request within the run (for reporting).
 * @param {number} params.jobTimeoutMs - Max time to wait for the job to finish.
 * @param {Function} [params.fetchImpl] - Fetch implementation to use (defaults to the global fetch).
 * @returns {Promise<object>} A result entry (see report.js for the shape).
 */
const runSingleUserImport = async ({
  baseUrl,
  adminAuthToken,
  credentials,
  zipBuffer,
  zipFileName,
  surveyName,
  index,
  jobTimeoutMs,
  fetchImpl = fetch,
}) => {
  const setupStartedAt = Date.now()
  let userAuthToken
  try {
    await createUser({ baseUrl, authToken: adminAuthToken, ...credentials, fetchImpl })
    userAuthToken = await login({ baseUrl, email: credentials.email, password: credentials.password, fetchImpl })
  } catch (error) {
    return {
      index,
      name: surveyName,
      outcome: 'rejected-at-http',
      surveyId: null,
      acceptMs: Date.now() - setupStartedAt,
      jobMs: null,
      error: `user setup failed: ${error.message}`,
    }
  }

  return runSingleImport({
    baseUrl,
    authToken: userAuthToken,
    zipBuffer,
    zipFileName,
    surveyName,
    index,
    jobTimeoutMs,
    fetchImpl,
  })
}
```

Then replace the body of `main()` from the `Logging in as ${email}` line through the `results`/`totalDurationMs` computation with:

```js
  console.log(`Logging in as ${email} at ${url}...`)
  const adminAuthToken = await login({ baseUrl: url, email, password })

  const runId = Date.now()
  const credentialsList = buildLoadTestUserCredentials({ runId, count })
  console.log(`Provisioning ${count} throwaway load-test users and firing ${count} concurrent survey imports (run ${runId})...`)

  const startedAt = Date.now()
  const settled = await Promise.allSettled(
    credentialsList.map((credentials, i) =>
      runSingleUserImport({
        baseUrl: url,
        adminAuthToken,
        credentials,
        zipBuffer,
        zipFileName,
        surveyName: `stress_test_${runId}_${i}`,
        index: i,
        jobTimeoutMs,
      })
    )
  )
  const results = settled.map((settledResult, i) =>
    settledResult.status === 'fulfilled'
      ? settledResult.value
      : {
          index: i,
          name: `stress_test_${runId}_${i}`,
          outcome: 'rejected-at-http',
          surveyId: null,
          acceptMs: null,
          jobMs: null,
          error: settledResult.reason?.message || String(settledResult.reason),
        }
  )
  const totalDurationMs = Date.now() - startedAt
```

And change the `cleanupSurveys` call site to use `adminAuthToken` (the variable was renamed from `authToken`):

```js
  if (!keep) {
    console.log('Cleaning up created surveys...')
    const { deletedCount, totalCount } = await cleanupSurveys({ baseUrl: url, authToken: adminAuthToken, results })
    console.log(`Deleted ${deletedCount}/${totalCount} surveys created by this run.`)
    console.log(
      'Note: the throwaway user accounts created by this run (stress_test_*@loadtest.local) cannot be deleted via the API and remain in the database.'
    )
  }
```

Also update the two `require` lines at the top of the file:
- `const { login, importSurveyZip, getJobStatus, deleteSurvey, createUser } = require('./lib/httpApi')` (adds `createUser` — already present from Task 7's Step 3, no change needed here if it's already there)
- add `const { buildLoadTestUserCredentials } = require('./lib/userProvisioning')` (already added in Task 7's Step 3 per its note above — verify it's there; add it if not)

And update `module.exports` at the bottom to also export `runSingleUserImport`:

```js
module.exports = { main, runSingleImport, runSingleUserImport, pollJobUntilTerminal, cleanupSurveys }
```

- [ ] **Step 6: Write and run a test for `runSingleUserImport`**

Add to `test/load/surveyImportStressTest.test.js` (update the top `require` line to also pull in `runSingleUserImport`):

```js
const { runSingleImport, runSingleUserImport, pollJobUntilTerminal, cleanupSurveys } = require('./surveyImportStressTest')
```

```js
test('runSingleUserImport creates the user, logs in as them, then imports', async () => {
  const calls = []
  const responses = [
    new Response(null, { status: 200 }), // POST /api/user
    jsonResponse({ authToken: 'user-tok' }), // POST /auth/login (as the new user)
    jsonResponse({ job: { uuid: 'job-1', status: 'pending' } }), // import accept
    jsonResponse({ uuid: 'job-1', status: 'succeeded', surveyId: 55 }), // poll (terminal, this server response does include surveyId)
  ]
  let call = 0
  const fetchImpl = async (url, options) => {
    calls.push({ url, options })
    return responses[call++]
  }

  const result = await runSingleUserImport({
    baseUrl: 'http://x',
    adminAuthToken: 'admin-tok',
    credentials: { name: 'Load Test User 1', email: 'stress_test_1_0@loadtest.local', password: 'LoadTestUser1Aa!' },
    zipBuffer: Buffer.from('x'),
    zipFileName: 'x.zip',
    surveyName: 'stress_test_1_0',
    index: 0,
    jobTimeoutMs: 5000,
  })

  assert.equal(result.outcome, 'succeeded')
  assert.equal(result.surveyId, 55)
  assert.equal(calls[0].url, 'http://x/api/user')
  assert.equal(calls[0].options.headers.Authorization, 'Bearer admin-tok')
  assert.equal(calls[1].url, 'http://x/auth/login')
})

test('runSingleUserImport returns rejected-at-http when user creation fails, without attempting login or import', async () => {
  const fetchImpl = async () => new Response('quota exceeded', { status: 403 })

  const result = await runSingleUserImport({
    baseUrl: 'http://x',
    adminAuthToken: 'admin-tok',
    credentials: { name: 'Load Test User 2', email: 'stress_test_1_1@loadtest.local', password: 'LoadTestUser1Aa!' },
    zipBuffer: Buffer.from('x'),
    zipFileName: 'x.zip',
    surveyName: 'stress_test_1_1',
    index: 1,
    jobTimeoutMs: 5000,
  })

  assert.equal(result.outcome, 'rejected-at-http')
  assert.match(result.error, /user setup failed/)
})
```

Both new tests above must pass `fetchImpl` in their call to `runSingleUserImport` (add `fetchImpl,` to each test's call-site object) — `runSingleUserImport` (Step 5) already accepts and threads it through.

Run: `node --test test/load/lib/userProvisioning.test.js test/load/surveyImportStressTest.test.js`
Expected: PASS (4 + 10 = 14 tests).

- [ ] **Step 7: Re-run the Task 5 manual smoke checks, the full lib+orchestrator test suite, and lint**

```bash
node test/load/surveyImportStressTest.js --help
node test/load/surveyImportStressTest.js
node -e "require('./test/load/surveyImportStressTest.js')"
node --test test/load/lib/*.test.js test/load/surveyImportStressTest.test.js
npx eslint --cache --fix test/load/lib/userProvisioning.js test/load/lib/userProvisioning.test.js test/load/surveyImportStressTest.js test/load/surveyImportStressTest.test.js
```

Expected: smoke checks unchanged from Task 5; combined test run passes all tests (stats 5 + config 9 + report 4 + httpApi 14 + userProvisioning 4 = 36 lib tests, plus 10 orchestrator tests = 46 total); eslint clean.

- [ ] **Step 8: Commit**

```bash
git add test/load/lib/userProvisioning.js test/load/lib/userProvisioning.test.js test/load/surveyImportStressTest.js test/load/surveyImportStressTest.test.js
git commit -m "feat(load): provision N throwaway users instead of one shared login"
```

---

## Manual End-to-End Verification (after Task 8, not automated)

This step needs a running Arena server and a real Arena survey export zip, neither of which this plan can provide on its own. Once both are available:

1. Start the dev server: `yarn watch` (or `yarn dev:server`), confirm it's up at `http://localhost:9090`.
2. Confirm the configured login (`ADMIN_EMAIL`/`ADMIN_PASSWORD` in `.env`, or `--email`/`--password`) is a **system admin** account — required both for the original single-survey-creation path and now for `POST /api/user` (Task 8).
3. Get a sample zip: export any existing survey as an Arena backup (`GET /survey/:surveyId/export` from the UI, or via the API) — any valid Arena survey zip works, since the script always uses a fresh unique survey name.
4. Run: `yarn test:load -- --zip /path/to/survey.zip --count 50` (or `node test/load/surveyImportStressTest.js --zip ... --count 50`).
5. Confirm: the summary report prints with real (non-"unknown error") detail for any failures, the "Deleted N/M surveys" line shows a real non-zero count matching the number of successful+partially-completed imports, the exit code is 0 when all 50 succeed, and (unless `--keep` was passed) the created `stress_test_*` surveys are gone from the survey list afterward.
6. Expect the run to take noticeably longer than "50 requests in parallel" would suggest — the server's job queue (see the spec's Addendum) processes survey-creation/import jobs one at a time globally, so the 50 imports queue and drain sequentially even though all 50 requests were fired at once. This is expected, not a bug.
7. Known limitation, not a defect: the 50 throwaway user accounts (`stress_test_*@loadtest.local`) this run creates are **not** deleted — there is no user-delete HTTP endpoint. They accumulate across repeated runs; a DB admin can purge them periodically (`DELETE FROM "user" WHERE email LIKE 'stress_test_%@loadtest.local'`, plus their `auth_group_user` rows).
8. If failures appear, the report's per-failure error detail (HTTP status/body or job error) should point at whether it's the same DB-pool/lock symptom the branch's commits fixed, or something else.
