# Surveys List Export DB Size Columns Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `dbSize` (main `survey_<id>` schema) and `dbDataSize` (`survey_<id>_data` RDB schema) byte-count columns to the surveys list export, computed only for that export — not for any other caller of `SurveyManager.fetchUserSurveysInfo`.

**Architecture:** A new opt-in `includeDbSize` boolean parameter threads through `fetchUserSurveysInfo` → `_fetchSurveysWithCounts` → `_fetchSurveyWithCounts` in `server/modules/survey/manager/surveyManager.js`, defaulting to `false` everywhere. When `true`, `_fetchSurveyWithCounts` computes the two sizes via the existing `DbUtils.fetchSchemaTablesSize` utility (already used by the single-survey storage dashboard) and merges them into its result, inside the same try/catch that already guards the other per-survey counts. `SurveysListExportJob` is the only caller that opts in, and lists the two new field names in its export columns.

**Tech Stack:** Node.js, pg-promise, Jest (integration tests against a real Postgres test database).

## Global Constraints

- `includeDbSize` defaults to `false`; every existing caller of `fetchUserSurveysInfo` (survey list UI, etc.) must see zero behavior change.
- Reuse `DbUtils.fetchSchemaTablesSize` (`server/db/dbUtils.js:221`) and `Schemata.getSchemaSurvey` / `Schemata.getSchemaSurveyRdb` (from `@openforis/arena-server`) — do not write new SQL.
- Field names: `dbSize` (main schema), `dbDataSize` (RDB/data schema). Exported as raw byte counts (no human-readable formatting), consistent with the existing `filesSize` column.
- A missing schema (e.g. RDB schema on an unpublished survey) must resolve to `0`, not throw — this is already `fetchSchemaTablesSize`'s behavior, not something to add.

---

### Task 1: Add `includeDbSize` to `SurveyManager.fetchUserSurveysInfo`

**Files:**
- Modify: `server/modules/survey/manager/surveyManager.js:1-44` (imports), `:394-430` (`_fetchSurveyWithCounts` / `_fetchSurveysWithCounts`), `:432-477` (`fetchUserSurveysInfo`)
- Modify: `test/integration/tests/_survey/surveyTest.js` (new test function)
- Modify: `test/integration/tests/001surveyIntegrationtest.js` (register the new test)

**Interfaces:**
- Produces: `SurveyManager.fetchUserSurveysInfo({ ..., includeDbSize: boolean })` — when `includeDbSize: true` and `includeCounts: true`, each returned survey item gains `dbSize: number` (bytes, main schema) and `dbDataSize: number` (bytes, RDB schema). When `includeDbSize` is omitted/`false`, returned items have neither key (same as today). `includeDbSize` has no effect when `includeCounts: false` (the counts/db-size computation path is skipped entirely in that case, unchanged from today).

- [ ] **Step 1: Write the failing integration test**

Add to `test/integration/tests/_survey/surveyTest.js` (after `importSurveysConcurrentlyTest`):

```js
export const fetchUserSurveysInfoDbSizeTest = async () => {
  const user = getContextUser()

  const surveyName = `do_not_use__test_survey_dbsize_${uuidv4()}`
  const surveyInfoTest = Survey.newSurvey({
    ownerUuid: User.getUuid(user),
    name: surveyName,
    label: 'DO NOT USE! Test Survey (db size)',
    languages: ['en'],
  })
  const survey = await SurveyManager.insertSurvey({ user, surveyInfo: surveyInfoTest })
  const surveyId = Survey.getId(survey)

  try {
    const [itemWithDbSize] = await SurveyManager.fetchUserSurveysInfo({
      user,
      draft: true,
      search: surveyName,
      onlyOwn: true,
      includeCounts: true,
      includeDbSize: true,
    })

    expect(itemWithDbSize).toBeDefined()
    expect(typeof itemWithDbSize.dbSize).toBe('number')
    expect(itemWithDbSize.dbSize).toBeGreaterThanOrEqual(0)
    // RDB/data schema isn't created until the survey is published, so it should resolve to 0, not throw.
    expect(itemWithDbSize.dbDataSize).toBe(0)

    const [itemWithoutDbSize] = await SurveyManager.fetchUserSurveysInfo({
      user,
      draft: true,
      search: surveyName,
      onlyOwn: true,
      includeCounts: true,
    })

    expect(itemWithoutDbSize).toBeDefined()
    expect(itemWithoutDbSize.dbSize).toBeUndefined()
    expect(itemWithoutDbSize.dbDataSize).toBeUndefined()
  } finally {
    await SurveyManager.deleteSurvey(surveyId)
  }
}
```

