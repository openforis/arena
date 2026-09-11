# ODK Import — Phase 4: Hardening

> **Status: ongoing.** Unlike Phases 0-3, this isn't a single bounded deliverable - see the note at the end of Phase 3's plan (`2026-09-11-odk-import-3-webapp-wizard.md`) and the design spec (`docs/superpowers/specs/2026-09-09-odk-import-design.md`). This doc is updated incrementally as concrete gaps are found and fixed, not written once upfront. Each entry below follows the same rigor as Phases 0-3: a concrete failure, a concrete fix, a concrete verification (unit test and/or live DB check) - no open-ended "polish" work without a specific finding behind it.

**Approach:** re-examine the codebase against what the design spec and earlier phase docs actually promised, find places where documented/intended behavior diverges from the real implementation, fix them one at a time.

---

### Finding 1: `geo` NodeDef type had no value-extraction case at all

**Files:** `server/modules/odkImport/service/odkImport/dataImportJobs/odkAttributeValueExtractor.ts`, `test/unit/tests/049odkAttributeValueExtractorGeo.test.ts`. Commit `2c1581611`.

- [x] Phase 0 maps ODK `geotrace`/`geoshape` to Arena's `geo` NodeDef type (flagged lossy in the report). Phase 2's `odkAttributeValueExtractor.ts` never got a matching `case NodeDef.nodeDefType.geo` - the NodeDef was created correctly but every submitted value silently fell through to `null`.
- [x] Fixed: parses the `";"`-separated `"lat lon alt acc"` point list into a GeoJSON `Feature`, matching the exact shape `webapp/components/survey/SurveyForm/nodeDefs/components/types/nodeDefGeo.js` reads/writes (verified against source, not assumed). Since geotrace and geoshape both compile to the same Arena `geo` type, the original ODK bind type isn't available at data-import time - LineString vs Polygon is inferred from the point list itself (a closed ring of ≥4 points is treated as a Polygon).
- [x] Unit tests: 5 cases (open path, closed ring, a 3-point ring too short to count, a single point, empty text).
- [x] Live-verified: imported a form with a `geotrace` and a `geoshape` field, confirmed the resulting node values via the `OdkImportReportManager.insertItems` temp-stub-and-revert technique (see Phase 2's doc for why the stub is needed - `odk_import_report` isn't migrated in this checkout's `arena-server`).

---

### Finding 2: itext label lost when a `<text>` also carries a media-annotated `<value>`

**Files:** `server/modules/odkImport/service/odkImport/model/xform.ts` (`getItextTranslations`), `test/unit/tests/046odkImportXform.test.ts`. Commit `f8afdec14`.

- [x] pyxform/ODK Central compile a question with an image/audio/guidance hint into multiple `<value>` children of the same `<text>` element - one plain, one or more carrying a `form="image"`/`"audio"`/... attribute. `getItextTranslations` took the first `<value>` child unconditionally (`getDirectChildByLocalName(textEl, 'value')`), so a label attached to a media hint had a real chance of silently resolving to the media filename or `null` instead of the actual label text, depending on `<value>` order in the compiled XForm.
- [x] Fixed: prefers the `<value>` with no `form` attribute; falls back to the first value present only if every one is annotated.
- [x] Unit test: a `<text>` with an image-form value listed before the plain value, asserting the plain text wins.

---

### Finding 3: `choice_filter` was never flagged, despite the report item type existing since Phase 1

**Files:** `server/modules/odkImport/service/odkImport/model/xform.ts` (`XFormBodyControl.hasChoiceFilter`, `extractHasChoiceFilter`), `server/modules/odkImport/service/odkImport/metaImportJobs/nodeDefsImportJob.ts`, `test/unit/tests/046odkImportXform.test.ts`. Commit `f9f3ae3a6`.

- [x] The design spec always intended a `choiceFilterNotConverted` report item for a cascading/filtered ODK select (`choice_filter="..."`) imported as a flat, non-cascading category (v1 explicitly doesn't auto-convert cascading choice lists - see the spec's "Choice lists → Categories" section). `core/survey/odkImportReportItem.ts` has had the item type defined since Phase 1, but nothing ever pushed it - a silent gap between documented and actual behavior.
- [x] pyxform/ODK Central compile `choice_filter` into an XPath predicate appended to the itemset's `nodeset` reference (e.g. `instance('list')/root/item[region=/data/region]`). A `"["` there is the reliable signal, since an unfiltered itemset reference never contains one. Extracted as `bodyControl.hasChoiceFilter` in `xform.ts`, wired into `nodeDefsImportJob.ts`'s existing category-linking block (pushed only for a `code` attribute that resolved a category successfully, to avoid double-flagging alongside `missingCategory`).
- [x] Unit tests: `buildBodyControlsByPath` extraction (filtered itemset → `true`, plain itemset/no itemset at all → `false`).
- [x] Live-verified via the same report-stub technique as Finding 1: a form with one plain `select1` and one `choice_filter`-driven `select1` produced exactly one report item (`itemType: choiceFilterNotConverted, message: "/data/city"`) - the plain field's category resolved normally with no report item at all.

---

### Finding 4: "note" detection used the wrong signal, so real ODK Central/pyxform notes were never skipped

**Files:** `server/modules/odkImport/service/odkImport/model/xformTypeMapping.ts`, `server/modules/odkImport/service/odkImport/metaImportJobs/nodeDefsImportJob.ts`, `test/unit/tests/047odkImportXformTypeMapping.test.ts`. Commit `b601c9bda`.

- [x] The design spec (and Phase 0's own type-mapping table) promises a readonly, ODK "note" question is skipped entirely (no NodeDef created, flagged `skippedNote`) rather than imported as a dead, never-filled-in text attribute. The original check was `isTruthyXPathBoolean(readonly) && !hasBodyControl` - which is backwards for real forms. Verified directly against pyxform's `question_type_dictionary.py` (fetched from GitHub): the `note` question type's control dict is `{"tag": "input"}` and bind dict is `{"readonly": "true()", "type": "string"}` - a real, pyxform/ODK Central-compiled note **always** has a body `<input>` control (an XForm has no other way to display anything to the user), so `!hasBodyControl` could never match it in practice. The one existing unit test asserting the old (backwards) behavior was itself evidence nobody had checked this against a real compiled form.
- [x] The actual reliable signal, confirmed the same way: a genuine calculated field's bind always carries a `calculate` expression; a note's never does. Replaced `hasBodyControl` with `hasCalculate` (`Boolean(bind?.calculate)`, already available at the call site and used elsewhere in the same file for identical purposes) - independent of body-control presence.
- [x] Unit tests rewritten: a readonly-no-calculate string (the real note shape, body control or not) → skipped; a readonly-with-calculate string → kept as a genuine computed field; a non-readonly string → never treated as a note.
- [x] Live-verified: a form with `instructions_note` (readonly, body `<input>`, no calculate - pyxform's real note shape) and `computed_total` (readonly, body `<input>`, with a `calculate`) imported only `plot_id` and `computed_total` into `node_def` - `instructions_note` correctly got no NodeDef at all, and the report log showed exactly one `skippedNote` item for it plus a `calculate` conversion item for `computed_total`.

---

### Finding 5: `collect_import_report` and the drafted `odk_import_report` were needlessly duplicate schema

**Files (arena-server, sibling repo, branch `feat/odk-import-report-table`, not published):** replaced `20260910202731-add-table-odk-import-report.js`/`.sql` with `20260911194436-generalize-collect-import-report-to-import-report.js`/`.sql`. **Files (arena):** `server/modules/importReport/repository/importReportRepository.ts` (new), `server/modules/importReport/manager/importReportManager.ts` (new), `server/modules/collectImport/repository/collectImportReportRepository.js`, `server/modules/odkImport/repository/odkImportReportRepository.ts`. Arena commit `d392181da`.

- [x] User-prompted check: is the import-issues table generalizable across importers instead of one-per-importer? Compared the drafted `odk_import_report` migration (Phase 1, never published) against the existing `collect_import_report` migration - byte-identical shape (`id`, `node_def_uuid` FK, `resolved`, `props` jsonb, timestamps), and the two repository modules were structurally identical too, parameterized only by table name.
- [x] Since `odk_import_report` was still unpublished (no data, no deployed schema), this was the cheapest possible point to unify - later, after a release, merging would mean migrating real rows across two live tables instead of simply not creating a second one. Replaced the drafted migration with one that renames `collect_import_report` → `import_report` and adds a `source` column (`'collect'`/`'odk'`, CHECK-constrained), defaulting existing rows to `'collect'` for free.
- [x] New shared `server/modules/importReport/{repository,manager}` (source-agnostic CRUD, takes the caller's `source`); `collectImportReportRepository.js`/`odkImportReportRepository.ts` now delegate to it, keeping only `fetchItemsStream` local to each (Collect's per-language `messages` vs ODK's single `message` props genuinely differ, so that export-projection SQL can't be shared). Every calling module (`collectImportService.js`, both `nodeDefsImportJob`s, `odkImportService.ts`) is untouched - same public function signatures throughout.
- [x] Verified the migration SQL directly (both directions) against a scratch schema built to replicate the real table exactly: rename+alter succeeds, a `'collect'` row backfills correctly, a fresh `'odk'` insert succeeds, an invalid `source` value is rejected by the CHECK constraint, and the down migration fully reverses (rename back, column dropped, rows preserved).
- [x] **Explicitly not done:** a live round-trip through the actual renamed table via the running server (same blocker as every prior report-table verification - arena-server isn't published). Attempted anyway via a timing race (pre-apply the migration to a survey's schema the instant it's created, before `NodeDefsImportJob` reaches `insertItems`) - lost the race, which surfaced a useful, unplanned confirmation instead: the failed `insertItems` call correctly targeted `survey_439.import_report` (the new name, proving the code change reaches the real compiled server correctly) and the whole survey+schema was cleanly auto-rolled-back by the existing failure-cleanup path, leaving no orphaned state.
- [x] **New coupling, called out explicitly:** this couples `collect_import_report` - previously working, unconditionally - to the same unpublished-arena-server blocker Phase 1 introduced for `odk_import_report` alone. `feat/odk-import` cannot be merged/deployed until the new arena-server migration ships and `@openforis/arena-server` here is bumped; until then, Collect import's report lookup would break too, not just ODK's. This is a real, deliberate tradeoff of the unification, not an oversight.

---

## Self-Review Notes

- **Every finding above traces to a concrete divergence** between what an earlier phase doc or the design spec promised and what the code actually did (a missing `switch` case, a `[0]`-index-only accessor, a report item type with no producer) - not speculative "what if" hardening.
- **Every fix has both a unit test and a live verification** against a real running server + Postgres, following the same rigor as Phases 0-3, including the recurring `odk_import_report`-table-not-yet-migrated workaround (temporarily stub `OdkImportReportManager.insertItems` to log instead of insert, verify, revert, confirm via `git diff` before committing).
- **Not yet covered, still open for a future finding:** `barcode`/`dateTime` review, real-world ODK Central-exported XForm samples (all fixtures used across every phase so far are hand-written, spec-minimal XML - Finding 4 shows this gap is real, not theoretical: the wrong signal passed every hand-written test until checked against pyxform's actual compiled output), performance on large forms/submission sets. Flagged in the design spec's Phase/Milestone notes, not silently dropped.
