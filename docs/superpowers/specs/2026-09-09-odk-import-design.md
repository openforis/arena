# ODK Import

## Purpose

Arena can import surveys/data from Collect Desktop (`server/modules/collectImport/`) and from Arena's own mobile/backup format (`server/modules/mobile/service/arenaMobileDataImport/`), but not from ODK (Open Data Kit), a widely used field-data-collection tool. This spec adds an ODK importer that mirrors the architecture of those two existing importers, so ODK users can migrate their forms and collected data into Arena.

## Scope

1. **Form/schema import**: parse a compiled XForm XML file (the W3C XForm dialect ODK Collect/Central actually run — what ODK Central's form export or pyxform produces) into a new Arena survey: NodeDefs (entities/attributes, correct types, repeats), Categories (choice lists), multi-language labels.
2. **Data import**: import an ODK Briefcase-style submissions export (zip of `<instanceId>/submission.xml` + media, one dir per submission) into Arena records, either right after form import or later into any survey with a matching schema. Preview-before-commit UX with conflict resolution, mirroring the mobile importer.
3. All new code in TypeScript.

Out of scope (explicit product decisions, not oversights):
- No live ODK Central REST API integration — file upload only, v1.
- No XLSForm (`.xlsx`) support — only the compiled XForm XML. XLSForm→XForm compilation is pyxform's job (a Python tool with no established port here); reimplementing it is a separate, much larger effort.
- No automatic conversion of ODK `choice_filter` (cascading/filtered choice lists) — imported as flat lists, flagged for manual review.
- No general XPath engine for `relevant`/`constraint`/`calculate` — a regex-based transpiler covering ODK's common function vocabulary (`selected()`, `if()`, relative paths), same approach as the existing Collect importer's `collectExpressionConverter.js`. Expressions it can't convert are logged, not silently dropped, and import never blocks on a failed conversion.

## Architecture — reuse existing importer infrastructure

No existing ODK/XForm groundwork exists anywhere in the repo (verified by search) — this is greenfield, but built as a new sibling module (`server/modules/odkImport/`) following the exact same shape as the two reference importers below. Do not invent new abstractions where these already establish the pattern.

| Concern | Existing reference (read, don't guess) |
|---|---|
| Composite job chaining | `server/modules/collectImport/service/collectImport/collectImportJob.js` — a top-level `Job` subclass passes an array of inner job instances as the 3rd constructor arg to `super(Type, params, innerJobs)`; they run sequentially with merged context/aggregated progress. |
| Foreign-XML accessor DSL | `server/modules/collectImport/service/collectImport/model/collectSurvey.js` — pure Ramda functions over an `xml-js` compact-mode tree (`getAttribute`, `getElementsByName`, `visitNodeDefs`). |
| Foreign schema → NodeDef mapper | `.../metaImportJobs/nodeDefsImportJob/nodeDefsImportJob.js` — recursive `insertNodeDef(parentNodeDef, parentPath, foreignNodeDef, type, field)`, calls `NodeDefManager.insertNodeDef({ user, survey, nodeDef, system: true }, tx)` then `NodeDefManager.updateNodeDefProps(...)` for advanced props (validations/expressions), tracks `nodeDefsInfoByPath` for later data-import path resolution. |
| Code list → Category import | `.../metaImportJobs/categoriesImportJob.js` — one `Category`/`CategoryLevel` per foreign list, `BatchPersister`-batched `CategoryItem` inserts, `CategoryManager.validateCategories` at the end. |
| Survey shell creation | `.../metaImportJobs/surveyCreatorJob.js` — `Survey.newSurvey(...)` → `SurveyManager.insertSurvey({ user, surveyInfo, createRootEntityDef: false, system: true, temporary: true })`. |
| Foreign record XML → Record/Node tree | `.../dataImportJobs/recordsImportJob.js` — BFS build, bulk persist via `RecordManager.insertNodesInBulk`. |
| Dry-run preview + conflict resolution (TS) | `server/modules/mobile/service/arenaMobileDataImport/jobs/recordsImportSummaryJob.ts` + `recordImportMatcher.ts` (source-agnostic `ConflictResolutionStrategy`/`RecordImportAction` decision logic, reusable as-is). |
| Chunked upload + job-start API | `server/modules/collectImport/api/collectImportApi.js` (`processChunkedFileForBackgroundMerge`, `JobUtils.jobToJSON`), registered in `server/system/apiRouter.js`. |
| Job base class | `server/job/job.js` (wraps `JobBase` from `@openforis/arena-core`; `this.tx`, `this.context`, `incrementProcessedItems()`, `isCanceled()`, `logDebug/Info/Warn/Error`). |
| Zip/XML parsing | `server/utils/file/fileZip.js` (`node-stream-zip`, streaming entry read — not full extraction), `server/utils/file/fileXml.js` (`xml-js` compact mode). Reused, no new dependencies. |
| Survey-creation wizard import source | `webapp/components/survey/SurveyCreate/SurveyCreate.js` + `store/importSources.js` (currently `{ arena, collect }`). |

## XForm structure — the key design difference from Collect

Collect's schema is one self-describing tree: `<entity>`/`<attribute>` elements nest exactly like the target NodeDef tree, with type/validation on the same element. XForm splits this across **three disjoint locations joined by an XPath `nodeset` path**:

- **Primary instance** (`<model><instance><data>...</data></instance></model>`) — defines node *shape* (entity/attribute nesting), not repeat cardinality.
- **Body** (`<h:body>`) — defines display, and, critically, **where repeats are**: `<repeat nodeset="/data/group">` wrapping a `<group ref="/data/group">`. A primary-instance node is only "multiple" if some body `<repeat>` references its absolute path; a `<group>` with no wrapping `<repeat>` is a single (non-multiple) entity.
- **Binds** (`<bind nodeset="..." type="..." relevant="..." constraint="..." required="..." calculate="..." readonly="..."/>`) — a flat list, keyed by `nodeset`, not nested.

`xform.ts` (§ Phase 0 plan) builds path-keyed lookups from each of the three and joins them during the NodeDef walk.

## Type mapping (verified against `core/survey/nodeDefType.js`: integer/decimal/text/date/time/boolean/code/coordinate/geo/taxon/file/entity/formHeader)

| ODK bind `type` | Arena `nodeDefType` | Notes |
|---|---|---|
| `string` | `text` | |
| `int` | `integer` | |
| `decimal` | `decimal` | |
| `date` | `date` | |
| `time` | `time` | |
| `geopoint` | `coordinate` | Space-separated `lat lon alt acc` splits onto Arena's coordinate fields (`x`/`y`/`altitude`/`accuracy`). |
| `geotrace`/`geoshape` | `geo` | Arena's `geo` type stores GeoJSON (`core/geo/geoJsonUtils.ts`) — LineString/Polygon conversion is a genuine mapping, flagged as lossy (per-vertex altitude, edge cases) rather than treated as a gap. Deferred to the data-import phase (not needed for schema import). |
| `binary` | `file` | image/audio/video disambiguated via the body `<upload mediatype="...">` attribute, not the bind alone. |
| `select1` | `code` | Backed by a Category — see choice-list handling below. |
| `select` | `code` + `multiple: true` | |
| `barcode` | `text` | Flagged: scan-assist UX is lost, data is preserved as text. |
| `dateTime` | `text` | No Arena equivalent; ISO-8601 literal preserved as text, flagged. |
| `note` (readonly `string` bind, no user input) | *(skipped)* | Arena has no display-only "note" NodeDef type. No attribute is created; flagged so users know one was dropped, not silently lost. |
| `calculate` | underlying type, mapped to Arena's default-value expression | Deferred to the expression-conversion phase — Phase 0 creates the attribute with its underlying type but leaves the calculation unconverted. |

Every unmapped/lossy/skipped case must produce a report item, never a silent drop (this contract is only fully wired up once the import-report table exists — see below; Phase 0 logs via `this.logWarn` until then).

## Choice lists → Categories

Two ODK shapes, both converging on the same `BatchPersister`-based insert `categoriesImportJob.js` already uses:
1. **Inline literal choices** — `<item><label>Red</label><value>red</value></item>` as children of the `<select1>`/`<select>` body element.
2. **Secondary-instance choices** — `<instance id="list_id"><root><item>...</item></root></instance>` referenced via `<itemset>instance('list_id')/root/item</itemset>` — the idiom pyxform/ODK Central actually compile to. Needed for real-world forms, not just spec-minimal ones.

Cascading (`choice_filter`) lists are imported flat (single level), flagged for manual review — not auto-converted (see Scope).

## Import-issues report

A parallel `odk_import_report` table/manager/webapp view, not shared with Collect's `collect_import_report` — the taxonomies differ enough (ODK adds `unmappedType`, `lossyGeoConversion`, `choiceFilterNotConverted`, `skippedNote`; lacks Collect's `codeParent`) that forcing a shared schema now costs more than it saves.

**This table requires a change in a separate repo, `@openforis/arena-server`.** Verified: `collect_import_report` is not created by any migration in the `arena` repo — there are no raw `.sql` files here. It's defined in `@openforis/arena-server` (dependency `^2.2.8`; sibling checkout at `/home/stefano/dev/projects/openforis/arena-server`), in its per-survey-schema `db-migrate` pipeline at `src/db/dbMigrator/migration/survey/migrations/` (see `20190315100007-add-table-collect-import-report.js` + its `sqls/*-up.sql`/`*-down.sql`, auto-discovered by timestamp-prefixed filename, no index to update). Arena triggers these via `DBMigrator.migrateSurveySchema(surveyId)` (`server/modules/survey/manager/surveyManager.js`). Adding `odk_import_report` therefore needs: (1) a new timestamped migration in `arena-server` following that exact pattern, (2) a version bump + publish of `arena-server`, (3) bumping `@openforis/arena-server` in `arena`'s `package.json`. This is a cross-repo dependency — sequence it before the phase that needs the report table (not Phase 0).

## Data import (ODK Briefcase-style export)

Reuse `FileZip`/`fileZip.js` streaming entry read (not full extraction) to walk `<instanceId>/submission.xml` + media, the same BFS Record/Node-building shape as `recordsImportJob.js` (simpler here, since submission element names match the primary-instance shape 1:1 — no foreign-name translation table needed), and the mobile importer's dry-run/real job pair + `recordImportMatcher.ts` for preview-before-commit. Deferred to a later phase — not part of Phase 0.

## Phasing

Phases are tracked as separate plan documents in `docs/superpowers/plans/`, following this repo's precedent for large multi-phase features (see the `2026-08-19-autoscaling-{0..4}-*.md` series). Each phase's plan doc is written (in the checkbox-task format) when that phase is reached, not all upfront — XForm parsing details in particular are expected to need adjustment once real fixtures are tested against, and pre-writing exact diffs for code that doesn't exist yet, for phases 2 sessions away, would go stale before it's used.

0. **Form/schema import, no expressions** — `xform.ts` model, type mapping, survey/NodeDef/Category creation, chunked-upload API, minimal wizard entry point. Plan: `docs/superpowers/plans/2026-09-09-odk-import-0-form-schema-import.md`.
1. **Expression conversion + import-issues report** — `odkExpressionConverter.ts` (regex transpiler, parallel to `collectExpressionConverter.js`, not shared), `arena-server` migration for `odk_import_report`, report manager/API/webapp view.
2. **Data import with preview** — submission zip parsing, `recordImportMatcher.ts` reuse (relocate to `server/modules/dataImport/service/` first, shared with mobile), preview dialog.
3. **Webapp wizard polish** — full data-import view/dialog fidelity, progress/cancel/error UX.
4. **Hardening** — itext/default-language edge cases, `barcode`/`note`/`dateTime` review against real ODK Central-exported forms (not just spec-minimal fixtures), performance pass, geo conversion round-trip checks.
