# ODK Import — Phase 1: Expression Conversion + Import Report Implementation Plan

> **Status: implemented and largely verified end-to-end against a live Postgres instance; the persisted report table itself is unverified live pending an external release (see Task 3).** Written retrospectively, like the Phase 0 plan. Reference spec: `docs/superpowers/specs/2026-09-09-odk-import-design.md`.

**Goal:** Convert XForm `relevant`/`constraint`/`calculate`/`required` expressions into Arena's own expression language during form import, and persist every conversion attempt (success or failure) plus every type-mapping/category issue as a reviewable import-report item, mirroring Collect's `collect_import_report`.

**Architecture:** `odkExpressionConverter.ts` (regex-transpiler, mirroring `collectExpressionConverter.js`) resolves XForm path references into Arena's bare-name/dotted-ancestor-chain expression syntax and validates every result via the real `NodeDefExpressionValidator` before accepting it. `NodeDefsImportJob` calls it for each bind's `relevant`/`constraint`/`calculate`, applying successful conversions via a second `updateNodeDefProps` call (same two-phase insert-then-update shape Collect's importer uses), and logs every attempt as an `OdkImportReportItem` (`core/survey/odkImportReportItem.ts`), persisted via a new `odkImportReportManager`/`Repository` pair into a new `odk_import_report` table — which required a migration in the separate `arena-server` repo (committed locally there, not published — see Task 3).

**Tech Stack:** Same as Phase 0 (TypeScript, Express, pg-promise, Jest).

## Global Constraints

- `if(cond, a, b)` is explicitly NOT converted — discovered live (Task 1) that Arena's `NodeDefExpressionValidator` rejects conditional/ternary expressions outright (`expression.notSupported`/`conditional`), so producing a ternary would always fail validation. Left unconverted/flagged instead of guessed.
- `required` is only auto-set when the XForm bind's value is a literal `true()`/`false()`; a non-trivial `required` expression has no Arena expression slot to convert into (Arena's `required` is a plain boolean, unlike `relevant`/`constraint`/`calculate`) and is flagged for manual review instead.
- `choice_filter` (cascading choice lists) remains out of scope, per the design spec — unchanged from Phase 0.
- No webapp review UI for the report yet (Task 4) — deferred, not attempted this phase.

---

### Task 1: `odkExpressionConverter.ts` — XForm XPath → Arena expression

**Files:**
- Create: `server/modules/odkImport/service/odkImport/metaImportJobs/nodeDefsImportJob/odkExpressionConverter.ts`
- Create: `test/unit/tests/048odkExpressionConverter.test.ts`

**Interfaces:**
- Produces: `OdkExpressionConverter.convert({ survey, nodeDefCurrent, currentXFormPath, nodeDefsByXFormPath, expression }): Promise<string | null>`.

