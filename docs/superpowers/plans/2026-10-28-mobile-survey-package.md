# Arena Mobile survey package (zip download) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A new endpoint that lets Arena Mobile download a survey as a zip "package": `info.json`, `survey.json` (the same survey returned today by `GET /mobile/survey/:surveyId`) and the survey files the app needs (`surveyfiles/`), using the same names and layout as the Arena format export (dashboard → export survey).

**Why:** today Arena Mobile downloads only the survey JSON: the survey files (preloaded map layers, branding images) never reach the device. The package makes them available offline, so the app can show the survey branding and preloaded map layers, and it lets big data (e.g. the survey area of interest polygon, openforis/arena#4588) move out of the survey props into a file. The survey JSON is also compressed in the zip (category items and taxa compress very well), so downloads get faster.

**Relation with the Arena format export:** the package is a subset of the Arena export (`server/modules/survey/service/surveyExport/`): same `info.json` (with a new export type), same `survey.json` entry name, same `surveyfiles/<uuid>.bin` entries for the survey files, whose metadata is read from the survey props (preloaded map layers, branding), exactly as in the export. The only difference is the content of `survey.json`: the mobile app needs the survey with merged props (published, or draft for the preview), one cycle, category items and taxa included (`refData`), while the export keeps props and props draft separated, all cycles, and category items / taxa in `categories/` and `taxonomies/`. Unifying the two (the app importing the survey part of a regular Arena export) is a future step: keeping the same names now avoids conflicts, e.g. `files/` is used by the export for the record files.

**Architecture:** a service writes the zip to a stream with `archiver` (already a dependency): `info.json` and `survey.json` are appended as strings, every survey file content as a stream read with `SurveyFileManager.fetchFileContentAsStream` (DB, file system or S3 storage). The entry names come from the export `ExportFile` helper. The list of files to include is computed from the survey info props by a pure function in `core/`. The current JSON endpoint is unchanged: older app versions keep using it, and the new app falls back to it with older servers.

**Tech Stack:** Node.js / Express, `archiver` (`ZipArchive`), pg-promise, `@openforis/arena-core` (`ArenaExportInfoFactory`, `ArenaExportType`), Jest (unit and integration tests), `adm-zip` (already a dependency, to read the zip in the tests).

**Companion plan:** openforis/arena-mobile, branch `survey-package-download`, `docs/survey-package-download-plan.md` (download, unzip and storage of the package in the app).

## Global Constraints

- Endpoint: `GET /api/mobile/survey/:surveyId/package`, same params (`cycle`, `draft`) and same permission (`AuthMiddleware.requireSurveyViewPermission`) as `GET /mobile/survey/:surveyId`.
- Zip layout (names from `ExportFile`, `server/modules/survey/service/surveyExport/exportFile.js`):
  ```
  info.json                 ArenaExportInfo, exportType "mobileSurvey"
  survey.json               same JSON object returned as `survey` by GET /mobile/survey/:surveyId
  surveyfiles/<uuid>.bin    content of every survey file referenced by the survey props
  ```
- Files included: the survey files referenced by the survey info props: preloaded map layers (only when `preloadedMapLayersEnabled`, not deleted) and branding images (`SurveyBranding.getBrandingFileSummaries`). Never record attachments, chain MAU, printable export PDFs or survey document images (not used by the app).
- No `files.json` index: the app finds the files from the survey props, as the Arena import does.
- `GET /mobile/survey/:surveyId` stays unchanged (older app versions).
- New files in TypeScript; cognitive complexity ≤ 15; `for...of` instead of `forEach`; JSDoc on every function.

---

### File structure

- openforis/arena-core: `src/dataExport/ArenaExportInfo.ts`: new `ArenaExportType.mobileSurvey`.
- Create `core/survey/surveyMobilePackage.ts`: `SurveyMobilePackage.getFileSummaries(surveyInfo)` (pure, unit tested).
- Create `test/unit/tests/surveyMobilePackage.test.ts`.
- Create `server/modules/mobile/service/surveyMobilePackageService.ts`: `writeSurveyMobilePackage({ user, survey, outputStream })`.
- Modify `server/modules/mobile/api/mobileApi.js`: new route.
- Create `test/integration/tests/057mobileSurveyPackageTest.js` (next free index in `test/integration/tests`).
- `CHANGELOG.md` at release time (internal change until the app uses it).

### Task 0: export type in arena-core

- [ ] openforis/arena-core: add to `ArenaExportType` (`src/dataExport/ArenaExportInfo.ts`):
  ```ts
  /** Survey package downloaded by Arena Mobile (survey with reference data, survey files) */
  mobileSurvey = 'mobileSurvey',
  ```
  plus a test of `ArenaExportInfoFactory` with the new type if the existing tests cover the types; PR, release, bump `@openforis/arena-core` in arena (single version: `yarn dedupe @openforis/arena-core`).

### Task 1: survey files to include (core)

**Interfaces:**

- Produces:

  ```ts
  export type MobilePackageFileSummary = { uuid: string; type: string; name?: string; size?: number }
  export const SurveyMobilePackage = { getFileSummaries: (surveyInfo) => MobilePackageFileSummary[] }
  ```

- [ ] **Step 1: Write the failing test** `test/unit/tests/surveyMobilePackage.test.ts`:

```ts
import * as SurveyFile from '@core/survey/surveyFile'
import { SurveyMobilePackage } from '@core/survey/surveyMobilePackage'

const layer = (uuid: string, deleted = false) => ({
  uuid,
  props: { name: `${uuid}.geojson`, size: 10, type: SurveyFile.SurveyFileType.preloadedMapLayer, deleted },
})

const surveyInfo = (props: Record<string, unknown>) => ({ props })

describe('SurveyMobilePackage', () => {
  test('no files', () => {
    expect(SurveyMobilePackage.getFileSummaries(surveyInfo({}))).toEqual([])
  })

  test('preloaded map layers only when enabled, deleted ones excluded', () => {
    const props = { preloadedMapLayers: [layer('a'), layer('b', true)] }
    expect(SurveyMobilePackage.getFileSummaries(surveyInfo(props))).toEqual([])
    expect(SurveyMobilePackage.getFileSummaries(surveyInfo({ ...props, preloadedMapLayersEnabled: true }))).toEqual([
      { uuid: 'a', type: SurveyFile.SurveyFileType.preloadedMapLayer, name: 'a.geojson', size: 10 },
    ])
  })

  test('branding images', () => {
    const props = { branding: { surveyLogo1: { fileUuid: 'logo', name: 'logo.png', size: 5 } } }
    expect(SurveyMobilePackage.getFileSummaries(surveyInfo(props))).toEqual([
      { uuid: 'logo', type: SurveyFile.SurveyFileType.brandingSurveyLogo1, name: 'logo.png', size: 5 },
    ])
  })
})
```

- [ ] **Step 2: Run** `yarn test:unit` → FAIL (module not found).
- [ ] **Step 3: Implement** `core/survey/surveyMobilePackage.ts`:

```ts
import * as Survey from '@core/survey/survey'
import * as SurveyBranding from '@core/survey/surveyBranding'
import * as SurveyFile from '@core/survey/surveyFile'

export type MobilePackageFileSummary = { uuid: string; type: string; name?: string; size?: number }

const getPreloadedMapLayerFileSummaries = (surveyInfo: any): MobilePackageFileSummary[] => {
  if (!Survey.isPreloadedMapLayersEnabled(surveyInfo)) return []
  return Survey.getPreloadedMapLayers(surveyInfo)
    .filter((file: any) => !SurveyFile.isDeleted(file))
    .map((file: any) => ({
      uuid: SurveyFile.getUuid(file),
      type: SurveyFile.SurveyFileType.preloadedMapLayer,
      name: SurveyFile.getName(file),
      size: SurveyFile.getSize(file),
    }))
}

const getBrandingFileSummaries = (surveyInfo: any): MobilePackageFileSummary[] =>
  SurveyBranding.getBrandingFileSummaries(SurveyBranding.getBranding(surveyInfo)).map(({ uuid, props }) => ({
    uuid,
    type: props.type,
    name: props.name,
    size: props.size,
  }))

/**
 * Returns the survey files to include in the Arena Mobile survey package (the ones referenced by the survey info).
 *
 * @param {object} surveyInfo - The survey info.
 * @returns {MobilePackageFileSummary[]} - Summaries of the files to include.
 */
const getFileSummaries = (surveyInfo: any): MobilePackageFileSummary[] => [
  ...getPreloadedMapLayerFileSummaries(surveyInfo),
  ...getBrandingFileSummaries(surveyInfo),
]

export const SurveyMobilePackage = { getFileSummaries }
```

(Check the `props` of the preloaded map layers returned by `Survey.getPreloadedMapLayers`; drop `undefined` name/size if the test expects them missing.)

- [ ] **Step 4: Run** `yarn test:unit` → PASS.
- [ ] **Step 5: Commit** `Arena Mobile survey package: survey files to include`.

### Task 2: package writer service + endpoint

**Interfaces:**

- Consumes: `SurveyMobilePackage` (Task 1); `ArenaExportType.mobileSurvey` (Task 0); `ExportFile.info`, `ExportFile.survey`, `ExportFile.surveyFile({ fileUuid })`; `SurveyFileManager.fetchFileContentAsStream({ surveyId, fileSummary })`.
- Produces: `SurveyMobilePackageService.writeSurveyMobilePackage({ user, survey, outputStream }): Promise<void>`; route `GET /mobile/survey/:surveyId/package`.

- [ ] **Step 1: Write the failing integration test** `test/integration/tests/057mobileSurveyPackageTest.js`, following the existing integration tests (survey created with `test/utils/surveyBuilder`):
  - survey with `preloadedMapLayersEnabled: true` and one preloaded map layer file inserted with `SurveyFileManager.insertFile` (content: a small GeoJSON buffer), plus one branding logo file;
  - call `writeSurveyMobilePackage` with a `PassThrough` stream collected into a buffer;
  - read the buffer with `adm-zip` and check: entries `info.json`, `survey.json`, `surveyfiles/<layerUuid>.bin`, `surveyfiles/<logoUuid>.bin` and nothing else; `info.json` has `exportType: 'mobileSurvey'` and the survey uuid/name; `survey.json` parsed has the survey uuid; content of `surveyfiles/<layerUuid>.bin` equals the inserted buffer;
  - survey without files: only `info.json` and `survey.json`.
- [ ] **Step 2: Run** `yarn test:integration` → FAIL.
- [ ] **Step 3: Implement** `server/modules/mobile/service/surveyMobilePackageService.ts`:

```ts
import { Writable } from 'node:stream'

import { ArenaExportInfoFactory, ArenaExportType } from '@openforis/arena-core'
import { ZipArchive } from 'archiver'

import { AppInfo } from '@core/app/appInfo'
import * as Survey from '@core/survey/survey'
import { SurveyMobilePackage } from '@core/survey/surveyMobilePackage'
import * as User from '@core/user/user'

import * as Log from '@server/log/log'
import * as SurveyFileManager from '@server/modules/survey/manager/surveyFileManager'
import { ExportFile } from '@server/modules/survey/service/surveyExport/exportFile'

const logger = Log.getLogger('SurveyMobilePackageService')

const createInfo = ({ user, survey }) =>
  ArenaExportInfoFactory.createInstance({
    appInfo: AppInfo.currentAppInfo,
    dateExported: new Date().toISOString(),
    exportedByUserUuid: User.getUuid(user),
    exportType: ArenaExportType.mobileSurvey,
    survey: { uuid: Survey.getUuid(survey), name: Survey.getName(survey) },
  })

/**
 * Writes the Arena Mobile survey package (zip with info.json, survey.json and the survey files) to the output stream.
 *
 * @param {object} params - Parameters.
 * @param {object} params.user - The user downloading the survey.
 * @param {object} params.survey - The survey, as returned by the mobile survey endpoint.
 * @param {Writable} params.outputStream - Stream the zip is written to (e.g. the HTTP response).
 * @returns {Promise<void>} - Resolves when the zip has been completely written.
 */
export const writeSurveyMobilePackage = async ({
  user,
  survey,
  outputStream,
}: {
  user: any
  survey: any
  outputStream: Writable
}): Promise<void> => {
  const surveyId = Survey.getId(survey)
  const fileSummaries = SurveyMobilePackage.getFileSummaries(Survey.getSurveyInfo(survey))

  const zip = new ZipArchive()
  const finished = new Promise<void>((resolve, reject) => {
    outputStream.on('finish', () => resolve())
    zip.on('error', reject)
  })
  zip.pipe(outputStream)

  zip.append(JSON.stringify(createInfo({ user, survey })), { name: ExportFile.info })
  zip.append(JSON.stringify(survey), { name: ExportFile.survey })
  for (const { uuid: fileUuid } of fileSummaries) {
    try {
      // file summaries in the format expected by SurveyFileManager (uuid + props)
      const contentStream = await SurveyFileManager.fetchFileContentAsStream({
        surveyId,
        fileSummary: { uuid: fileUuid, props: {} },
      })
      if (contentStream) zip.append(contentStream, { name: ExportFile.surveyFile({ fileUuid }) })
    } catch (error) {
      // a file missing in the storage must not break the download: the app treats it as not available
      logger.warn(`survey ${surveyId}: cannot read survey file ${fileUuid}: ${error}`)
    }
  }
  await zip.finalize()
  await finished
}
```

(`ExportFile` is a JS module in the survey export service; if importing it from the mobile module creates an unwanted dependency, move it to a shared place, e.g. `server/modules/survey/service/surveyExport/exportFile.js` stays the source and is re-exported, without duplicating the names.)

`server/modules/mobile/api/mobileApi.js`, next to the JSON route (add `import * as Response from '@server/utils/response'` and `import * as SurveyMobilePackageService from '../service/surveyMobilePackageService'`):

```js
// ====== READ - survey package (zip: info.json, survey.json, surveyfiles/)
app.get('/mobile/survey/:surveyId/package', AuthMiddleware.requireSurveyViewPermission, async (req, res, next) => {
  try {
    const { surveyId, cycle, draft = false } = Request.getParams(req)
    const user = Request.getUser(req)
    const survey = await fetchSurvey({ surveyId, cycle, draft })
    Response.setContentTypeFile({ res, fileName: `survey_${surveyId}.zip`, contentType: Response.contentTypes.zip })
    await SurveyMobilePackageService.writeSurveyMobilePackage({ user, survey, outputStream: res })
  } catch (e) {
    next(e)
  }
})
```

(An error after the headers have been sent cannot be reported as JSON: log it and destroy the response, so the app sees a failed download and keeps the survey it has.)

- [ ] **Step 4: Run** `yarn test:integration` → PASS; `yarn typecheck` (no new errors) and eslint on the changed files.
- [ ] **Step 5: Manual check:** `curl -H "Authorization: Bearer <token>" "http://localhost:9090/api/mobile/survey/<id>/package?cycle=0" -o survey.zip && unzip -l survey.zip` on a survey with branding and preloaded map layers.
- [ ] **Step 6: Commit** `Arena Mobile survey package endpoint`.

### Task 3: PR

- [ ] Push the branch, open the PR (link the arena-core and arena-mobile companion PRs), wait for the checks and address the findings.
- [ ] Release: the endpoint must be deployed on the servers before the app version using it is released (the app falls back to the JSON endpoint anyway).

---

## Follow-ups (separate PRs)

- **Area of interest as survey file** (openforis/arena#4588): store the AOI as a survey file (`SurveyFileType.areaOfInterest`) referenced by `props.areaOfInterest = { fileUuid, polygons, vertices }`, include it in the package and in the Arena export (`SurveyFilesExportJob`), and give the arena-core expression evaluator an AOI provider in the context (async, like `categoryItemProvider`), implemented by the server (file content cached by survey id) and by the app (file read from the package folder).
- **Arena Mobile branding**: show the survey logos and landing background from the package files.
- **Single format**: the app imports the survey part of a regular Arena export (`survey.json` with separated props, `categories/` and `taxonomies/` read in parts, which also lowers the memory used by big categories), so the package endpoint can return the same export (survey only, one cycle).