Register it in `test/integration/tests/001surveyIntegrationtest.js`:

```js
import * as SurveyIntegrationTest from './_survey/surveyTest'
```
(already imported) — add inside the `describe('Survey Test', ...)` block, after the `'Import Surveys Concurrently'` test:

```js
  test('Fetch User Surveys Info - DB Size', async () => SurveyIntegrationTest.fetchUserSurveysInfoDbSizeTest())
```

- [ ] **Step 2: Run the test to verify it fails**

Integration tests are bundled via webpack before Jest runs them (`yarn test:integration` = `run-s build:test:integration jest:integration`, per `package.json`). Build once, then filter by test name to run just the new test:

Run: `yarn build:test:integration && npx jest dist/__tests__/bundle.integration.js -t "Fetch User Surveys Info - DB Size"`
Expected: FAIL on `itemWithDbSize.dbSize` being `undefined` (`fetchUserSurveysInfo` doesn't accept/apply `includeDbSize` yet), since `typeof undefined === 'undefined' !== 'number'`.

- [ ] **Step 3: Add imports**

In `server/modules/survey/manager/surveyManager.js`, line 5, change:

```js
import { DBMigrator } from '@openforis/arena-server'
```

to:

```js
import { DBMigrator, Schemata } from '@openforis/arena-server'
```

Add a new import line after line 22 (`import { db } from '@server/db/db'`):

```js
import * as DbUtils from '@server/db/dbUtils'
```

- [ ] **Step 4: Thread `includeDbSize` through `_fetchSurveyWithCounts` and `_fetchSurveysWithCounts`**

Replace the existing `_fetchSurveyWithCounts` (around line 394-418):

```js
const _fetchSurveyWithCounts = async ({ survey, draft, includeDbSize = false }) => {
  const surveyId = Survey.getId(survey)
  const surveyWithCounts = {
    ...survey,
    cycles: Survey.getCycleKeys(survey).length,
    languages: Survey.getLanguages(survey).join('|'),
  }
  try {
    const canHaveData = Survey.canHaveData(survey)
    const { count: filesCount, total: filesSize } = await SurveyFileManager.fetchCountAndTotalFilesSize({ surveyId })

    Object.assign(surveyWithCounts, {
      nodeDefsCount: await NodeDefRepository.countNodeDefsBySurveyId({ surveyId, draft }),
      recordsCount: canHaveData ? await RecordRepository.countRecordsBySurveyId({ surveyId }) : 0,
      recordsCountByApp: canHaveData ? await RecordRepository.countRecordsGroupedByApp({ surveyId }) : {},
      chainsCount: await ChainRepository.countChains({ surveyId }),
      filesCount,
      filesSize,
      filesMissing: await calculateFilesMissing({ surveyId, draft }),
    })

    if (includeDbSize) {
      Object.assign(surveyWithCounts, {
        dbSize: await DbUtils.fetchSchemaTablesSize({ schema: Schemata.getSchemaSurvey(surveyId) }),
        dbDataSize: await DbUtils.fetchSchemaTablesSize({ schema: Schemata.getSchemaSurveyRdb(surveyId) }),
      })
    }
  } catch (error) {
    Logger.error(`fetchUserSurveysInfo: error fetching counts for survey ${surveyId}: ${error}`)
  }
  return surveyWithCounts
}
```

Replace the existing `_fetchSurveysWithCounts` (around line 420-430):

```js
const _fetchSurveysWithCounts = async ({ surveys, draft, includeDbSize, onProgress, stopIfFunction }) => {
  const surveysWithCounts = []
  for (const survey of surveys) {
    if (stopIfFunction?.()) {
      break
    }
    surveysWithCounts.push(await _fetchSurveyWithCounts({ survey, draft, includeDbSize }))
    onProgress?.({ total: surveys.length, processed: surveysWithCounts.length })
  }
  return surveysWithCounts
}
```

- [ ] **Step 5: Add `includeDbSize` parameter to `fetchUserSurveysInfo` and pass it through**

In `fetchUserSurveysInfo` (around line 432-477), add `includeDbSize = false` to the destructured params, right after `includeCounts = false`:

```js
export const fetchUserSurveysInfo = async ({
  user,
  draft = true,
  template = false,
  offset,
  limit,
  lang,
  search,
  sortBy,
  sortOrder,
  includeCounts = false,
  includeDbSize = false,
  includeOwnerEmailAddress = false,
  onlyOwn = false,
  withChains = false,
  onProgress = null,
  stopIfFunction = null,
}) => {
```

And change the final return (around line 473-476) from:

```js
  if (!includeCounts) {
    return surveys
  }
  return _fetchSurveysWithCounts({ surveys, draft, onProgress, stopIfFunction })
```

to:

```js
  if (!includeCounts) {
    return surveys
  }
  return _fetchSurveysWithCounts({ surveys, draft, includeDbSize, onProgress, stopIfFunction })
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `yarn build:test:integration && npx jest dist/__tests__/bundle.integration.js -t "Fetch User Surveys Info - DB Size"` (same invocation as Step 2, rebuilt to pick up the code changes)
Expected: PASS — `itemWithDbSize.dbSize`/`dbDataSize` are numbers (`dbDataSize` is `0`), `itemWithoutDbSize.dbSize`/`dbDataSize` are `undefined`.

Then run the full integration suite once to confirm nothing else regressed: `yarn test:integration`.

- [ ] **Step 7: Lint**

Run: `npx eslint --cache --fix server/modules/survey/manager/surveyManager.js test/integration/tests/_survey/surveyTest.js test/integration/tests/001surveyIntegrationtest.js`
Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add server/modules/survey/manager/surveyManager.js test/integration/tests/_survey/surveyTest.js test/integration/tests/001surveyIntegrationtest.js
git commit -m "feat: add opt-in includeDbSize option to SurveyManager.fetchUserSurveysInfo"
```

---

### Task 2: Export `dbSize`/`dbDataSize` columns from `SurveysListExportJob`

**Files:**
- Modify: `server/modules/survey/service/SurveysListExportJob.js`

**Interfaces:**
- Consumes: `SurveyManager.fetchUserSurveysInfo({ ..., includeDbSize: boolean })` from Task 1 — passing `includeDbSize: true` adds numeric `dbSize`/`dbDataSize` keys to each item.

- [ ] **Step 1: Pass `includeDbSize: true` and add the two fields**

In `server/modules/survey/service/SurveysListExportJob.js`, change the `SurveyManager.fetchUserSurveysInfo` call:

```js
    const items = await SurveyManager.fetchUserSurveysInfo({
      user,
      draft,
      template,
      includeCounts: true,
      includeDbSize: true,
      includeOwnerEmailAddress: true,
      onProgress: ({ total, processed }) => {
        this.total = total
        this.processed = processed
      },
      stopIfFunction: () => this.isCanceled(),
    })
```

And change the `fields` array to add `'dbSize'` and `'dbDataSize'` next to `'filesSize'`:

```js
    const fields = [
      'id',
      'uuid',
      'name',
      'label',
      'status',
      'dateCreated',
      'dateModified',
      'datePublished',
      'cycles',
      'languages',
      'ownerName',
      'ownerEmail',
      'nodeDefsCount',
      'recordsCount',
      'chainsCount',
      'filesCount',
      'filesSize',
      'dbSize',
      'dbDataSize',
      'filesMissing',
    ]
```

- [ ] **Step 2: Lint**

Run: `npx eslint --cache --fix server/modules/survey/service/SurveysListExportJob.js`
Expected: no errors.

- [ ] **Step 3: Manual verification**

This job runs inside a real export flow (background job → file writer → download), which isn't exercised by the unit/integration suites (see the design spec's Testing section). Verify manually, with a local dev server running (`yarn watch`) and at least one published survey with some data:

1. Trigger the surveys list export from the UI (Home → surveys list export action).
2. Open the resulting file and confirm it has `dbSize` and `dbDataSize` columns with plausible non-negative byte counts, larger than 0 for a survey with data.
3. Confirm every other existing column (counts, dates, etc.) still looks correct — i.e. this change didn't disturb column order/values for the pre-existing fields.

- [ ] **Step 4: Commit**

```bash
git add server/modules/survey/service/SurveysListExportJob.js
git commit -m "feat: export dbSize/dbDataSize columns in surveys list export"
```
