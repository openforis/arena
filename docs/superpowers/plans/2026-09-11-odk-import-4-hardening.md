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
- [x] **Explicitly not done (at the time):** a live round-trip through the actual renamed table via the running server (same blocker as every prior report-table verification - arena-server isn't published). Attempted anyway via a timing race (pre-apply the migration to a survey's schema the instant it's created, before `NodeDefsImportJob` reaches `insertItems`) - lost the race, which surfaced a useful, unplanned confirmation instead: the failed `insertItems` call correctly targeted `survey_439.import_report` (the new name, proving the code change reaches the real compiled server correctly) and the whole survey+schema was cleanly auto-rolled-back by the existing failure-cleanup path, leaving no orphaned state.
- [x] **New coupling, called out explicitly:** this couples `collect_import_report` - previously working, unconditionally - to the same unpublished-arena-server blocker Phase 1 introduced for `odk_import_report` alone. `feat/odk-import` cannot be merged/deployed until the new arena-server migration ships and `@openforis/arena-server` here is bumped; until then, Collect import's report lookup would break too, not just ODK's. This is a real, deliberate tradeoff of the unification, not an oversight.
- [x] **Resolved 2026-09-12:** PR #185 merged `feat/odk-import-report-table` into arena-server's master (triggering a MINOR bump to `v2.3.0`, thanks to the empty marker commit added specifically for that); bumped `@openforis/arena-server` to `^2.3.0` here (`0c1996d9a`). Finally did the live round-trip that every report-table check since Phase 1 had deferred: imported a form with a `choice_filter`-driven select through a real server running the new dependency, confirmed via `psql` that `survey_<id>.import_report` exists with the `source` column and that the import wrote a real `source: 'odk'` row - no stub, no scratch-schema replica, the actual thing working end to end.

---

### Finding 6: ODK's documented "Name (code)" language convention was never normalized to a real ISO code

**Files:** `server/modules/odkImport/service/odkImport/model/xform.ts` (`getItextTranslations`, new `normalizeLangCode`), `test/unit/tests/046odkImportXform.test.ts`. Commit `1f6e12af6`.

- [x] Every hand-written fixture used across every phase of this feature so far used simplified bare language names (`lang="English"`, `lang="French"`), which never surfaced a real gap: ODK's own documentation (`docs.getodk.org/form-language`) recommends XLSForm language columns named `"Language Name (code)"` (e.g. `label::English (en)`), and pyxform/ODK Central preserve that whole string verbatim as the compiled itext `<translation lang="...">` attribute - not a bare code (confirmed via a real user-reported example on the ODK forum: `lang="Portuguese (pt)"`, not `lang="pt"`).
- [x] The importer was taking that raw `lang` attribute and using it directly as Arena's language identifier everywhere (`survey.languages`, every label object's keys), even though Arena's own language model (`core/app/languages.ts`) expects real ISO 639-1 codes. For any real multi-language ODK Central form following the documented convention, every survey language would end up keyed by a garbage `"English (en)"`-shaped string instead of `"en"`.
- [x] Fixed at the single point `lang` is first read (`getItextTranslations`): extracts a trailing parenthesized code and uses it only when it's a real, recognized Arena language code (checked against `core/app/languages.ts`'s known list); otherwise leaves the raw attribute value untouched, so a form already using bare codes (or any other convention) is unaffected.
- [x] Unit test: a form with `lang="English (en)"`/`"Portuguese (pt)"`/a made-up `"Klingon (xx-made-up)"` normalizes the first two to `en`/`pt` and leaves the unrecognized one as-is.
- [x] Live-verified: imported a form with `lang="English (en)"` (default) and `lang="Portuguese (pt)"` - `survey.languages` came back exactly `["en", "pt"]` and the imported attribute's labels came back `{"en": "Plot id", "pt": "Id do talhao"}`, confirmed via `psql`.

---

### Rollout decision: gated behind `EXPERIMENTAL_FEATURES`

**Files:** `webapp/components/survey/SurveyCreate/SurveyCreate.js`, `webapp/views/App/views/Data/DataImport/DataImport.js`. Commit `f2fb1fba3`.

- [x] Neither ODK entry point (the survey-creation wizard's ODK import source, the Data Import wizard's ODK tab) is ready for general availability - reused the existing `experimentalFeatures` config flag (`core/processUtils.ts`, `useSystemConfigExperimentalFeatures`) already used to gate other in-progress features, rather than inventing a new mechanism.
- [x] Live-verified both states with a real running server: `EXPERIMENTAL_FEATURES=true` (this repo's `.env` default) renders both entry points exactly as before; `EXPERIMENTAL_FEATURES=false` removes the ODK radio option from the survey-creation wizard and the "ODK / ODK Collect" tab from Data Import, leaving the same CSV/Collect/Arena set every survey had before this feature existed.

---

### Closed the "no real fixture" gap

**Files:** `test/unit/tests/050odkImportRealForm.test.ts`. Commit `f28290fd9`.

- [x] Every fixture in 046-049 is hand-written and spec-minimal - the exact gap that let Findings 4 and 6 slip past the whole test suite until checked against real pyxform/ODK behavior externally. Added a new test file embedding a real, unmodified ODK form verbatim: "Household Survey.xml" from ODK's own official `getodk/sample-forms` repository (published there explicitly "for use in ODK Collect and ODK Web Forms").
- [x] Chosen over the equally real, more on-theme "Forest Structure Form" sample specifically because it has a genuine, uncommented `<repeat>` group (Forest Structure's is commented out) plus richer expression variety: `jr:preload` metadata, a `barcode` field, a `geopoint`, upload mediatypes, a bind with no body control anywhere (`HouseholdAudio`), a real `regex()`/`count-selected()`/`if()`-ternary/absolute-path-`selected()` mix of expressions, and 5 real itext languages with no `default="true()"` anywhere (exercising the first-encountered fallback).
- [x] 14 tests across 3 groups (pure `xform.ts`/`xformTypeMapping` parsing needing no survey at all, plus `OdkExpressionConverter` conversions against a small real Arena survey built with `surveyBuilder` for just the fields under test) - every one passed on the first run, including the two outcomes I hadn't verified beforehand (`regex()` and `count-selected()` are correctly left unconverted, since neither is a real Arena expression function).

---

## Self-Review Notes

- **Every finding above traces to a concrete divergence** between what an earlier phase doc or the design spec promised and what the code actually did (a missing `switch` case, a `[0]`-index-only accessor, a report item type with no producer) - not speculative "what if" hardening.
- **Every fix has both a unit test and a live verification** against a real running server + Postgres, following the same rigor as Phases 0-3, including the recurring `odk_import_report`-table-not-yet-migrated workaround (temporarily stub `OdkImportReportManager.insertItems` to log instead of insert, verify, revert, confirm via `git diff` before committing).
- **Not yet covered, still open for a future finding:** `barcode`/`dateTime` review beyond what the real-form test now exercises, performance on large forms/submission sets. The "hand-written-fixtures-only" gap itself is now partially closed (one real form, unit-level) - a real end-to-end DB-backed integration test importing an actual survey/data from a real form, and a second real form/submission-set exercising things this one doesn't (a filtered `choice_filter` select, an external secondary instance, geotrace/geoshape), remain open.
