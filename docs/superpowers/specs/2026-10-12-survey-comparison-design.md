# Survey Comparison (and Sync) — Design Spec

**Date:** 2026-10-12  
**Status:** Proposed (not implemented)

## Goal

Let a user check whether the survey open in Arena matches another copy of it on a different server
(Dev / QA / Prod), see what differs, and optionally apply the differences to the open survey.

User request: _"I often need to update identical surveys across multiple environments (Dev, QA, Prod). Does the
Summary feature allow us to verify if two surveys are strictly identical? If not, could you implement a feature
to compare two surveys across different servers?"_

## Background

- The **Schema Summary** (`server/modules/survey/service/schemaSummary/`) exports one row per node def (path, type,
  labels, expressions, validations…) to CSV/Excel. Users can diff two of those files by hand, but:
  it covers node defs only (no category items, taxa, survey info), the diff is manual, and nothing marks a match as
  "identical".
- **Survey export without data** (`SurveyExportJob` with `backup: false`) produces an Arena `.zip` with
  `survey.json` (survey info + node defs), `categories/`, `taxonomies/`, `chains/`, `surveyfiles/`. The format is
  stable and is read by `ArenaSurveyFileZip` (`server/modules/arenaImport/service/arenaImport/model/`).
- **UUIDs survive export/import and cloning.** `NodeDefsImportJob` inserts node defs with their original UUIDs.
  When a survey reached QA/Prod through export → import (the usual case), UUIDs match on both sides. UUIDs differ
  only when the "same" element was created by hand in each environment, as the request describes.
- **Published surveys restrict some changes.** These rules already exist in the code:
  - type cannot change (only on unpublished node defs);
  - `multiple` cannot change on a published node def (`useIsMultipleEditDisabled`);
  - a published node def cannot be moved to another entity (`nodeDefEditButtonsMenu`, `moveNodeDef`);
  - category / taxonomy reference cannot change on a published node def (`Survey.canUpdateCategory`,
    `TaxonProps`);
  - published category levels cannot be deleted (`Category.isLevelDeleteAllowed`); published items cannot be
    deleted, only changed (`categoryItemsUpdater`);
  - surveys that are templates can change all of these.
  - Any other change goes into `propsDraft` and reaches records only on **publish**, which runs
    `SurveyPublishJob` (validation, RDB update, cycle deletion checks).

## Answer to the user (short)

Today the Summary cannot confirm two surveys are identical; the only option is diffing two exported Summary files
by hand. The feature below adds that check.

## Scope and phases

The work is split into three phases. Each one is useful without the next.

| Phase | Delivers | Main risk |
| ----- | -------- | --------- |
| 1. Fingerprint | One "definition hash" per survey, shown on the dashboard and in the Summary export | Picking the normalization rules |
| 2. Compare | Upload an exported `.zip`, get a tree of node defs with differences highlighted, plus categories / taxonomies / survey info | Matching elements when UUIDs differ |
| 3. Apply | Apply selected differences to the open survey (as draft), within published-survey rules | Ordering dependent changes and enforcing constraints |

### Phase 1 — Definition fingerprint (quick win)

Gives a quick yes/no on "identical?" without uploading anything: compare two short strings.

- `core/survey/surveyFingerprint.ts`: `normalizeSurveyDefinition(survey, { categories, taxonomies })` →
  canonical JSON (sorted keys, see **Normalization**); `computeSurveyFingerprint(...)` → SHA-256 hex
  (Node `crypto` on the server, the hash is computed server side only).
- Two fingerprints, both shown:
  - **strict**: includes UUIDs. Equal when one survey was exported/imported/cloned from the other and has not
    changed since;
  - **structural**: UUIDs replaced by name paths. Equal when the two surveys define the same things, even if they
    were created separately.
- Computed on demand: `GET /api/survey/:surveyId/fingerprint?draft=true|false`. Draft and published give
  different values, so a Prod survey with unpublished edits is visible as such.
- UI: dashboard `SurveyInfo` card, a "Definition fingerprint" row (first 12 chars, click to copy the full value),
  plus a column in the Schema Summary export header.

### Phase 2 — Comparison

#### User flow

1. Designer → new **"Compare with…"** item (next to Schema Summary), opens `/app/designer/compare`.
2. The user uploads an Arena survey `.zip` exported (without data) from another server. Later option: pick another
   survey on the same server instead (same code path, the source is loaded from the DB rather than from a zip).
3. A job (`SurveyCompareJob`) reads the zip and builds the diff; progress is shown with the usual `JobMonitor`.
4. The result opens in the compare view (below). Nothing is written to the DB for the uploaded survey.