- [x] **Step 1: Path resolution.** `resolveXFormPathToArenaExpression` finds the longest path prefix a target shares with the *current node's own parent* (its evaluation context): a full match (same-entity sibling) resolves to a bare name; a partial match (crossing into an ancestor's entity) resolves to a dot-joined chain starting from the shared ancestor itself — confirmed against `collectExpressionConverter.js`'s own test fixtures (`parent()/remarks` → `cluster.remarks`), since Arena's expression syntax is shared infrastructure, not something new per importer.
- [x] **Step 2: Regex-transpiler pass** for `selected(x, 'v')` → `includes(x, 'v')`, absolute/relative path tokens, self-reference (`.` → `this`), `and`/`or`/`not`/`=`/`true()`/`false()`/`today()`, ending in `NodeDefExpressionValidator.validate` — unconvertible input returns `null`, never a guess.
- [x] **Step 3: Unit tests against a real survey fixture**, not mocks — `DataTest.createTestSurvey` (the same cluster/plot/tree fixture `008CollectExpressionConverter.test.js` already uses), with a synthetic `nodeDefsByXFormPath` map standing in for real XForm paths. This is what actually caught the three bugs below; a mocked validator would have hidden all of them.
- [x] **Step 4: Three real bugs found and fixed by the test run**, not by inspection:
  - `ABSOLUTE_PATH_PATTERN` matched mid-string inside a relative path (`"../plot_details/plot_remarks"`'s `/plot_details/plot_remarks` tail parsed as if it were a rooted absolute path) — fixed with a negative lookbehind so a genuine absolute path is never preceded by a word character, `.`, or `/`.
  - `RELATIVE_DOTS_PATH_PATTERN` only consumed one segment after the leading dots — `"../a/b"` left `/b` dangling as raw text. Fixed to consume every subsequent segment.
  - The ancestor-crossing dotted chain was missing its own ancestor segment (`"cluster.remarks"` computed as bare `"remarks"`) — fixed the loop's start index to include the shared ancestor when the reference crosses out of the current entity, not just when it stays within it.
- [x] **Step 5: One hard constraint discovered live, not assumed:** `if()` → ternary conversion was implemented, tested, and then found to always fail Arena's real validator (`expression.notSupported`/`conditional`). Removed the ternary-conversion machinery entirely (`convertIfCalls`/`splitTopLevelArgs`) rather than shipping dead code that can never succeed; `if()` now short-circuits to `null` before ever reaching the validator.
- [x] **Step 6:** lint, typecheck, `yarn build:test:unit && npx jest dist/__tests__/bundle.unit.js -t odkExpressionConverter` → 14/14 pass. Full suite (703/703) re-run clean after.

---

### Task 2: Wire conversion + reporting into `NodeDefsImportJob`

**Files:**
- Modify: `server/modules/odkImport/service/odkImport/metaImportJobs/nodeDefsImportJob.ts`
- Create: `core/survey/odkImportReportItem.ts`
- Create: `server/modules/odkImport/manager/odkImportReportManager.ts`, `server/modules/odkImport/repository/odkImportReportRepository.ts`

**Interfaces:**
- Produces: `nodeDefsByXFormPath: Map<path, ArenaNodeDef>`, built and extended as every entity/attribute is inserted (and again after its `propsAdvanced` update, so later siblings can resolve through it) — the converter's only way to turn a path into a name.
- Produces: `OdkImportReportItem.itemTypes` — `relevant`/`constraint`/`calculate`/`requiredExpr`/`unmappedType`/`lossyGeoConversion`/`skippedNote`/`choiceFilterNotConverted`/`missingCategory`.

- [x] **Step 1:** for each attribute with a bind, `_applyExpressions` converts `relevant`→`applicable`, `constraint`→`validations.expressions`, `calculate`→`defaultValues`, applied via a second `NodeDefManager.updateNodeDefProps` call (base NodeDef already inserted by then, so its uuid/parent chain exist for the converter and for `nodeDefsByXFormPath`).
- [x] **Step 2:** a calculated attribute (`bind.calculate` present) is marked `readOnly: true`, matching Collect's own convention for calculated attributes — found missing during Task 3's live check, fixed same session.
- [x] **Step 3: A real FK bug, found before it ever reached a live run** (caught while writing the insert, not by testing — worth recording because the fix shapes the data model): `odk_import_report.node_def_uuid` has a `NOT NULL` FK to `node_def.uuid`. Two callers were pushing a report item *before* any NodeDef existed to reference: a type-mapping issue (flagged before insert, including the `skip` case where no NodeDef is ever created for that path at all) and a missing-category issue (checked before insert). Fixed by attaching the first to the *parent* entity (always already inserted) and moving the second to *after* the attribute's own insert, once its real uuid exists.
- [x] **Step 4:** `yarn build:test:unit && npx jest ...` (no filter) → 703/703 pass (no regression from the wiring).

---

### Task 3: Live verification (with the report-table blocker worked around)

**Files:**
- arena-server (sibling repo, branch `feat/odk-import-report-table`, **not pushed/published**): `src/db/dbMigrator/migration/survey/migrations/20260910202731-add-table-odk-import-report.js` + `sqls/*-up.sql`/`*-down.sql`, mirroring `collect_import_report`'s migration exactly.
- Scratchpad (not committed): `verify_form_expr.xml`.

The `odk_import_report` table doesn't exist in the currently-published `@openforis/arena-server@2.2.8` (verified: `arena`'s `package.json` resolves it from GitHub Packages, not the local sibling checkout — no `portal:` link is in place on this branch, unlike the precedent on `feat/auto-scaling`). Publishing a new arena-server version isn't something this session can do (it's a real, externally-visible registry action). Rather than block all live verification on that, or leave the new code entirely unverified:

- [x] **Step 1:** wrote the migration in the local `arena-server` checkout on its own branch (`feat/odk-import-report-table`), confirmed it compiles and lands in `dist/` correctly (`yarn build` there), and committed it locally — ready for the arena-server maintainers to review/publish, but explicitly not pushed by this session.
- [x] **Step 2:** temporarily commented out the one line that calls `OdkImportReportManager.insertItems` (the only thing that actually touches the not-yet-existing table), to verify everything *else* live: built `verify_form_expr.xml` (a form with a `selected()`-based `relevant`, a sibling `relevant`, a self-referencing `constraint`, and a `calculate`), ran it through the real API against the local DB, and confirmed via `psql` that all four converted correctly onto real `node_def.props_advanced_draft` rows:
  - `selected(../land_use, 'other')` → `applicable: [{"expression": "includes(land_use, 'other')"}]`
  - `../area * 2` (calculate) → `defaultValues: [{"expression": "area * 2"}]`
  - `../status = 'alive'` (relevant, inside a repeat) → `applicable: [{"expression": "status == 'alive'"}]`
  - `. > 0` (constraint) → `validations.expressions: [{"expression": "this > 0"}]`
- [x] **Step 3:** restored the real `insertItems` call (the correct, permanent code), re-verified the Phase 0 no-expression fixture still succeeds (its `reportItems` array stays empty, so `insertItems`'s `items.length > 0 &&` guard means it never actually queries the missing table — this is *why* Phase 0's own verification kept working through all of Phase 1's changes). Cleaned up every test survey created during this task.
- [ ] **Not done, deliberately:** a live round-trip through the actual `odk_import_report` table itself (insert + list + resolve). Blocked on the arena-server release; revisit once that's published, by portal-linking temporarily (the `feat/auto-scaling` precedent's own documented pattern) the way this task avoided doing, or once a real published version exists.

---

### Task 4: Report API endpoints (webapp UI deferred)

**Files:**
- Modify: `server/modules/odkImport/api/odkImportApi.ts`, `server/modules/odkImport/service/odkImportService.ts`

- [x] `GET /survey/:surveyId/odk-import/report` (list), `.../report/export` (xlsx/csv via the existing `FlatDataWriter`), `.../report/count`, `POST .../report/:itemId/resolve` — mirroring `collectImportApi.js`'s report routes exactly, minus the per-language `messageLangCode` machinery (ODK report messages are single-language, derived from XForm paths/type names, not translated text).
- [ ] **Deferred, not attempted:** a webapp `OdkImportReport` view (parallel to `CollectImportReport`). The API is reachable and correct; building a whole review UI for data that can't be persisted yet (Task 3) isn't a good use of this session's remaining time relative to Phase 2 (data import), which has no such external blocker. Revisit alongside Task 3's follow-up.

---

## Self-Review Notes

- **Spec coverage:** design spec's Phase 1 bullet, in full for the conversion/report-model/report-API pieces; the webapp review UI is explicitly carried forward, not silently dropped.
- **Every "done" claim above is backed by either a passing test run or a live DB inspection recorded in this file** - nothing here is aspirational.
- **Cross-repo dependency is tracked, not hidden:** the `arena-server` migration exists on a real branch in the sibling checkout, is known-buildable, and its non-published status is the reason two checkboxes above are explicitly left unchecked rather than misreported as done.
