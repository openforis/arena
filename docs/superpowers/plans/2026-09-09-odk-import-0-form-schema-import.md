# ODK Import — Phase 0: Form/Schema Import Implementation Plan

> **Status: implemented and verified end-to-end against a live local Postgres instance (see Task 5).** This plan is written retrospectively, as a record of what was built for Phase 0, rather than prescriptively ahead of implementation — see the "Note on this plan's phasing" at the end. Reference spec: `docs/superpowers/specs/2026-09-09-odk-import-design.md`.

**Goal:** Let a user upload a compiled XForm XML file and get back a new Arena survey with a correctly-typed NodeDef tree (entities, attributes, repeats), Categories for choice lists, and multi-language labels — no data import, no expression conversion yet (both are later phases).

**Architecture:** A new `server/modules/odkImport/` module, structurally mirroring `server/modules/collectImport/`: a pure accessor DSL over the parsed XForm (`model/xform.ts`, mirroring `collectSurvey.js`), an ODK-type-to-Arena-type table (`model/xformTypeMapping.ts`), and a composite `OdkImportJob` chaining `PrepareImportFileJob` (reused) → `OdkFormReaderJob` → `SurveyCreatorJob` → `CategoriesImportJob` → `NodeDefsImportJob` → `SurveyDependencyGraphsGenerationJob` (reused) → `SurveyRdbCreationJob` (reused), exposed via `POST /survey/odk-import` (chunked upload + job start, mirroring `collectImportApi.js`) and wired into the survey-create webapp wizard as a third import source alongside `arena`/`collect`.

**Tech Stack:** Node.js/TypeScript (all new files), Express, pg-promise, xml-js (via the existing `FileXml` wrapper), Jest (webpack-bundled unit tests per repo convention).

## Global Constraints

- All new code is TypeScript.
- Expression conversion (`relevant`/`constraint`/`calculate`) is explicitly out of scope for this phase — see the design spec's phasing. Attributes are created with their type/labels/category only.
- No XLSForm (`.xlsx`) support, no live ODK Central API — file upload of a compiled XForm XML only.
- Reuse existing infra wherever collectImport/mobile-import already established a pattern (job base class, `FileXml`/`FileZip`, `BatchPersister`, chunked-upload processor) — do not reinvent.

---

### Task 1: XForm parsing model (`server/modules/odkImport/service/odkImport/model/`)

**Files:**
- Create: `server/modules/odkImport/service/odkImport/model/xform.ts`
- Create: `server/modules/odkImport/service/odkImport/model/xformTypeMapping.ts`
- Create: `test/unit/tests/046odkImportXform.test.ts`
- Create: `test/unit/tests/047odkImportXformTypeMapping.test.ts`

**Interfaces:**
- Produces: `XForm.parseXForm(xml): XmlElement`, `XForm.getPrimaryInstanceRoot`, `XForm.visitPrimaryInstanceNodes`, `XForm.buildBindsByPath`, `XForm.buildRepeatPathsSet`, `XForm.buildBodyControlsByPath`, `XForm.getSecondaryInstancesByInstanceId`, `XForm.getItextTranslations`, `XForm.resolveLabels`, plus exported low-level helpers `XForm.getAttribute`, `XForm.getChildElements`, `XForm.xmlLocalName` (the last two exported specifically so `NodeDefsImportJob`'s own recursive walk — which can't use the synchronous `visitPrimaryInstanceNodes` visitor because it interleaves awaited DB inserts — can reuse the same element-filtering logic instead of duplicating it).
- Produces: `xformTypeMapping.mapXFormTypeToNodeDefType({ odkType, readonly, hasBodyControl }): { nodeDefType, skip, flag }` and `arenaFileTypeFromMediatype(mediatype)`.

- [x] **Step 1: Write `xform.ts`, the pure accessor DSL over the xml-js compact… actually non-compact tree**