The source survey is the uploaded one, the target is the open one ("what would change in _this_ survey to make it
like the uploaded one").

#### Server

- `server/modules/surveyCompare/` (new module):
  - `api/surveyCompareApi.ts`: `POST /survey/:surveyId/compare` (multipart upload, starts the job, needs
    `requireSurveyViewPermission`); `GET /survey/:surveyId/compare/:jobUuid/result` (returns the diff JSON kept in
    the job result / temp file).
  - `service/surveyCompareJob.ts`: inner jobs
    1. `PrepareImportFileJob` + `ArenaSurveyReaderJob` (reused) → `arenaSurvey`, zip handle;
    2. `SurveyCompareSourceReaderJob`: reads categories (levels + items), taxonomies (taxa, vernacular names)
       from the zip into memory via `ArenaSurveyFileZip`; rejects zips with data (`records/`) only by ignoring them;
    3. `SurveyCompareTargetReaderJob`: fetches the open survey (`draft: true`, `advanced: true`), its categories
       and taxonomies;
    4. `SurveyCompareDiffJob`: calls the pure diff function from `core/` and stores the result.
  - Memory: category items and taxa can be large (10k+). Compare them as maps keyed by code path and only keep
    the differences, not both full lists, in the result.
- Same arena-format version check as import: reject zips from a newer Arena version than the server.

#### Core diff model (`core/survey/surveyCompare/`, TypeScript, isomorphic, unit tested)

```ts
type DiffStatus = 'identical' | 'changed' | 'added' | 'removed' | 'moved'
interface PropDiff { key: string; source: unknown; target: unknown }
interface NodeDefDiff {
  sourceUuid?: string; targetUuid?: string
  path: string                 // e.g. cluster/plot/tree/dbh, from the source when present
  matchedBy?: 'uuid' | 'path' | 'manual'
  status: DiffStatus
  props: PropDiff[]            // only differing props
  childrenStatus: 'identical' | 'hasDifferences'  // rolled up for the tree
  applicability?: Applicability  // phase 3
}
interface SurveyDiff {
  identical: boolean
  fingerprints: { source: string; target: string }
  surveyInfo: PropDiff[]       // languages, labels, cycles, SRS, sampling design flags…
  nodeDefs: NodeDefDiff[]
  categories: CategoryDiff[]   // by name: levels, extra props defs, items by code path
  taxonomies: TaxonomyDiff[]   // by name: taxa by code, vernacular names, extra props
  surveyFiles: FileDiff[]      // map layers, doc images (by name + size/hash)
}
```

#### Matching

1. **By UUID** first: covers surveys deployed via export/import or clone.
2. **By name path** for what is still unmatched (`root/entity/attr`, using node def names, unique per survey):
   covers elements created independently in each environment.
3. **Rename detection**: with matching UUIDs a rename is simply a `name` prop difference. When UUIDs differ,
   a renamed def ends up as one "removed" + one "added"; propose a "possible rename"
   (same parent, same type, same labels or same expressions) that the user can confirm in the UI
   (`matchedBy: 'manual'`); confirmed pairs are sent back and the diff is recomputed client side.
4. Same UUID but different parent → `moved`.
5. Categories and taxonomies matched by UUID, then by name; category items by code path
   (`level1Code/level2Code`), taxa by code.

#### Normalization (shared by fingerprint and diff)

- Drop: `id`, `uuid` (structural mode), `parentUuid` (replaced by parent path), `published`, `draft`,
  `dateCreated` / `dateModified`, `meta.h` (hierarchy, rebuilt from parents), `temporary`, `analysis`
  flags when chains are out of scope, internal `validation` results.
- Merge `props` + `propsDraft` the same way `NodeDef` getters do (draft wins); option to compare published only.
- Replace references by names: `categoryUuid` → category name, `taxonomyUuid` → taxonomy name,
  `parentCodeDefUuid` → node def path, file UUIDs → file name + content hash.
- Expressions (default values, relevance, validations, `itemsFilter`, `applyIf`…): compare after trimming and
  collapsing whitespace. They already reference node defs by name, so they are stable across environments.
  Arrays of expression objects compared without their `uuid`s.
- Labels / descriptions: compare per language; a language present on one side only is a survey info difference.
- Layout (`layout` prop, per cycle): compared separately and flagged as **layout-only** so the user can hide it
  (layout differences are common and harmless for data). Default: shown but collapsed.
- Sort keys recursively; treat `undefined`, `null`, `''`, `[]` and `{}` as equal (empty props are stored
  inconsistently).

#### UI (`webapp/views/App/views/Designer/SurveyCompare/`, TSX)

- **Header**: verdict banner — "Identical" (green) / "N differences" with counts per category (node defs added /
  removed / changed / moved; categories; taxonomies; survey info), the two fingerprints, the source file name and
  the Arena version / survey name / publish date read from its `info.json`.
- **Toolbar**: "Show only differences" (default on), "Hide layout-only differences", search by name, cycle
  selector (for layout and per-cycle availability).
- **Side-by-side tree** (main area): two aligned columns, one row per matched pair, following the source hierarchy
  with target-only defs inserted under their target parent. Each row shows icon by type, name, label and a status
  badge: identical (no badge), changed (amber), added — only in uploaded survey (green), removed — only in this
  survey (red), moved (blue). Parent rows show a dot when a descendant differs, and collapse identical subtrees.
  Reuse the tree style of the existing `NodeDefsSelector` / survey hierarchy component.
- **Detail panel** (right, or below on narrow screens) for the selected row: a table _Property | Uploaded |
  This survey_, expressions shown as code with word-level highlighting, labels grouped by language.
  In phase 3 it also shows the "Apply" checkbox and the reason when a change cannot be applied.
- Other tabs: **Survey info**, **Categories** (list → levels / extra props / item diff table with paging),
  **Taxonomies** (same), **Files**.
- **Export**: download the diff as Excel/CSV (one row per difference) and as JSON, so it can be attached to a
  change request.

### Phase 3 — Apply changes to the open survey

All changes land as **draft** (`propsDraft`, unpublished categories/items), never directly in published props.
The user then reviews in the Designer and publishes as usual, so `SurveyPublishJob` stays the only path to
records and the RDB.

#### Applicability rules (computed in `core/`, so UI and server agree)

Per change, one of `applicable`, `applicableWithWarning`, `notApplicable` + a reason key (i18n):

| Change on target | Unpublished def / template | Published def |
| ---------------- | -------------------------- | ------------- |
| Add node def / category / taxonomy | yes | yes |
| Labels, descriptions, expressions, validations, layout, `readOnly`, `hidden`, cycles added | yes | yes |
| Rename (`name`) | yes | warning: breaks expressions using the old name in the target, RDB column renamed on publish |
| Type change | yes | **no** (would require delete + re-add, data lost) |
| `multiple` change | yes | **no** |
| `key` change | yes | warning: changes record uniqueness, existing records may become duplicates (to verify against publish validation) |
| Category / taxonomy reference change | yes | **no** |
| Move to another entity | yes | **no** |
| Delete node def | yes | warning: data of that attribute is deleted on publish |
| Remove a cycle | yes | warning: `CyclesDeletedCheckJob` deletes records of that cycle |
| Delete category level / item | yes | **no** for published levels/items (item props can still change) |
| Delete taxon | yes | warning (published taxa referenced by records) |

Dependent changes are linked: selecting an added attribute auto-selects its added parent entity and the
category/taxonomy it references; deselecting a parent deselects its children. Expressions are re-validated against
the resulting survey (`SurveyValidator` / `NodeDefExpressionValidator`); an expression referring to a node def not
selected for adding is blocked with that reason.

#### Execution

- `POST /survey/:surveyId/compare/:jobUuid/apply` with the list of selected change ids (+ manual matches), needs
  `requireSurveyEditPermission`. Starts `SurveyCompareApplyJob` in one transaction:
  1. recompute the diff against the current target (the survey may have changed since the comparison) and reject
     if a selected change no longer applies;
  2. survey info changes (languages first, cycles);
  3. taxonomies and categories (reuse the logic of `CategoryImportJob` / `TaxonomyImportJob` and
     `categoryItemsUpdater` for item-level updates), mapping source UUIDs → target UUIDs;
  4. node defs, parents before children: insert (`NodeDefManager.insertNodeDefsBatch`, keeping the source UUID
     when free, so later comparisons match by UUID), update props (`updateNodeDefProps`), move, mark deleted;
  5. survey files;
  6. regenerate dependency graphs, validate the survey, write one activity log entry summarizing the sync.
- On success the client reloads the survey defs (`SurveyDefsLoader`) and reruns the comparison: expected result is
  "identical" except for the changes that were not applicable.

## Non-goals

- Comparing or syncing records / data.
- Direct server-to-server connection (credentials for another Arena instance, CORS, network rules). The `.zip`
  upload covers it; a remote source can be added later behind the same `SurveyCompareSourceReader` interface.
- Processing chains (analysis) comparison: phase 2+ follow-up, the `chains/` zip entries are already available.
- Three-way merge (base / mine / theirs).

## Open questions

1. Phase 1 alone may already answer the user; ship it first and collect feedback before phase 3?
2. Default for layout differences: hidden or shown?
3. When the target is published, should "apply" also offer to publish at the end, or always leave it to the user?
4. Should the compare view also accept a Schema Summary file as source? (Simpler to produce, but lossy: no item
   lists, no extra props.) Proposed: no.
5. `key` change on published node defs: confirm what publish validation allows today before marking it as warning
   vs not applicable.

## Testing

- **Unit** (`test/unit/`): normalization (empty values, expressions whitespace, reference → name), fingerprint
  stability (same survey with different UUIDs → same structural, different strict), matching (UUID, path, rename
  candidates, moves), applicability matrix for published / unpublished / template.
- **Integration** (`test/integration/`): export a test survey, change it (rename attr, add attr, change category
  item label, change expression), compare → expected diff; apply → compare again → identical; apply on a published
  survey → non-applicable changes are rejected.
- **E2E** (`test/e2e/specs/`): upload a zip, check banner counts and badges in the tree, apply one change.

## Rough effort

- Phase 1: ~2–3 days (normalization is reused in phase 2).
- Phase 2: ~2 weeks (matching + diff ~1 week, UI ~1 week).
- Phase 3: ~2 weeks, mostly applicability rules, ordering and tests.
