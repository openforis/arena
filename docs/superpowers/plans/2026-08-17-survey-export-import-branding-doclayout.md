# Export/Import Survey Branding & Doc-Layout Images Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make survey backup export/import and survey cloning correctly carry branding logo/landing-background images and survey doc-layout header/footer images, matching how `preloadedMapLayer` files already round-trip today.

**Architecture:** Generalize the existing `SurveyFilesExportJob`/`SurveyFilesImportJob` pair — currently hardcoded to `SurveyFileType.preloadedMapLayer` — to also cover `surveyDocImage` and the four branding file types. Export loops `fetchFileSummariesByType` over all these types instead of one. Import concatenates three sources of file summaries (`Survey.getPreloadedMapLayers`, `Survey.getSurveyDocImages`, and a new `SurveyBranding.getBrandingFileSummaries` core helper) and runs them through the existing per-file fetch/persist loop unchanged.

**Tech Stack:** Node.js, Express, PostgreSQL (pg-promise), Jest (unit + integration, webpack-bundled), TypeScript (`core/`) + JavaScript (`server/`).

## Global Constraints

- Zip layout unchanged: reuse `ExportFile.surveyFile({ fileUuid })` (`surveyfiles/<uuid>.bin`) for all survey-level file types — no new zip directories.
- Missing-content handling on import is unchanged: `skipMissingFiles` true → warn + skip; false → throw. This must keep working for old export zips that predate this change.
- Applies uniformly to backup export/import and survey cloning — no new flag; `SurveyFilesExportJob`/`SurveyFilesImportJob` are already shared unconditionally by both flows.
- Branding file summaries built from survey props (not the DB `file` table) must carry an explicit `props.type` — `SurveyFile.getType` defaults to `SurveyFileType.recordAttachment` when `type` is missing, so omitting it would misfile branding images.
- Follow this repo's existing conventions: path aliases (`@core/*`, `@server/*`), JSDoc on exported functions in touched files, `log4js`-style job logging already in place (no `console.*`).

---

### Task 1: `SurveyBranding.getBrandingFileSummaries` core helper

**Files:**
- Modify: `core/survey/surveyBranding.ts`
- Test: `test/unit/tests/036surveyBranding.test.js`

**Interfaces:**
- Produces: `SurveyBranding.getBrandingFileSummaries(branding: SurveyBranding = {}): BrandingFileSummary[]` where `BrandingFileSummary = { uuid: string; props: { type: string; size: number } }`. Consumed by Task 2's `SurveyFilesImportJob` change.

- [ ] **Step 1: Write the failing unit tests**

Add this `describe` block to the end of `test/unit/tests/036surveyBranding.test.js`, just before the file's final closing `})`:

```js
  describe('getBrandingFileSummaries', () => {
    it('returns a summary for every populated logo/background slot', () => {
      const branding = {
        surveyLogo1: { fileUuid: 'uuid-logo-1' },
        surveyLogo2: { fileUuid: 'uuid-logo-2' },
        surveyLogo3: { fileUuid: 'uuid-logo-3' },
        landingBackground: { fileUuid: 'uuid-bg' },
      }
      expect(SurveyBranding.getBrandingFileSummaries(branding)).toEqual([
        { uuid: 'uuid-logo-1', props: { type: 'brandingSurveyLogo1', size: 0 } },
        { uuid: 'uuid-logo-2', props: { type: 'brandingSurveyLogo2', size: 0 } },
        { uuid: 'uuid-logo-3', props: { type: 'brandingSurveyLogo3', size: 0 } },
        { uuid: 'uuid-bg', props: { type: 'brandingLandingBackground', size: 0 } },
      ])
    })

    it('skips slots without a fileUuid', () => {
      const branding = { surveyLogo2: { fileUuid: 'uuid-logo-2' } }
      expect(SurveyBranding.getBrandingFileSummaries(branding)).toEqual([
        { uuid: 'uuid-logo-2', props: { type: 'brandingSurveyLogo2', size: 0 } },
      ])
    })

    it('returns an empty array for empty branding', () => {
      expect(SurveyBranding.getBrandingFileSummaries({})).toEqual([])
      expect(SurveyBranding.getBrandingFileSummaries()).toEqual([])
    })
  })
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `yarn build:test:unit && jest dist/__tests__/bundle.unit.js -t "getBrandingFileSummaries"`
Expected: FAIL with `SurveyBranding.getBrandingFileSummaries is not a function`

- [ ] **Step 3: Implement the helper**

In `core/survey/surveyBranding.ts`, add the import at the top of the file (alongside the existing `import * as ObjectUtils from '@core/objectUtils'`):

```ts
import * as SurveyFile from '@core/survey/surveyFile'
```

Then add this after the existing `imageDescriptorKeys` constant (currently at line 50: `const imageDescriptorKeys = [...surveyLogoKeys, keys.landingBackground] as const`):

```ts
const brandingImageFileTypeByKey: Record<(typeof imageDescriptorKeys)[number], string> = {
  [keys.surveyLogo1]: SurveyFile.SurveyFileType.brandingSurveyLogo1,
  [keys.surveyLogo2]: SurveyFile.SurveyFileType.brandingSurveyLogo2,
  [keys.surveyLogo3]: SurveyFile.SurveyFileType.brandingSurveyLogo3,
  [keys.landingBackground]: SurveyFile.SurveyFileType.brandingLandingBackground,
}