Parses via the existing `FileXml.parseToJson(xml, false)` (`server/utils/file/fileXml.js`) in the same "verbose" (non-compact) xml-js mode `collectSurvey.js` uses (`{ elements: [...] }` / `{ type: 'element', name, attributes, elements }` / `{ type: 'text', text }`).

The key structural fact this file exists to handle: unlike Collect's single self-describing schema tree, XForm splits node shape/type/display across three disjoint locations joined by an XPath `nodeset` path — the primary `<model><instance>` (shape), a flat list of `<bind nodeset="...">` (type/validation), and `<h:body>` (display, and critically, where `<repeat nodeset="...">` marks a node as repeatable). See `docs/superpowers/specs/2026-09-09-odk-import-design.md` for the full rationale.

Implemented (full source at `server/modules/odkImport/service/odkImport/model/xform.ts`): namespace-prefix-agnostic element matching (`xmlLocalName`, comparing only the part after `:`, since producers vary between `h:body`/`xf:body`/unprefixed `body`); `getPrimaryInstanceRoot` (the `<instance>` with no `id` attribute); `visitPrimaryInstanceNodes` (pre-order DFS, skips `<meta>` subtrees — the reserved ODK/OpenRosa bookkeeping node); `buildBindsByPath`/`buildRepeatPathsSet`/`buildBodyControlsByPath` (path-keyed `Map`s); itext-ref (`jr:itext('...')`) and itemset-ref (`instance('...')`) parsing via two small regexes; `getItextTranslations` (resolves `<translation lang="..." default="true()">` blocks, explicit `default` wins over first-seen); `resolveLabels` (itext indirection first, literal `<label>` text in the default language otherwise).

- [x] **Step 2: Write `xformTypeMapping.ts`**

