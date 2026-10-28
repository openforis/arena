# Arena Mobile survey package (zip download) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A new endpoint that lets Arena Mobile download a survey as a zip "package": `survey.json` (the same survey returned today by `GET /mobile/survey/:surveyId`) plus the survey files the app needs (`files/`), with a `files.json` index.

**Why:** today Arena Mobile downloads only the survey JSON: the survey files (preloaded map layers, branding images) never reach the device. The package makes them available offline, so the app can show the survey branding and preloaded map layers, and it lets big data (e.g. the survey area of interest polygon, openforis/arena#4588) move out of the survey props into a file. The survey JSON is also compressed in the zip (category items and taxa compress very well), so downloads get faster.

**Architecture:** a service writes the zip to a stream with `archiver` (already a dependency): the survey JSON is appended as a string, every file content as a stream read with `SurveyFileManager.fetchFileContentAsStream` (DB, file system or S3 storage). The list of files to include is computed from the survey info props by a pure function in `core/`, so the files referenced by the survey (and only those) are sent. The current JSON endpoint is unchanged: older app versions keep using it, and the new app falls back to it with older servers.

**Tech Stack:** Node.js / Express, `archiver` (`ZipArchive`), pg-promise, Jest (unit and integration tests), `adm-zip` (already a dependency, to read the zip in the tests).

**Companion plan:** openforis/arena-mobile, branch `survey-package-download`, `docs/survey-package-download-plan.md` (download, unzip and storage of the package in the app).

## Global Constraints

- Endpoint: `GET /api/mobile/survey/:surveyId/package`, same params (`cycle`, `draft`) and same permission (`AuthMiddleware.requireSurveyViewPermission`) as `GET /mobile/survey/:surveyId`.
- Zip layout (version 1):
  ```
  survey.json        same JSON object returned as `survey` by GET /mobile/survey/:surveyId
  files.json         { "version": 1, "files": [{ "uuid", "type", "name", "size" }] }
  files/<uuid>       content of every file listed in files.json (no extension: the type and name are in files.json)
  ```
- Files included: the survey files referenced by the survey info props: preloaded map layers (only when `preloadedMapLayersEnabled`, not deleted) and branding images (`SurveyBranding.getBrandingFileSummaries`). Never record attachments, chain MAU, printable export PDFs or survey document images.
- `GET /mobile/survey/:surveyId` stays unchanged (older app versions).
- New files in TypeScript; cognitive complexity ≤ 15; `for...of` instead of `forEach`; JSDoc on every function.

---

### File structure

- Create `core/survey/surveyMobilePackage.ts`: package layout constants and `getMobilePackageFileSummaries(surveyInfo)` (pure, unit tested).
- Create `test/unit/tests/surveyMobilePackage.test.ts`.
- Create `server/modules/mobile/service/surveyMobilePackageService.ts`: `writeSurveyMobilePackage({ survey, outputStream })`.
- Modify `server/modules/mobile/api/mobileApi.js`: new route.
- Create `test/integration/tests/057mobileSurveyPackageTest.js` (next free index in `test/integration/tests`).
- Modify `CHANGELOG.md` at release time (not in this branch: it is an internal change until the app uses it).

### Task 1: files to include in the package (core)

**Interfaces:**

- Produces:
  ```ts
  export const SurveyMobilePackage = {
    version: 1,
    surveyFileName: 'survey.json',
    filesIndexFileName: 'files.json',
    filesDirName: 'files',
    getFileEntryName: (fileUuid: string) => string, // `files/${fileUuid}`
    getFileSummaries: (surveyInfo) => MobilePackageFileSummary[],
  }
  type MobilePackageFileSummary = { uuid: string; type: string; name?: string; size?: number }
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

  test('file entry name', () => {
    expect(SurveyMobilePackage.getFileEntryName('abc')).toBe('files/abc')
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

const filesDirName = 'files'

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

export const SurveyMobilePackage = {
  version: 1,
  surveyFileName: 'survey.json',
  filesIndexFileName: 'files.json',
  filesDirName,
  getFileEntryName: (fileUuid: string): string => `${filesDirName}/${fileUuid}`,
  getFileSummaries,
}
```

(Check the exact shape returned by `SurveyBranding.getBrandingFileSummaries` and the `props` of the preloaded map layers in `Survey.getPreloadedMapLayers`; drop `undefined` name/size if the test expects them missing.)

- [ ] **Step 4: Run** `yarn test:unit` → PASS.
- [ ] **Step 5: Commit** `Arena Mobile survey package: files to include`.

### Task 2: package writer service + endpoint

**Interfaces:**

- Consumes: `SurveyMobilePackage` (Task 1); `SurveyFileManager.fetchFileContentAsStream({ surveyId, fileSummary })`.
- Produces: `SurveyMobilePackageService.writeSurveyMobilePackage({ survey, outputStream }): Promise<void>`; route `GET /mobile/survey/:surveyId/package`.

- [ ] **Step 1: Write the failing integration test** `test/integration/tests/057mobileSurveyPackageTest.js`, following the existing integration tests (survey created with `test/utils/surveyBuilder`):
  - survey with `preloadedMapLayersEnabled: true` and one preloaded map layer file inserted with `SurveyFileManager.insertFile` (content: a small GeoJSON buffer), plus one branding logo file;
  - call `writeSurveyMobilePackage` with a `PassThrough` stream collected into a buffer;
  - read the buffer with `adm-zip` and check: entries `survey.json`, `files.json`, `files/<layerUuid>`, `files/<logoUuid>`; `survey.json` parsed has the survey uuid; `files.json` = `{ version: 1, files: [...] }` with the 2 files; content of `files/<layerUuid>` equals the inserted buffer;
  - survey without files: only `survey.json` and `files.json` (with `files: []`).
- [ ] **Step 2: Run** `yarn test:integration` → FAIL.
- [ ] **Step 3: Implement** `server/modules/mobile/service/surveyMobilePackageService.ts`:

```ts
import { Writable } from 'node:stream'

import { ZipArchive } from 'archiver'

import * as Survey from '@core/survey/survey'
import { SurveyMobilePackage } from '@core/survey/surveyMobilePackage'

import * as SurveyFileManager from '@server/modules/survey/manager/surveyFileManager'

/**
 * Writes the Arena Mobile survey package (zip with survey.json, files.json and the survey files) to the output stream.
 *
 * @param {object} params - Parameters.
 * @param {object} params.survey - The survey, as returned by the mobile survey endpoint.
 * @param {Writable} params.outputStream - Stream the zip is written to (e.g. the HTTP response).
 * @returns {Promise<void>} - Resolves when the zip has been completely written.
 */
export const writeSurveyMobilePackage = async ({
  survey,
  outputStream,
}: {
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

  zip.append(JSON.stringify(survey), { name: SurveyMobilePackage.surveyFileName })
  zip.append(JSON.stringify({ version: SurveyMobilePackage.version, files: fileSummaries }), {
    name: SurveyMobilePackage.filesIndexFileName,
  })
  for (const fileSummary of fileSummaries) {
    // file summaries in the format expected by SurveyFileManager (uuid + props)
    const contentStream = await SurveyFileManager.fetchFileContentAsStream({
      surveyId,
      fileSummary: { uuid: fileSummary.uuid, props: {} },
    })
    if (contentStream) zip.append(contentStream, { name: SurveyMobilePackage.getFileEntryName(fileSummary.uuid) })
  }
  await zip.finalize()
  await finished
}
```

(A file referenced by the props but missing in the storage must not break the download: catch the error of `fetchFileContentAsStream`, log a warning and remove the file from `files.json` — build the index after fetching the streams, appending it last.)

`server/modules/mobile/api/mobileApi.js`, next to the JSON route:

```js
  // ====== READ - survey package (zip: survey.json, files.json, files/)
  app.get('/mobile/survey/:surveyId/package', AuthMiddleware.requireSurveyViewPermission, async (req, res, next) => {
    try {
      const { surveyId, cycle, draft = false } = Request.getParams(req)
      const survey = await fetchSurvey({ surveyId, cycle, draft })
      Response.setContentTypeFile({ res, fileName: `survey_${surveyId}.zip`, contentType: Response.contentTypes.zip })
      await SurveyMobilePackageService.writeSurveyMobilePackage({ survey, outputStream: res })
    } catch (e) {
      next(e)
    }
  })
```

(Add `import * as Response from '@server/utils/response'` and `import * as SurveyMobilePackageService from '../service/surveyMobilePackageService'` to `mobileApi.js`; an error after the headers have been sent cannot be reported as JSON: log it and destroy the response.)

- [ ] **Step 4: Run** `yarn test:integration` → PASS; `yarn typecheck` (no new errors) and eslint on the changed files.
- [ ] **Step 5: Manual check:** `curl -H "Authorization: Bearer <token>" "http://localhost:9090/api/mobile/survey/<id>/package?cycle=0" -o survey.zip && unzip -l survey.zip` on a survey with branding and preloaded map layers.
- [ ] **Step 6: Commit** `Arena Mobile survey package endpoint`.

### Task 3: PR

- [ ] Push the branch, open the PR (link the arena-mobile companion PR), wait for the checks and address the findings.
- [ ] Release: the endpoint must be deployed on the servers before the app version using it is released (the app falls back to the JSON endpoint anyway).

---

## Follow-ups (separate PRs)

- **Area of interest as survey file** (openforis/arena#4588): store the AOI as a survey file (`SurveyFileType.areaOfInterest`) referenced by `props.areaOfInterest = { fileUuid, polygons, vertices }`, include it in the package, and give the arena-core expression evaluator an AOI provider in the context (async, like `categoryItemProvider`), implemented by the server (file content cached by survey id) and by the app (file read from the package folder).
- **Arena Mobile branding**: show the survey logos and landing background from the package files.