export type BrandingFileSummary = {
  uuid: string
  props: { type: string; size: number }
}
```

Then add this exported function after `getBrandingFileUuids` (the last function in the file):

```ts
/**
 * Returns minimal file summaries ({ uuid, props: { type, size } }) for every branding image
 * descriptor that has a fileUuid, keyed by the SurveyFileType matching its branding slot.
 * Used by survey export/import to restore branding image file content.
 */
export const getBrandingFileSummaries = (branding: SurveyBranding = {}): BrandingFileSummary[] => {
  const summaries: BrandingFileSummary[] = []
  for (const imageKey of imageDescriptorKeys) {
    const fileUuid = branding?.[imageKey]?.[keys.fileUuid]
    if (typeof fileUuid === 'string' && fileUuid.length > 0) {
      summaries.push({ uuid: fileUuid, props: { type: brandingImageFileTypeByKey[imageKey], size: 0 } })
    }
  }
  return summaries
}
```

(`size: 0` is explicit rather than omitted: `FileImportBaseJob.checkFilesNotExceedingAvailableQuota` sums `SurveyFile.getSize(fileSummary)` across all files being imported in one pass — an `undefined` size would turn that sum into `NaN` and silently defeat the quota check for every file in the same import, not just the branding one.)

- [ ] **Step 4: Run the tests to verify they pass**

Run: `yarn build:test:unit && jest dist/__tests__/bundle.unit.js -t "getBrandingFileSummaries"`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add core/survey/surveyBranding.ts test/unit/tests/036surveyBranding.test.js
git commit -m "Add SurveyBranding.getBrandingFileSummaries core helper"
```

---

### Task 2: Generalize `SurveyFilesExportJob`/`SurveyFilesImportJob` + round-trip integration test

**Files:**
- Modify: `server/modules/survey/service/surveyExport/jobs/surveyFilesExportJob.js`
- Modify: `server/modules/arenaImport/service/arenaImport/jobs/surveyFilesImportJob.js`
- Test: `test/integration/tests/013surveyFilesExportImportTest.js` (new)

**Interfaces:**
- Consumes: `SurveyBranding.getBrandingFileSummaries(branding)` from Task 1.
- Produces: no new exports; behavior change only. Later tasks add more `test()` blocks to the same integration test file.

- [ ] **Step 1: Write the failing integration test**

Create `test/integration/tests/013surveyFilesExportImportTest.js`:

