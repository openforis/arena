# ODK Import — Phase 2: Data Import Implementation Plan

> **Status: implemented and verified end-to-end against a live Postgres instance, including a real bug found and fixed live.** Written retrospectively, like Phases 0-1. Reference spec: `docs/superpowers/specs/2026-09-09-odk-import-design.md`.

**Goal:** Import an ODK Briefcase-style submissions export (zip of `<instanceId>/submission.xml` + media, one dir per submission) into records of an existing, ODK-imported (or matching-schema) Arena survey.

**Architecture:** `OdkDataImportJob` chains `PrepareImportFileJob` (reused) → `OdkSubmissionReaderJob` (opens the zip, enumerates submission entries) → `RecordsImportJob` (the core: one Record built per submission, via the `odkNodeDefsInfoByPath` survey prop Phase 1's `NodeDefsImportJob` persists) → `RecordCheckJob` (reused, fills in any missing single nodes / re-validates). Exposed via `POST /odk-import/survey/:surveyId`. No preview/summary job or webapp UI yet — deferred, see Task 4.

**Tech Stack:** Same as Phases 0-1.

## Global Constraints

- Conflict policy is v1-simple by design: ODK's own `<meta><instanceID>` is reused directly as the Arena record's uuid, so re-importing an identical submission collides on uuid and is skipped. No overwrite/merge.
- Only the attribute types Phase 0 actually maps are handled: text/integer/decimal/date/time/coordinate(geopoint)/code(select1+select)/file. No taxon (ODK has no native taxon concept) and no geotrace/geoshape value conversion yet (schema import already flags these as lossy at the type-mapping stage; wiring the actual GeoJSON value conversion into data import is a follow-up, not attempted here).

---

### Task 1: Relocate `recordImportMatcher.ts` to a shared home

**Files:**
- Moved: `server/modules/mobile/service/arenaMobileDataImport/jobs/recordImportMatcher.ts` → `server/modules/dataImport/service/DataImportJob/recordImportMatcher.ts`
- Modified (import path only): `server/modules/mobile/service/arenaMobileDataImport/jobs/recordsImportJob.js`, `recordsImportSummaryJob.ts`

- [x] Its matching/conflict-decision logic (`findExistingRecordSummary`, `determineRecordAction`) is source-agnostic (generic `{ survey, record }` params, nothing Arena-mobile-specific), so it moved to where `DataImportBaseJob`/`DataFilesImportJob` already live, rather than being forked for ODK. `git mv` + two import-path updates; full unit suite (703/703) re-run clean before committing, since this touches already-shipped mobile-import code.

---

### Task 2: `odkNodeDefsInfoByPath` - the join key data import needs

**Files:**
- Modify: `core/survey/_survey/surveyInfo.ts`, `core/survey/survey.js` (new `odkNodeDefsInfoByPath` info key/accessor)
- Modify: `server/modules/odkImport/service/odkImport/metaImportJobs/nodeDefsImportJob.ts` (persist it)

- [x] Realized before writing any data-import code (not discovered by a failure) that submission element names match the XForm primary instance 1:1, but the *Arena* NodeDef name may differ from the raw XForm element name - `NodeDefUniqueNameGenerator` renames on a keyword clash or duplicate. So the join from a submission path to an Arena NodeDef can't be re-derived from the current schema; it has to be captured once, at schema-import time, from the same `nodeDefsByXFormPath` map the expression converter already builds (Phase 1). Persisted as a plain `{ path: nodeDefUuid }` object survey prop, same pattern as Collect's existing `collectNodeDefsInfoByPath`.

---

### Task 3: The import job pipeline

**Files:**
- Create: `server/modules/odkImport/service/odkImport/dataImportJobs/odkSubmissionReaderJob.ts`
- Create: `server/modules/odkImport/service/odkImport/dataImportJobs/odkAttributeValueExtractor.ts`
- Create: `server/modules/odkImport/service/odkImport/dataImportJobs/recordsImportJob.ts`
- Create: `server/modules/odkImport/service/odkImport/odkDataImportJob.ts`
- Create: `server/modules/odkImport/service/odkDataImportService.ts`, `server/modules/odkImport/api/odkDataImportApi.ts`
- Modify: `server/system/apiRouter.js`, `server/job/jobCreator.js` (registered `OdkDataImportJob` from the start this time, having learned that lesson in Phase 0)
- Modify: `server/modules/odkImport/service/odkImport/model/xform.ts` (exported `getElementText`, already used internally for schema import, now reused for reading a submission leaf's own text content)

- [x] **`OdkSubmissionReaderJob`**: opens the zip with `FileZip` (streaming entry read, same convention as every other importer), enumerates every `*/submission.xml` entry.
- [x] **`odkAttributeValueExtractor.ts`**: per-type value extraction from a submission element's raw text - geopoint splits "lat lon alt acc" into Arena's `{x: lon, y: lat, srsId: '4326', altitude, accuracy}` coordinate shape; `code` looks up the Arena `CategoryItem` by the submitted code via `CategoryItemProviderDefault.getItemByCode` (multi-select splits on whitespace and returns one value per selected code, since Arena represents a multi-select as sibling nodes, not one array-valued node); `file` returns the raw filename, left to the caller to resolve against the zip.
- [x] **`recordsImportJob.ts`**: for each submission, builds one Arena Record by recursively walking the submission XML (grouping same-named siblings to handle repeats - multiple `<trees>` elements at the same level become multiple Arena entity instances), resolving each path through `odkNodeDefsInfoByPath`, creating one Node per attribute (or per selected multi-select code, or one via a real `insertFile` + `Node.assocValue` for `file` attributes - see the bug below), then bulk-persisting via the existing `BatchPersister`/`RecordManager.insertNodesInBulk`.
- [x] **Two real bugs found and fixed before ever running this live** (caught while writing the code, the same way Phase 1's FK bug was):
  - A `Record<string, string>` type annotation silently collided with the already-imported `Record` *value* import (`import * as Record from '@core/record/record'`) - fixed by using an inline `{ [path: string]: string }` shape instead of TypeScript's built-in generic.
  - The file-attribute path built *two separate* `Node.newNode(...)` calls with two different uuids - one to get a uuid for `SurveyFile.createFile`'s `nodeUuid` param, a second (never related to the first) to actually hold the value - meaning the file record would point at a node that was never inserted, and the inserted node would carry no file reference. Fixed to create the node once and use `Node.assocValue(...)` to add the value in place, matching Collect's own `collectAttributeValueExtractor.js` pattern.
- [x] Composite job + service + API, mirroring the Phase 0 shapes exactly, `OdkDataImportJob` added to `jobCreator.js`'s registry immediately (not after a crash, this time).
- [x] Lint/typecheck clean; full unit suite (703/703) re-run.

---

### Task 4: Live verification (found and fixed a real conflict-detection bug)

**Files:** scratchpad only (not committed): `verify_submissions.zip` (one submission, two `trees` repeats, one photo).

- [x] **Step 1:** built a real Briefcase-style zip by hand (`<uuid>/submission.xml` + `tree1.jpg`), imported a fresh schema (Phase 0's `verify_form.xml`) to get a clean survey, then `POST`ed the zip through the real HTTP API against the live DB.
- [x] **Step 2:** first run succeeded; `psql` confirmed the record and all 15 nodes: `plot_name`/`area`/`survey_date` as plain values, `location` correctly split into `{x: 11.3387 (lon), y: 44.4938 (lat), srs: "4326", accuracy: 4.2, altitude: 55}`, `land_use` resolved to a real `CategoryItem` uuid, two `trees` entities correctly nested under the root, the first tree's `photo` correctly holding a real `fileUuid`/`fileName`/`fileSize` from the actually-inserted file, and (a nice bonus, not something this code did directly) `RecordCheckJob` filling in a `null`-valued `photo` placeholder node on the second tree, which had no photo in the submission - existing Arena infrastructure keeping the record structurally complete, working exactly as designed.
- [x] **Step 3, the real bug:** re-uploaded the identical zip to check duplicate handling - it was **not** skipped, a second full duplicate record was inserted. Root cause: Phase 0's schema import never marks any attribute as a Arena "key" (an explicit, known gap - ODK has no direct equivalent concept), so the key-based duplicate matching the code was relying on (`findExistingRecordSummary` with the `merge` strategy) had nothing to match on. **Fixed** by extracting ODK's own `<meta><instanceID>` (already a stable, globally-unique identifier per submission, conventionally `uuid:<uuid>`) and reusing it directly as the Arena record's uuid, checked against existing records' uuids *before* even inserting a record row - this has no dependency on the schema having a key attribute at all, and is arguably the more ODK-idiomatic fix regardless.
- [x] **Step 4:** deleted the test survey, re-imported schema + data fresh, re-ran the full value-correctness check (all identical to Step 2), then re-uploaded the same zip a second time and confirmed the record count stayed at 1 - the duplicate was correctly skipped this time.
- [x] **Step 5:** cleaned up the test survey, stopped the dev server, full unit suite re-run (703/703) before committing.

---

## Note on this plan's phasing

Phases 3 (webapp wizard for data import + preview UI) and 4 (hardening against real ODK Central-exported forms) remain, each getting its own plan doc when started - see the design spec.

## Self-Review Notes

- **Spec coverage:** design spec's data-import bullet, minus the preview/summary job and webapp UI (explicitly deferred to Task 4/Phase 3, not silently dropped).
- **Both real bugs this phase found (the type/value collision + the duplicate-record bug) are backed by either a typecheck failure or a live before/after DB check recorded above** - nothing here is aspirational.
- **Known limitation carried forward from Phase 0, not fixed here:** no attribute is marked as an Arena "key" during schema import, so Arena's own native key-based tooling (record summaries, the `merge` conflict strategy proper) still won't behave meaningfully for an ODK-imported survey until that's addressed - tracked as a Phase 0/schema-import follow-up, worked around (not fixed) here via the instanceID-as-uuid approach.