A switch-based lookup from ODK bind `type` to Arena `nodeDefType` (`core/survey/nodeDef.js`'s `nodeDefType`: integer/decimal/text/date/time/boolean/code/coordinate/geo/taxon/file/entity — verified against the actual export, no separate "select"/"note" type exists). Full mapping table is in the design spec; every unmapped/lossy case returns a `flag` (`'unmappedType' | 'lossyGeoConversion' | 'skippedNote'`) rather than silently dropping data, and `skip: true` for ODK's readonly-with-no-body-control "note" idiom (see Task 5 for a real-world caveat on how often that idiom actually fires).

- [x] **Step 3: Write and run the unit tests**

`test/unit/tests/046odkImportXform.test.ts` and `047odkImportXformTypeMapping.test.ts` — flat files directly under `test/unit/tests/` with a numeric prefix (`046`/`047`, picking up after the highest existing prefix), **not** nested in a subdirectory: `test/webpack.config.js`'s `getEntry()` globs `tests/*.{js,jsx,ts,tsx}` (no `**`), so a nested `test/unit/tests/odkImport/*.test.ts` silently never gets bundled — this cost one full build-and-debug cycle to discover (see Self-Review Notes).

Run: `yarn build:test:unit && npx jest dist/__tests__/bundle.unit.js -t "odkImport"`
Result: PASS, 30/30 tests (verified again after every later change; final full-suite run before Task 5's commit: 689/689 passed).

- [x] **Step 4: Lint and typecheck**

Run: `npx eslint --cache --fix <files>` then `npx tsc --noEmit 2>&1 | grep odkImport`
Result: clean (eslint made only import-wrapping/formatting changes; one real typecheck fix needed — see Task 2).

---

### Task 2: Job pipeline (`server/modules/odkImport/service/odkImport/metaImportJobs/`, `odkImportJob.ts`)

**Files:**
- Create: `server/modules/odkImport/service/odkImport/metaImportJobs/odkFormReaderJob.ts`
- Create: `server/modules/odkImport/service/odkImport/metaImportJobs/surveyCreatorJob.ts`
- Create: `server/modules/odkImport/service/odkImport/metaImportJobs/categoriesImportJob.ts`
- Create: `server/modules/odkImport/service/odkImport/metaImportJobs/nodeDefsImportJob.ts`
- Create: `server/modules/odkImport/service/odkImport/odkImportJob.ts`
- Modify: `common/activityLog/activityLog.js` (new `surveyOdkImport` type, alongside the existing `surveyCollectImport`/`surveyArenaImport`)

**Interfaces:**
- Produces: `OdkImportJob` (composite, `static readonly type = 'OdkImportJob'`), constructed with `{ user, filePath?, fileId?, totalChunks?, totalFileSize?, newSurvey? }`, result `{ surveyId }`.
- Consumes (reused unmodified): `PrepareImportFileJob`, `SurveyDependencyGraphsGenerationJob`, `SurveyRdbCreationJob`, `SurveyCreatorJobHelper.onJobEnd` (removes the survey's `temporary` flag on success, deletes it on failure — same as `CollectImportJob`).

- [x] **Step 1: `OdkFormReaderJob`** — reads the uploaded file (`FileUtils.readFile`, plain text — a single XML file, not a zip, unlike Collect's `.collect`-backup zip), parses it (`XForm.parseXForm`), and derives `languages`/`defaultLanguage` from itext (falling back to `'en'` if the form has no itext block at all — a single-language form with only literal labels). `languages` is ordered with `defaultLanguage` first, since `Survey.newSurvey`'s `label` param assigns to `languages[0]`.

- [x] **Step 2: `SurveyCreatorJob`** — `Survey.newSurvey({ ownerUuid, name, label, languages })` → `SurveyManager.insertSurvey({ ..., createRootEntityDef: false, system: true, temporary: true })`, same call shape as Collect's `SurveyCreatorJob`. `ActivityLogManager.insert(..., ActivityLog.type.surveyOdkImport, ...)`.

- [x] **Step 3: `CategoriesImportJob`** — one Arena `Category` per distinct ODK choice list, either a secondary `<instance id="...">` itemset (deduplicated by instance id — several fields commonly share one list) or a select's own inline `<item>` children, both persisted via the same `BatchPersister`-batched `CategoryItem` insert `categoriesImportJob.js` uses. Cascading/filtered lists (`choice_filter`) are not detected — imported as flat, single-level categories (explicit design-spec scope decision, not an oversight).

- [x] **Step 4: `NodeDefsImportJob`** — the core mapper. Recursively walks the primary instance (own recursion, not `visitPrimaryInstanceNodes`'s visitor, because inserts must be awaited in parent-before-child order — `NodeDef.newNodeDef`'s uuid generation and the `this.survey` getter's accumulated-`nodeDefs` state both depend on strict sequencing, same constraint Collect's importer has). For each node: entity vs. attribute is decided by "has instance-tree child elements" (not by bind presence); repeat detection is `repeatPaths.has(path)`; attribute type comes from `xformTypeMapping`; labels from `XForm.resolveLabels`; `code`-type attributes get their `categoryUuid` looked up by the same key scheme `CategoriesImportJob` produced (`instance:<id>` or `field:<path>`); `file`-type attributes get `fileType` from the body control's `mediatype`. Every mapping flag becomes a `this.logWarn(...)` call (a full persisted import-issues report, matching Collect's `CollectImportReportItem` pattern, is deferred to Phase 1 — see the design spec's cross-repo migration note).

- [x] **Step 5: `OdkImportJob`** (composite) — chains all of the above plus the reused `SurveyDependencyGraphsGenerationJob`/`SurveyRdbCreationJob`, `beforeSuccess()` sets `{ surveyId }` as the result, `onEnd()` calls `SurveyCreatorJobHelper.onJobEnd` and deletes the temp upload file. Same shape as `CollectImportJob`.

- [x] **Step 6: Fix a `tsc --noEmit` error** — `this.setResult({ surveyId })` failed to typecheck (`JobBase<C, R = undefined>`'s generic `R` defaults to `undefined` since the plain-JS `server/job/job.js` doesn't specify it) — cast `as any`, matching the loose-typing-at-JS-boundary convention already used elsewhere in this codebase (e.g. `recordImportMatcher.ts`'s `{ survey, record }: { survey: any; record: any }`).

- [x] **Step 7: Lint, typecheck, rebuild the unit test bundle, re-run** — all green (see Task 1 Step 4's commands).

---

### Task 3: API + service layer

**Files:**
- Create: `server/modules/odkImport/service/odkImportService.ts`
- Create: `server/modules/odkImport/api/odkImportApi.ts`
- Modify: `server/system/apiRouter.js` (register `odkImportApi.init(router)`, alongside `collectImportApi`/`arenaImportApi`)

**Interfaces:**
- Produces: `POST /survey/odk-import` — chunked upload (`processChunkedFileForBackgroundMerge`, same helper `collectImportApi.js` uses) + `OdkImportService.startOdkImportJob(...)`, responding `{ job: JobUtils.jobToJSON(job) }` once the file is fully merged, or `{ chunkProcessing: true }` mid-upload.

- [x] **Step 1: `odkImportService.ts`** — `startOdkImportJob({ user, filePath, fileId, totalChunks, totalFileSize, newSurvey })` constructs an `OdkImportJob` and hands it to `JobManager.enqueueJob`, mirroring `collectImportService.js`'s `startCollectImportJob`.
- [x] **Step 2: `odkImportApi.ts`** — single `POST /survey/odk-import` route (no survey-schema validation step like Collect's `validateSurveyImportFromCollect`, since ODK has no equivalent pre-import validator yet — deferred).
- [x] **Step 3: Register in `apiRouter.js`** — added the import and `odkImportApi.init(router)` call next to the existing `collectImportApi`/`arenaImportApi` registrations.
- [x] **Step 4: Lint + typecheck** — clean.

---

### Task 4: Survey-create webapp wizard wiring

**Files:**
- Modify: `webapp/components/survey/SurveyCreate/store/importSources.js` (add `odk: 'odk'`)
- Modify: `webapp/components/survey/SurveyCreate/store/actions/useOnImport.js` (add `urlBySource[odk] = '/api/survey/odk-import'`)
- Modify: `webapp/components/survey/SurveyCreate/SurveyCreate.js` (add `dropzoneAcceptBySource[odk]`)
- Modify: `webapp/service/api/utils/apiUtils.js` (new `contentTypes.xml = 'text/xml'`, no `xml` entry existed before — every other import source is zip-based)
- Modify: `core/i18n/resources/{en,fr,pt,mn,ru,es}/surveyCreate.js` (`source.odk: 'ODK (.xml)'` — a product name, left untranslated same as the existing `arena`/`collect` entries in every locale)

- [x] **Step 1–5: Wire the new source into the existing radio-button/dropzone/chunked-upload flow** — no new components needed; `SurveyCreate.js`'s existing `importSourceButtonGroupItems` (`Object.values(importSources).map(...)`) and `ImportStartButton`/`useOnImport` flow pick up the third source automatically once `importSources.odk` exists and the three lookup tables (`urlBySource`, `dropzoneAcceptBySource`, i18n `source.odk`) have an entry.
- [x] **Step 2: Lint** — clean (verified alongside Task 3).

---

### Task 5: End-to-end verification against a real local server (found 4 real bugs)

**Files:**
- Create (scratchpad, not committed): `verify_form.xml`, a realistic multi-feature test XForm (text/decimal/date/geopoint/select1-via-secondary-instance-itemset/repeat/file(image)/readonly-with-body-control fields, itext with English+French translations).
- Modify (bug fixes, all committed): `server/job/jobCreator.js`, `server/modules/odkImport/service/odkImport/metaImportJobs/surveyCreatorJob.ts`, `server/modules/odkImport/service/odkImport/metaImportJobs/nodeDefsImportJob.ts`, `core/survey/_survey/surveyInfo.ts`, `core/survey/survey.js`, `server/modules/surveyRdb/service/surveyRdbCreationJob/surveyRdbDataTablesAndViewsCreationJob.js`.

Static checks (lint/typecheck/unit tests) cannot exercise `NodeDefManager.insertNodeDef`, `CategoryManager.insertItems`, the job-thread worker, or the RDB schema builder — only a real run against a real Postgres instance can. This is exactly what this task did, using the already-running local `arena-db` docker container (port 5444, matching `.env`).

- [x] **Step 1: Build and start the dev server** — `npx cross-env NODE_ENV=development webpack --config webpack.config.server.babel.js`, then `node dist/server.js` in the background, polled `http://localhost:9090/auth/login` until it answered.
- [x] **Step 2: Log in as the local system admin** (`test@openforis-arena.org` / `Test_123`, from `.env`'s `ADMIN_EMAIL`) and `POST /api/survey/odk-import` the test XForm as a `multipart/form-data` file upload (single-file, non-chunked — `processChunkedFileForBackgroundMerge` handles this path via `Request.getFilePath`/`req.files.file`, no `chunk`/`totalChunks` params needed).
- [x] **Step 3: First run — server crashed.** `TypeError: JobClass is not a constructor` in the worker thread, killing the whole `node` process. Root cause: `server/job/jobCreator.js` maintains a top-level `jobClassesByType` registry (only the *outermost* job type needs registering — inner jobs are constructed directly by their parent's constructor) that `OdkImportJob` was never added to. **Fixed**: added the import + array entry, alongside `CollectImportJob` etc.
- [x] **Step 4: Second run (after registry fix) — job failed cleanly** with `SystemError: survey.rootDefNotFound` inside `SurveyRdbDataTablesAndViewsCreationJob`, deep in the composite chain. Since the survey is `temporary: true` and `SurveyCreatorJobHelper.onJobEnd` **deletes** it on any job failure (by design — same as Collect), the evidence disappears on every failed run. **Debugging technique**: temporarily truncated `OdkImportJob`'s inner-job array (dropped the last two reused jobs) to get a `succeeded` run whose survey and node_def rows survive for direct `psql` inspection, found two more bugs that way, fixed them, restored the full chain, and confirmed the *original* failure separately via its actual root cause (Step 4b) rather than just the workaround.
  - **Bug found via `psql` while truncated**: the root `<meta><instanceID/></meta>` bookkeeping node was imported as real NodeDefs (`meta` entity + `instanceID` text attribute) — `NodeDefsImportJob`'s own recursive `_insertNodeDef` walk never checked for it; only the *unused* `XForm.visitPrimaryInstanceNodes` visitor had the skip logic. **Fixed**: added the same `nodeName === 'meta'` guard directly in `_insertNodeDef`.
  - **Bug found via `psql` while truncated**: the survey's `name` prop was the raw XForm title verbatim (`"Verify Odk Import"` — spaces, capitals), not sanitized into a valid identifier; `SurveyUniqueNameGenerator.findUniqueSurveyName` only dedupes, it doesn't sanitize (confirmed by reading its source — it just wraps `UniqueNameGenerator.generateUniqueName`). Collect's importer never hits this because a Collect survey's URI is already a clean identifier. **Fixed**: `StringUtils.normalizeName(...)` (the same sanitizer the survey-create webapp form applies to user-typed names) around the starting name.
  - **Root cause of Step 4's original `rootDefNotFound`**: `SurveyRdbDataTablesAndViewsCreationJob.fetchSurvey()` only fetches a still-*draft* survey's NodeDefs (`fetchDraft = Survey.isFromCollect(surveyInfo) && !Survey.isPublished(surveyInfo)`) when the survey `isFromCollect` — a Collect-import-specific special case (`isFromCollect` = has a `collectUri` info prop). A freshly-imported, unpublished ODK survey has no such prop, so it fell through to fetching *published* NodeDefs (none exist yet) → empty `survey.nodeDefs` → `getNodeDefRoot` throws. This same `isFromCollect` check also gates `Survey.canHaveData`. **Fixed**: added a parallel `odkFormId` survey-info prop (set by `SurveyCreatorJob` from the primary instance's `id` attribute) and `Survey.isFromOdk`, and extended both call sites (`canHaveData` in `core/survey/survey.js`, the `fetchDraft` condition in the RDB job) to also check it — the same mechanism Collect already required, generalized rather than duplicated.
- [x] **Step 5: Rebuild, restart, re-run the full (untruncated) pipeline** — `succeeded`. Verified via direct `psql` queries against `survey_427.node_def`/`.category`/`.category_item` and `information_schema.schemata`:
  - `node_def` tree: root entity correctly excludes `meta`/`instanceID`; `trees` entity has `multiple = true` (repeat correctly detected); `land_use` code attribute has a non-null `categoryUuid`; `photo` file attribute has `fileType: "image"` (from the body `<upload mediatype="image/*">`).
  - `category`/`category_item`: one category (`land_use_list`, from the secondary-instance itemset id) with 3 items (`forest`/`agriculture`/`urban`), correct English labels.
  - `plot_name` attribute's labels resolved via itext indirection to both `{"English": "Plot name", "French": "Nom de la parcelle"}` — confirms the itext pipeline works, not just the literal-label fallback.
  - Survey `languages: ["English", "French"]`, matching the itext `<translation>` langs.
  - `information_schema.schemata` contains `survey_427_data` — the RDB schema-creation step that originally crashed now completes.
- [x] **Step 6: Clean up** — `DELETE /api/survey/{426,427}` (426 was the truncated-debug-run survey, made with the pre-fix code; 427 was the full verified run), confirmed both survey rows and their `survey_42{6,7}*` schemas are gone. Stopped the background dev server.
- [x] **Step 7: Full regression pass** — `yarn build:test:unit && npx jest dist/__tests__/bundle.unit.js` (no `-t` filter this time, since Task 5's fixes touched shared files `core/survey/survey.js`/`surveyInfo.ts`): **689/689 passed**.
- [x] **Step 8: Commit + push** the four fixes as their own commit (separate from the Task 1–4 feature commits), with the failure/root-cause/fix narrative in the commit message.

---

## Note on this plan's phasing

Per the design spec, phases 1–4 (expression conversion + import-issues report, data import with preview, webapp wizard polish, hardening against real ODK Central-exported forms) each get their **own** plan document, written when that phase is started — not pre-written now. This mirrors the repo's existing precedent for large multi-phase work (the `2026-08-19-autoscaling-{0..4}-*.md` series) and, concretely, avoided real waste here: this phase's own design assumptions (e.g. "meta is only a direct child of root", "notes never have a body control") needed correcting *after* seeing real XForm/DB behavior in Task 5, which pre-written literal diffs for not-yet-started phases would not have anticipated either.

## Self-Review Notes

- **Spec coverage**: design spec's "Phase 0" bullet (form import, no expressions) — all of Tasks 1–4. The spec's `odk_import_report`/cross-repo `arena-server` migration note is explicitly Phase 1, not touched here.
- **Convention conformance verified against real code, not assumed**: `Job` subclass shape (`static readonly type`, `constructor(params?: any)`, `context: any = this.context`) checked against `recordsImportSummaryJob.ts` before writing any job class. Test file placement (`test/unit/tests/*.test.ts`, flat, numbered) checked against `test/webpack.config.js`'s actual glob *after* the first nested-file attempt silently produced a 0-test bundle — corrected before proceeding, not left as a known issue.
- **No placeholders**: every step above corresponds to code that exists in the repo on `feat/odk-import` and was lint/typecheck/unit-test/end-to-end verified, not description of code to write later.
