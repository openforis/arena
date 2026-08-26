# Validation Report — Filter by Message Type — Design Spec

Date: 2026-08-26
Repo: `arena` (this repo, branch `fix/validation-report-filtering`)

## Problem

The Validation Report (`webapp/views/App/views/Data/ValidationReport/`) lists one row per
validation issue found in a survey's records (path, message, owner, etc.). Two filters already
exist in the report header: a "Filter records" expression filter, and a "Filter attributes" filter
(recently extracted into `HeaderLeft/AttributesFilterPanel`) that restricts rows to issues on
selected attributes/entities. There is no way to filter rows by the *type* of validation problem —
e.g. show only "required value" issues, or only "duplicate value" issues.

## Goals

- A third header button, "Filter messages", opening a flat checkbox panel of message-type
  categories (mirroring the attribute filter's button/panel UX: `highlight` on the button when
  active, panel closes on outside click).
- Filtering happens server-side (same as the existing filters), so it composes correctly with
  pagination, counts, and the Excel export.
- Categories are a **static, closed list** — investigation confirmed every validation issue that
  can appear in this report carries one of exactly 8 system message keys, defined in
  `@openforis/arena-core`'s record validators (`attributeValidator.js`, `attributeTypeValidator.js`,
  `attributeUniqueValidator.js`, `attributeKeyValidator.js`, `countVaildator.js`). No per-survey
  computation or DB query is needed to populate the list.

## Non-goals

- No dynamic/custom message-type discovery. `record.attribute.customValidation` (used for all
  survey-specific custom validation rules, regardless of which rule or what the custom message
  text says) is filtered as a single category, not decomposed further — the *key* is uniform even
  though the *message* varies per rule.
- No changes to how messages are displayed in the table (`ValidationFieldMessages`) — this only
  adds a row filter, not a display change.

## UX

6 categories, combining the 3 node-count keys into one (per user decision — granular per-key
filtering for count issues was considered and rejected as unnecessary detail for this list):

| Category id | Underlying message key(s) | Label |
|---|---|---|
| `valueRequired` | `record.attribute.valueRequired` | Required value |
| `valueInvalid` | `record.attribute.valueInvalid` | Invalid value |
| `uniqueDuplicate` | `record.attribute.uniqueDuplicate` | Duplicate value |
| `customValidation` | `record.attribute.customValidation` | Custom validation |
| `entityKeyDuplicate` | `record.entity.keyDuplicate` | Duplicate entity key |
| `nodesCount` | `record.nodes.count.invalid`, `record.nodes.count.minNotReached`, `record.nodes.count.maxExceeded` | Node count |

`customValidation` and `valueInvalid` get distinct labels even though their existing runtime i18n
text is identical ("Invalid value" in English) — otherwise the checkbox list would show two
entries that look the same.

Default: all 6 selected (= no filtering), same convention as the attribute filter.

## Frontend changes

1. **`webapp/views/App/views/Data/ValidationReport/HeaderLeft/MessageTypeFilterPanel/`** (new,
   mirrors `AttributesFilterPanel/`): `MessageTypeFilterPanel.js` + `index.js`. Static category
   list lives here (no survey/tree dependency, unlike the attribute panel). Renders a "select all"
   checkbox + one checkbox per category. Closes via the same `containerRef`-based outside-click
   pattern as `AttributesFilterPanel`.
2. **`HeaderLeft.js`**: third button + own wrapper `<div className="validation-report__message-type-filter">`
   with its own ref, following the existing `validation-report__attributes-filter` wrapper pattern
   exactly (button toggles, panel conditionally renders, `highlight` class when not all selected).
3. **`ValidationReport.js`**: new `selectedMessageTypeCategories` state (default: all 6 category
   ids). A memo expands selected categories to the flat list of real message keys (`nodesCount` →
   3 keys) and computes `allMessageTypesSelected`. `restParams` gains
   `messageTypeKeys: JSON.stringify(expandedKeys)`, included only when not all categories are
   selected (mirrors the existing `attributeDefUuids` inclusion rule).
4. **`ValidationReport.scss`**: new `.validation-report__message-type-filter { position: relative; }`
   rule alongside the existing `.validation-report__attributes-filter` one; panel styling reuses
   the existing `.validation-report__attributes-filter-panel`-style rules (width/shadow/etc.),
   adjusted for a flat list (no `nodedef-tree-select` margin rule needed).

## Backend changes

