# ODK Import — Phase 3: Webapp Wizard Implementation Plan

> **Status: implemented and verified in a real browser session (headless Chromium via Playwright), including two real bugs found only by actually navigating the UI.** Written retrospectively, like Phases 0-2. Reference spec: `docs/superpowers/specs/2026-09-09-odk-import-design.md`.

**Goal:** Let a user drive ODK data import from the webapp — a 4th tab ("ODK / ODK Collect") in the existing Data Import wizard, alongside CSV/Collect/Arena.

**Architecture:** `DataImportOdkView.js`, structurally identical to `DataImportCollectView.js` (Dropzone + `ImportStartButton`, no preview dialog - matches Phase 2's "no preview job yet" scope), calling a new `API.startOdkDataImportJob` against the Phase 2 endpoint. Wired into `DataImport.js`'s existing `TabBar` as a 4th entry.

**Tech Stack:** React 18, Redux (existing `JobActions.showJobMonitor` / `DialogConfirmActions`), Playwright (verification only, not part of the app).

## Global Constraints

- No preview/summary dialog (matches Phase 2's deferred scope) - straight upload-and-import, same shape as the Collect tab.
- No project-level `run` skill existed for this repo at the start of this phase; verification used Playwright directly against the repo's own `node_modules/playwright` (already present for e2e tests) rather than `chromium-cli`, which wasn't available in this environment.

---

### Task 1: The tab itself

**Files:**
- Create: `webapp/views/App/views/Data/DataImport/DataImportOdkView.js`
- Modify: `webapp/views/App/views/Data/DataImport/DataImport.js` (4th `TabBar` entry)
- Modify: `webapp/service/api/data/index.js`, `webapp/service/api/index.js` (`startOdkDataImportJob`)
- Modify: `webapp/utils/testId/index.js` (`importFromOdkTab`)
- Modify: `core/i18n/resources/{en,es,fr,mn,pt,ru}/dataImportView.js` (`importFromOdk` tab label, `jobs.OdkDataImportJob.importCompleteSuccessfully` message - English text in every locale, matching this repo's existing convention of leaving product-name source labels untranslated, e.g. `importFromCollect: 'Collect / Collect Mobile'` is identical in all 6 locale files already)

- [x] Modeled directly on `DataImportCollectView.js` rather than the Arena tab's preview-dialog version, since Phase 2 has no summary job to preview against yet. `startOdkDataImportJob` is a plain non-chunked `axios.post` (`objectToFormData({ file, cycle }) -> POST /api/odk-import/survey/:surveyId`), same shape as `startCollectRecordsImportJob` - `ImportStartButton` already supports both chunked (`{promise, processor}`) and plain-Promise `startFunction` return shapes, no changes needed there.
- [x] Lint/typecheck clean.

---

### Task 2: Two more `isFromCollect`-only gates, found by actually opening the survey

**Files:**
- Modify: `webapp/views/App/views/Data/Data.js`, `webapp/components/survey/SurveyDefsLoader/SurveyDefsLoader.js`

Before this task, every "can this unpublished survey have data" check fixed on this branch (Phase 0's `SurveyRdbDataTablesAndViewsCreationJob`, Phase 2's `recordManager.js` + `surveyRdbOlapDataTablesCreationJob.js`) was server-side. Trying to actually reach the new tab in a browser surfaced two more, both webapp-side and both blocking navigation entirely rather than just misbehaving:

- [x] `Data.js`'s `draftDefs` (`Survey.isFromCollect(surveyInfo) && !Survey.isPublished(surveyInfo)`) controls whether the whole Data section's `SurveyDefsLoader` loads *draft* NodeDefs at all for an unpublished survey - extended with `isFromOdk`.
- [x] `SurveyDefsLoader.js`'s `requirePublish` bypass (`Survey.isFromCollect(surveyInfo) && Survey.isRdbInitialized(surveyInfo)`) is what lets an *unpublished* survey's Data section render at all instead of a "must publish first" blocker - extended with `isFromOdk`. Without this fix specifically, Data (and therefore Data Import, and therefore this whole tab) would never have been reachable for an ODK-imported survey before publishing.
- [x] Other `isFromCollect` sites in `webapp/` (`SurveyInfo.js`, `ChainDetails.js`, `SurveyDefsLoader.js`'s own analysis-log-related check, `useShouldShowFirstTimeHelp.js`) remain untouched - not on the path this phase's verification actually exercised, and each needs its own judgment call about whether ODK parity is even correct there. Left as an explicit follow-up, not silently ignored.

---

### Task 3: A schema-import bug, found only by trying to publish for real

**Files:** `core/survey/odkImportReportItem.ts`, `server/modules/odkImport/service/odkImport/metaImportJobs/nodeDefsImportJob.ts` (committed separately from Task 1/2 - see that commit's message for the full account).

Reaching the tab required a *published* survey (`Authorizer.canImportRecords` requires it, unconditionally, for every import source). Publishing an ODK-imported survey always failed, because no attribute was ever marked as an Arena "key" - a real, previously-only-theoretical gap from Phase 0 that turned out to hard-block the entire Data Import UI, not just degrade duplicate-detection the way Phase 2 had already found and worked around. Fixed by defaulting the first eligible attribute under each entity (root and every repeat) to be that entity's key; an entity with no eligible candidate is flagged via a new `missingEntityKey` report item instead of silently failing to publish later. See that commit for the two-step debugging path (root-only fix wasn't enough; repeat entities needed their own key too, found by publishing again and reading the exact same `NodeDefsValidationJob` failure a second time).

---

### Task 4: Live browser verification

**Files:** scratchpad only (not committed): `verify_ui3.mjs`/`verify_ui4.mjs` (Playwright scripts), `verify_form.xml`, `verify_submissions.zip`.

- [x] **Setup:** started both dev servers (`webpack.config.server.babel.js` build + `node dist/server.js` on :9090, `NODE_ENV=development npx webpack serve` on :9000, matching `yarn watch`'s two halves run separately). No `chromium-cli` available in this environment; used this repo's own `node_modules/playwright` (already a devDependency for e2e tests) directly via a small `.mjs` script instead.
- [x] **Navigation debugging, resolved without assuming a bug:** the sidebar's "Data" icon is a hover-to-reveal-submenu parent (`disabledModuleLink = hasChildren` in `Module.js`), not a clickable link - confirmed by reading the source before concluding it was broken. A parent-`div` pointer-event interception needed `hover({ force: true })` to work around in the headless test harness specifically (not an app bug).
- [x] **First blocker (session-level, not a bug):** `canImportRecords` requires `Survey.isPublished` - led directly to Task 3's fix once traced.
- [x] **Result, after all three fixes:** all 4 tabs render correctly with the ODK tab's dropzone (`(Only .zip files...)`) and disabled/enabled `Start import` button behaving correctly; actually dropped `verify_submissions.zip` via the real file input and clicked Start import; got the exact completion dialog `"ODK data import complete: - 1 records created - 0 duplicate submissions skipped"`; confirmed via `psql` that the resulting record's values matched Phase 2's API-driven verification exactly (same geopoint split, same category lookup, same file import).
- [x] Cleaned up the test survey, stopped both dev servers by port (not `pkill -f`, which repeatedly killed sibling background tasks sharing part of the command string - a session mechanic worth remembering, not an app issue), full unit suite (703/703) re-run clean, then committed.

---

## Note on this plan's phasing

Phase 4 (hardening against real ODK Central-exported forms, itext/default-language edge cases, `barcode`/`note`/`dateTime` review, performance) remains - see the design spec. Unlike Phases 0-3, it isn't a single bounded deliverable so much as an ongoing quality pass; its own plan doc, when started, should reflect that shape rather than force it into the same "implement + verify + commit" template.

## Self-Review Notes

- **Spec coverage:** design spec's webapp-wizard bullet, minus the preview dialog (explicitly deferred with Phase 2, not silently dropped here either).
- **Every fix above is backed by a concrete failure this phase actually hit** (a missing tab, a blocked navigation, a failed publish, a validation error read from the server log) **and a concrete verification after fixing it** (a screenshot, a DB query, or both) - nothing here is aspirational.
- **Scope discipline held under pressure to "just get the screenshot":** when navigation kept failing, the fix each time was to read the actual component source (`Module.js`, `authorizer.ts`, `nodeDefsValidationJob.js`) and understand *why*, not to keep guessing selectors or work around symptoms - which is exactly what surfaced Task 2 and Task 3, neither of which would have been found by API-only testing.