```js
import { uuidv4 } from '@core/uuid'
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as SurveyFile from '@core/survey/surveyFile'

import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as SurveyFileService from '@server/modules/survey/service/surveyFileService'
import SurveyExportJob from '@server/modules/survey/service/surveyExport/surveyExportJob'
import ArenaImportJob from '@server/modules/arenaImport/service/arenaImport/arenaImportJob'
import SurveyCloneJob from '@server/modules/survey/service/clone/surveyCloneJob'

import * as SB from '../../utils/surveyBuilder'

import { getContextUser } from '../config/context'

describe('Survey files export/import - branding and doc-layout images', () => {
  let sourceSurveyId
  let logoFileUuid
  let logoContent
  let headerFileUuid
  let headerContent
  const createdSurveyIds = []

  beforeAll(async () => {
    const user = getContextUser()

    const sourceSurvey = await SB.survey(
      user,
      SB.entity('root_entity', SB.attribute('id', NodeDef.nodeDefType.integer).key())
    ).buildAndStore()
    sourceSurveyId = Survey.getId(sourceSurvey)

    logoFileUuid = uuidv4()
    logoContent = Buffer.from('fake-logo-content')
    await SurveyFileService.insertFile(
      sourceSurveyId,
      SurveyFile.createFile({
        uuid: logoFileUuid,
        name: 'logo1.png',
        size: logoContent.length,
        content: logoContent,
        type: SurveyFile.SurveyFileType.brandingSurveyLogo1,
      })
    )
    await SurveyManager.updateSurveyProp(user, sourceSurveyId, 'branding', {
      surveyLogo1: { fileUuid: logoFileUuid },
    })

    headerFileUuid = uuidv4()
    headerContent = Buffer.from('fake-header-content')
    await SurveyFileService.insertFile(
      sourceSurveyId,
      SurveyFile.createFile({
        uuid: headerFileUuid,
        name: 'header.png',
        size: headerContent.length,
        content: headerContent,
        type: SurveyFile.SurveyFileType.surveyDocImage,
      })
    )
    await SurveyManager.updateSurveyProp(user, sourceSurveyId, 'surveyDocImages', [
      {
        uuid: headerFileUuid,
        props: {
          type: SurveyFile.SurveyFileType.surveyDocImage,
          name: 'header.png',
          size: headerContent.length,
          labels: { en: 'Header' },
          documentPlace: 'header',
        },
      },
    ])
  })

  afterAll(async () => {
    for (const surveyId of createdSurveyIds) {
      await SurveyManager.deleteSurvey(surveyId)
    }
    if (sourceSurveyId) await SurveyManager.deleteSurvey(sourceSurveyId)
  })

  test('branding logo and doc header image content survive backup export/import', async () => {
    const user = getContextUser()

    const exportJob = new SurveyExportJob({ surveyId: sourceSurveyId, user, backup: true })
    await exportJob.start()
    expect(exportJob.isSucceeded()).toBe(true)

    const { filePath } = exportJob.context

    const importJob = new ArenaImportJob({ filePath, user })
    await importJob.start()
    expect(importJob.isSucceeded()).toBe(true)

    const { surveyId: importedSurveyId } = importJob.result
    createdSurveyIds.push(importedSurveyId)

    const importedLogoContent = await SurveyFileService.fetchFileContentAsBuffer({
      surveyId: importedSurveyId,
      fileUuid: logoFileUuid,
    })
    expect(Buffer.compare(importedLogoContent, logoContent)).toBe(0)

    const importedHeaderContent = await SurveyFileService.fetchFileContentAsBuffer({
      surveyId: importedSurveyId,
      fileUuid: headerFileUuid,
    })
    expect(Buffer.compare(importedHeaderContent, headerContent)).toBe(0)
  })

  test('branding logo and doc header image content survive survey cloning', async () => {
    const user = getContextUser()

    const cloneJob = new SurveyCloneJob({ surveyId: sourceSurveyId, user })
    await cloneJob.start()
    expect(cloneJob.isSucceeded()).toBe(true)

    const { surveyId: clonedSurveyId } = cloneJob.result
    createdSurveyIds.push(clonedSurveyId)

    const clonedLogoContent = await SurveyFileService.fetchFileContentAsBuffer({
      surveyId: clonedSurveyId,
      fileUuid: logoFileUuid,
    })
    expect(Buffer.compare(clonedLogoContent, logoContent)).toBe(0)

    const clonedHeaderContent = await SurveyFileService.fetchFileContentAsBuffer({
      surveyId: clonedSurveyId,
      fileUuid: headerFileUuid,
    })
    expect(Buffer.compare(clonedHeaderContent, headerContent)).toBe(0)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `yarn build:test:integration && jest dist/__tests__/bundle.integration.js -t "branding and doc-layout images"`
Expected: FAIL — both tests fail because `fetchFileContentAsBuffer` for `logoFileUuid`/`headerFileUuid` under the imported/cloned survey returns empty content (no matching row), since the export job never wrote these file types to the zip.

- [ ] **Step 3: Generalize `SurveyFilesExportJob`**

Replace the full contents of `server/modules/survey/service/surveyExport/jobs/surveyFilesExportJob.js`:

```js
import * as SurveyFile from '@core/survey/surveyFile'

import Job from '@server/job/job'
import * as SurveyFileService from '@server/modules/survey/service/surveyFileService'
import { ExportFile } from '../exportFile'