Threads `messageTypeKeys` through the exact same path `attributeDefUuids` already takes:

1. **`server/modules/record/api/recordApi.js`**: parse `Request.getJsonParam(req, 'messageTypeKeys')`
   in the three existing validation-report endpoints (report, count, start-export) alongside the
   existing `attributeDefUuids` parsing.
2. **`server/modules/record/service/recordService.js`**: `_resolveValidationReportFilterBySurveyAttrs`
   gains a `messageTypeKeys = null` param; when it's an array, added to the returned
   `filterBySurveyAttrs` object (same `hasAttributeFilter`-style check, renamed generically e.g.
   `hasMessageTypeFilter`). `fetchValidationReport` / `countValidationReportItems` gain the param
   and pass it through.
3. **`server/modules/record/service/validationReportGenerationJob.js`**: same addition to
   `this.context` destructuring and the `filterBySurveyAttrs` object construction, so an Excel
   export started while a message-type filter is active respects it.

   Note: `webapp/service/api/data/index.js`'s `startValidationReportGeneration` currently only
   forwards `{ cycle, recordUuid, lang }` to the backend in its POST body — it silently drops
   `query` and `attributeDefUuids` even though `HeaderLeft.js`'s export button spreads the full
   `restParams` into the call. This is a pre-existing bug (export today ignores both the record
   filter and the attribute filter), out of scope for this change except that
   `startValidationReportGeneration` must additionally forward the new `messageTypeKeys` field —
   scoped narrowly to the new filter, not a fix for the other two.
4. **`server/modules/record/repository/validationReportRepository.js`**: `query()` reads
   `filterBySurveyAttrs?.messageTypeKeys`, builds a new clause:

   ```js
   const filterByMessageTypesClause =
     Array.isArray(messageTypeKeys) && messageTypeKeys.length === 0
       ? 'AND 1 = 0'
       : messageTypeKeys?.length > 0
         ? `AND jsonb_path_query_array(nv.validation, '$.**.key') ?| ARRAY[$/messageTypeKeys:csv/]::text[]`
         : ''
   ```

   `$.**.key` recursively collects every `.key` in the (possibly nested, multi-field) `Validation`
   object regardless of depth or errors-vs-warnings placement; `jsonb_path_query_array` avoids the
   `SETOF`/`LATERAL` wrapping `jsonb_path_query` would need; `?|` (jsonb "shares any element with a
   text[]") gives the boolean match. `$/messageTypeKeys:csv/` reuses the same pg-promise formatting
   helper `attributeDefUuids` already uses, wrapped in `ARRAY[...]::text[]` instead of `IN (...)`.

   Verified directly against the local dev Postgres container (`docker exec arena-db psql`) with
   synthetic nested `Validation`-shaped JSONB: correctly matches keys nested under `fields.*`,
   correctly matches both `errors[]` and `warnings[]` placements without needing to special-case
   severity, and correctly returns no match for issue-free validation objects. Both the local dev
   image (`postgis:17-3.5`) and the test-suite image (`postgis:12-3.0`) support the jsonpath
   features used (available since Postgres 12).

## i18n

New keys under `dataView.js` (all 6 locales — en, pt, es, ru, fr, mn), following the
`filterAttributes` precedent added earlier on this branch:

- Button label: `dataView:filterMessages` → "Filter messages" (parallel to
  `dataView:filterAttributes` → "Filter attributes").
- One label per category under `dataView:messageTypeFilter.<categoryId>`, e.g.
  `dataView:messageTypeFilter.valueRequired` → "Required value", per the UX table above.

## Testing

- **Backend**: new integration test coverage for `validationReportRepository` (no existing test
  file for this repository — new one, following the setup pattern in
  `test/integration/tests/008recordValidationtest.js` / `test/integration/tests/_record/`), covering:
  a single category selected, the `nodesCount` category (confirming all 3 underlying keys match),
  all-selected (no filter applied, same result as omitting the param), and empty selection (zero
  rows, `1 = 0` short-circuit).
- **Frontend**: no existing unit tests for `HeaderLeft`/`AttributesFilterPanel` to extend — rely on
  lint/syntax checks, matching how the attribute-filter refactor earlier on this branch was
  verified.
- **Manual**: click through the new button/panel in the running dev instance (report author does
  not have login access to the local dev DB's app-level session, so this step is done by the repo
  owner) — confirm panel open/close behavior, that selecting a category actually restricts rows,
  and that Excel export respects the filter.