const SURVEY_FILE_TYPES_TO_EXPORT = [
  SurveyFile.SurveyFileType.preloadedMapLayer,
  SurveyFile.SurveyFileType.surveyDocImage,
  SurveyFile.SurveyFileType.brandingSurveyLogo1,
  SurveyFile.SurveyFileType.brandingSurveyLogo2,
  SurveyFile.SurveyFileType.brandingSurveyLogo3,
  SurveyFile.SurveyFileType.brandingLandingBackground,
]

export default class SurveyFilesExportJob extends Job {
  constructor(params) {
    super('SurveyFilesExportJob', params)
  }

  async execute() {
    const { archive, surveyId } = this.context

    const fileSummariesByType = await Promise.all(
      SURVEY_FILE_TYPES_TO_EXPORT.map((type) =>
        SurveyFileService.fetchFileSummariesByType({ surveyId, type }, this.tx)
      )
    )
    const fileSummaries = fileSummariesByType.flat()

    const filesCount = fileSummaries.length
    this.total = filesCount

    this.logDebug(`survey file(s) to export: ${filesCount}`)

    if (filesCount > 0) {
      // write each file content into a separate binary file
      for (const fileSummary of fileSummaries) {
        if (this.isCanceled()) {
          break
        }
        const fileUuid = SurveyFile.getUuid(fileSummary)
        const fileContentStream = await SurveyFileService.fetchFileContentAsStream({ surveyId, fileUuid }, this.tx)
        const archiveEntryName = ExportFile.surveyFile({ fileUuid })
        archive.append(fileContentStream, { name: archiveEntryName })

        this.incrementProcessedItems()
      }
    }
  }
}
```

- [ ] **Step 4: Generalize `SurveyFilesImportJob`**

Replace the full contents of `server/modules/arenaImport/service/arenaImport/jobs/surveyFilesImportJob.js`:

```js
import * as Survey from '@core/survey/survey'
import * as SurveyBranding from '@core/survey/surveyBranding'
import * as SurveyFile from '@core/survey/surveyFile'

import * as ArenaSurveyFileZip from '../model/arenaSurveyFileZip'
import { FileImportBaseJob } from './filesImportBaseJob'

export default class SurveyFilesImportJob extends FileImportBaseJob {
  constructor(params) {
    super('SurveyFilesImportJob', params)
  }

  async execute() {
    const { arenaSurveyFileZip, survey, surveyId, skipMissingFiles = false } = this.context

    const surveyInfo = Survey.getSurveyInfo(survey)
    const preloadedMapLayerFiles = Survey.getPreloadedMapLayers(surveyInfo)
    const surveyDocImageFiles = Survey.getSurveyDocImages(surveyInfo)
    const brandingFiles = SurveyBranding.getBrandingFileSummaries(SurveyBranding.getBranding(surveyInfo))

    const fileSummaries = [...preloadedMapLayerFiles, ...surveyDocImageFiles, ...brandingFiles]

    this.total = fileSummaries.length

    if (this.total > 0) {
      this.logDebug(`survey files to import: ${this.total}`)
      await this.checkFilesNotExceedingAvailableQuota(fileSummaries)
      for (const fileSummary of fileSummaries) {
        if (this.isCanceled()) {
          break
        }
        let file = { ...fileSummary }

        // load file content
        const fileUuid = SurveyFile.getUuid(fileSummary)
        const fileName = SurveyFile.getName(fileSummary)
        const fileContent = await ArenaSurveyFileZip.getSurveyFile(arenaSurveyFileZip, fileUuid)

        if (!fileContent && !skipMissingFiles) {
          throw new Error(`Missing content for file ${fileUuid} (${fileName})`)
        }
        if (fileContent) {
          file = SurveyFile.assocContent(fileContent)(file)

          // update file size with actual file content length
          file = SurveyFile.assocSize(Buffer.byteLength(fileContent))(file)

          await this.persistFile(file)
        } else {
          this.logWarn(`Survey ${surveyId}: missing content for survey file ${fileUuid} (${fileName})`)
        }
        this.incrementProcessedItems()
      }
    }
  }
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `yarn build:test:integration && jest dist/__tests__/bundle.integration.js -t "branding and doc-layout images"`
Expected: PASS (2 tests)

- [ ] **Step 6: Commit**

```bash
git add server/modules/survey/service/surveyExport/jobs/surveyFilesExportJob.js \
  server/modules/arenaImport/service/arenaImport/jobs/surveyFilesImportJob.js \
  test/integration/tests/013surveyFilesExportImportTest.js
git commit -m "Export/import survey branding and doc-layout image file content"
```

---

### Task 3: Backward-compatibility tests for zips missing new file entries

**Files:**
- Modify: `test/integration/tests/013surveyFilesExportImportTest.js`

**Interfaces:**
- Consumes: `SurveyFilesImportJob` (Task 2, run standalone via `.start()` instead of nested inside `ArenaImportJob`), `sourceSurveyId` fixture from Task 2's `beforeAll`.

This task adds no new production code — it verifies old export zips (predating this feature, so missing the new `surveyfiles/` entries) don't break import: `skipMissingFiles: true` should still succeed with a warning, `skipMissingFiles: false` should still throw, exactly as before this feature. It exercises `SurveyFilesImportJob` standalone (not nested inside the full `ArenaImportJob` chain) against a fake zip that reports every entry as absent, simulating an old zip.

- [ ] **Step 1: Write the tests**

Add this import to the top of `test/integration/tests/013surveyFilesExportImportTest.js`, alongside the other imports:

```js
import SurveyFilesImportJob from '@server/modules/arenaImport/service/arenaImport/jobs/surveyFilesImportJob'
```

Add these two `test()` blocks inside the existing `describe(...)`, after the `'branding logo and doc header image content survive survey cloning'` test:

```js
  test('import warns and skips missing survey file content when skipMissingFiles is true', async () => {
    const surveyRefetched = await SurveyManager.fetchSurveyById({ surveyId: sourceSurveyId, draft: true })
    const fakeZipMissingAllEntries = { getEntryData: async () => null }

    const importJob = new SurveyFilesImportJob({
      arenaSurveyFileZip: fakeZipMissingAllEntries,
      survey: surveyRefetched,
      surveyId: sourceSurveyId,
      skipMissingFiles: true,
    })
    await importJob.start()

    expect(importJob.isSucceeded()).toBe(true)
  })

  test('import fails on missing survey file content when skipMissingFiles is false', async () => {
    const surveyRefetched = await SurveyManager.fetchSurveyById({ surveyId: sourceSurveyId, draft: true })
    const fakeZipMissingAllEntries = { getEntryData: async () => null }

    const importJob = new SurveyFilesImportJob({
      arenaSurveyFileZip: fakeZipMissingAllEntries,
      survey: surveyRefetched,
      surveyId: sourceSurveyId,
      skipMissingFiles: false,
    })
    await importJob.start()

    expect(importJob.isFailed()).toBe(true)
  })
```

These reuse `sourceSurveyId` from `beforeAll` (already has a branding logo and a doc header image referenced in its props) but read-only: since the fake zip always resolves content as `null`, neither test ever calls `persistFile`, so the source survey's `file` table rows are untouched and the two tests don't interfere with each other or with Task 2's tests regardless of execution order.

- [ ] **Step 2: Run the tests to verify they pass**

Run: `yarn build:test:integration && jest dist/__tests__/bundle.integration.js -t "missing survey file content"`
Expected: PASS (2 tests) — this is verifying pre-existing, unchanged behavior, so no implementation step is needed between writing the test and it passing.

- [ ] **Step 3: Run the full integration test file to confirm no regressions**

Run: `yarn build:test:integration && jest dist/__tests__/bundle.integration.js -t "Survey files export/import"`
Expected: PASS (4 tests total: backup round-trip, clone round-trip, 2 missing-content tests)

- [ ] **Step 4: Commit**

```bash
git add test/integration/tests/013surveyFilesExportImportTest.js
git commit -m "Add backward-compatibility tests for survey file import with missing content"
```

---

## Self-Review Notes

- **Spec coverage:** §4.1 (export loop) → Task 2 Step 3. §4.2 (import sources + branding helper) → Task 1 + Task 2 Step 4. §3 decisions table: scope of file types → Task 1/2; zip layout unchanged → no path changes made anywhere; clone scope → Task 2's clone test; backward compat → Task 3; test coverage → Tasks 1–3.
- **Placeholder scan:** no TBD/TODO; all steps contain complete, runnable code.
- **Type consistency:** `BrandingFileSummary` shape (`{ uuid, props: { type, size } }`) defined in Task 1 is exactly what Task 2's `SurveyFilesImportJob` spreads into its `fileSummaries` array and passes through `SurveyFile.getUuid`/`getName`/`assocContent`/`assocSize`, matching how `preloadedMapLayerFiles`/`surveyDocImageFiles` entries (full `SurveyFile` shape) are already handled by that same loop.
