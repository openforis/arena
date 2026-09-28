# Chain sampling design editor: phase 2 join entity, linkage, and renamed join attributes — design

## Context

The Chain > Sampling design > Two-Phase Sampling UI (`ChainSamplingDesignProps.js` and
siblings) currently has:

- A "1st phase category" selector.
- A "1st phase stratum attribute" selector (`FirstPhaseCategoryExtraPropSelector.js`,
  domain prop `firstPhaseCategoryExtraProp`) — an extra-prop name from that category.
- A "Common attribute" selector (`FirstPhaseCommonAttributeSelector.js`, domain prop
  `firstPhaseCommonAttributeUuid`) — a code/text attribute anywhere in the base unit's
  ancestor chain, matched by *value* against the 1st-phase category's extra props.
- A "Stratum attribute" selector, unconditionally listing categorical attributes from
  the base unit's ancestor chain, regardless of sampling strategy.

This redesigns that area per the attached mockup: it makes the phase-2 join entity
explicit (today it's implicitly "anywhere in the base unit ancestor chain"), adds a
shortcut for surveys using Sampling Point Data linkage, narrows/renames the two join
attribute selectors, and changes the Stratum attribute selector's behavior specifically
for two-phase sampling.

## Domain model — `common/analysis/chainSamplingDesign.js`

### `keysProps` renames and additions

| Old | New | Notes |
|---|---|---|
| `firstPhaseCategoryUuid` | `phase1CategoryUuid` | straight rename, for naming consistency with the rest of the module (the R-facing JSON already calls this `phase1Category`) |
| `firstPhaseCategoryExtraProp` | `phase1JoinAttribute` | rename + behavior change (see below) |
| `firstPhaseCommonAttributeUuid` | `phase2JoinAttribute` | rename + behavior change (see below) |
| — | `phase2JoinEntityUuid` (new) | nodeDef uuid of the phase-2 join entity |
| — | `phase2AsSamplingPointData` (new) | boolean, default `false` |

All matching accessor/predicate functions are renamed in step:
`getFirstPhaseCategoryUuid`→`getPhase1CategoryUuid`,
`assocFirstPhaseCategoryUuid`→`assocPhase1CategoryUuid`,
`dissocFirstPhaseCategoryUuid`→`dissocPhase1CategoryUuid`,
`getFirstPhaseCategoryExtraProp`→`getPhase1JoinAttribute`,
`assocFirstPhaseCategoryExtraProp`→`assocPhase1JoinAttribute`,
`dissocFirstPhaseCategoryExtraProp`→`dissocPhase1JoinAttribute`,
`getFirstPhaseCommonAttributeUuid`→`getPhase2JoinAttribute`,
`assocFirstPhaseCommonAttributeUuid`→`assocPhase2JoinAttribute`,
`dissocFirstPhaseCommonAttributeUuid`→`dissocPhase2JoinAttribute`,
`isFirstPhaseCategorySelectionEnabled`→`isPhase1CategorySelectionEnabled`,
`isFirstPhaseCategoryExtraPropSelectionEnabled`→`isPhase1JoinAttributeSelectionEnabled`,
`isFirstPhaseCommonAttributeSelectionEnabled`→`isPhase2JoinAttributeSelectionEnabled`.

New: `getPhase2JoinEntityUuid`, `assocPhase2JoinEntityUuid`, `dissocPhase2JoinEntityUuid`,
`isPhase2JoinEntitySelectionEnabled`, `getPhase2AsSamplingPointData` /
`isPhase2AsSamplingPointData`, `assocPhase2AsSamplingPointData`,
`isPhase2AsSamplingPointDataSelectionEnabled`.

### Enablement rules

- `isPhase1CategorySelectionEnabled`, `isPhase2JoinEntitySelectionEnabled`,
  `isPhase2AsSamplingPointDataSelectionEnabled`: all `samplingStrategy === twoPhase`
  (same condition, kept as separate named predicates for clarity at call sites).
- `isPhase1JoinAttributeSelectionEnabled`, `isPhase2JoinAttributeSelectionEnabled`:
  `samplingStrategy === twoPhase && phase2AsSamplingPointData !== true`.

### `cleanupSamplingDesign`

- Leaving two-phase clears `phase1CategoryUuid`, `phase2JoinEntityUuid`,
  `phase2AsSamplingPointData`, `phase1JoinAttribute`, `phase2JoinAttribute` (extends
  today's cleanup of the first three).
- Turning `phase2AsSamplingPointData` on clears `phase1JoinAttribute` and
  `phase2JoinAttribute` (their selectors become hidden).
- Changing `phase2JoinEntityUuid` clears `phase2JoinAttribute` (its candidate list
  depends on the entity).
- Changing `phase1CategoryUuid` clears `phase1JoinAttribute` (its candidate list
  depends on the category) — same as today's handling.

## Webapp UI

### `ChainSamplingDesignProps.js`

- Swap render order: `SamplingDesignStrategySelector` now renders before
  `BaseUnitSelector` (matches the mockup). No other change to this file's structure.

### `Phase1CategorySelector` (renamed from `FirstPhaseCategorySelector`)

- Same component/behavior, renamed for naming consistency (directory + file rename,
  one import site updated in `ChainSamplingDesignProps.js`). Label/info keys updated to
  `chainView.phase1Category` / `chainView.phase1CategoryInfo` (see i18n section).

### New: `Phase2JoinEntitySelector`

- Entity dropdown (`EntitySelector`) restricted to the base unit entity and its
  ancestor chain up to root. Built the same way `ClusteringEntitySelector` restricts
  its hierarchy (`Survey.getHierarchy(filterFn)`), but keeping single entities in the
  list (an ancestor on the path could be a single entity), so:
  `filterFn = (nodeDef) => NodeDef.isRoot(nodeDef) || NodeDef.getUuid(nodeDef) === NodeDef.getUuid(baseUnitNodeDef) || NodeDef.isAncestorOf(baseUnitNodeDef)(nodeDef)`,
  `showSingleEntities: true`.
- Default blank (`allowEmptySelection: true`), like the sibling entity selectors.
- Rendered only when `isPhase2JoinEntitySelectionEnabled`.

### New: `Phase2AsSamplingPointDataSelector`

- A checkbox (`FormItem` + `Checkbox`, following the existing pattern for boolean
  fields in this area), default unchecked.
- Rendered only when `isPhase2AsSamplingPointDataSelectionEnabled`.

### New: `Phase1JoinAttributeSelector` (replaces `FirstPhaseCategoryExtraPropSelector`)

- Same data source (`Category.getItemExtraDefKeys` of the 1st-phase category), plus:
  - Prepend a synthetic `"code"` item (the category's built-in code column).
  - Exclude any extra prop def whose `dataType === ExtraPropDef.dataTypes.geometryPoint`
    (coordinate columns, e.g. `location`) — today only the `area` reporting-data key is
    excluded; this generalizes the exclusion to any geometry-point extra prop.
- Rendered only when `isPhase1JoinAttributeSelectionEnabled`.

### New: `Phase2JoinAttributeSelector` (replaces `FirstPhaseCommonAttributeSelector`)

- Lists only the *direct* code/text attributes of the selected `phase2JoinEntityUuid`
  entity — i.e. `Survey.getNodeDefDescendantAttributesInSingleEntities({ nodeDef: phase2JoinEntity, includeAnalysis: true })`
  filtered to `[code, text]`, called once for that one entity (not walked up the
  ancestor chain like `BaseUnitAttributeSelector` does for the base unit today).
- Disabled/empty when no `phase2JoinEntityUuid` is selected yet.
- Rendered only when `isPhase2JoinAttributeSelectionEnabled`.

### `StratumAttributeSelector.js`

- Unchanged for every non-two-phase strategy (still lists all base-unit-ancestor code
  attributes via `BaseUnitAttributeSelector`, "as is now").
- For two-phase, add a `nodeDefFilter` to the existing `BaseUnitAttributeSelector` call
  that keeps only candidates whose **name** also appears in the set
  `Category.getItemExtraDefKeys(phase1Category) ∪ {"code"}` — i.e. a same-name match
  between the 1st-phase category's columns and the base unit's categorical (including
  computed) attributes. Label/info stay as today (`stratumAttribute2ndPhase` for
  two-phase).

## Server — `chainSummaryGenerator.js` (R-facing summary JSON)

- Remove the `phase1StratumAttribute` key entirely (it read
  `firstPhaseCategoryExtraProp`, which no longer exists in this shape).
- Add, following the existing `getCodeAttributeSummary` helper pattern:
  - `phase2JoinEntity`: name of the selected join entity (when
    `isPhase2JoinEntitySelectionEnabled`).
  - `phase2AsSamplingPointData`: boolean (when `isPhase2JoinEntitySelectionEnabled`).
  - `phase1JoinAttribute`: the string value (when `isPhase1JoinAttributeSelectionEnabled`).
  - `phase2JoinAttribute` / `phase2JoinAttributeCategory` / `phase2JoinAttributeCategoryLevel`:
    replaces today's `commonAttribute` / `commonAttributeCategory` /
    `commonAttributeCategoryLevel` triplet (when `isPhase2JoinAttributeSelectionEnabled`),
    same `getCodeAttributeSummary` helper, same empty-string-for-text-attribute handling
    introduced in the two-phase-common-attribute-text change.
- `phase1Category` output key is unchanged (still driven by `phase1CategoryUuid`
  internally).

## Server — chain clone-from-survey remap (`server/modules/analysis/manager/chain/index.js`, `_sanitizeChainPropsForClone`)

- Remap `phase2JoinEntityUuid` and `phase2JoinAttribute` by node name, same as the
  other nodeDef-uuid props already remapped there.
- `phase1JoinAttribute` and `phase2AsSamplingPointData` are plain values (string /
  boolean), carried over as-is, no remap needed.
- `phase1CategoryUuid` keeps today's behavior for `firstPhaseCategoryUuid` (category
  uuids are survey-specific and cannot be remapped; cleared on clone).
- Drop the old `firstPhaseCommonAttributeUuid` entry.

## Migration — existing chains, at app startup

Existing survey data already uses the old prop names; per-survey, on-startup migration
(no manual DB script) following the established `surveyDataMigrationSteps.js` pattern
(used today for the category-item-index and file-path-format migrations, run by
`SurveyDataMigrationJob` inside `AllSurveysDataMigrationJob` at boot, cluster-lock
protected, one step per app version threshold).

### New step in `surveyDataMigrationSteps.js`

```js
{
  version: '2.8.3', // next patch after the current package.json version (2.8.2)
  migrate: async ({ surveyId, client }) => {
    await ChainManager.migrateSamplingDesignPhaseProps({ surveyId }, client)
  },
},
```

### New `migrateSamplingDesignPhaseProps({ surveyId }, client)` in `server/modules/analysis/manager/chain/index.js`

1. `ChainRepository.fetchChains({ surveyId }, client)` — return early if there are none.
2. Fetch the survey with node defs (`SurveyManager.fetchSurveyAndNodeDefsBySurveyId({ surveyId, draft: true, advanced: true, includeAnalysis: true }, client)`) — needed to resolve the parent entity of a previously-selected common attribute.
3. For each chain whose `samplingDesign` object still has any of the three old string
   keys (`firstPhaseCategoryUuid`, `firstPhaseCategoryExtraProp`,
   `firstPhaseCommonAttributeUuid` — referenced as literal strings here, since these
   keys no longer exist in `ChainSamplingDesign.keysProps` after this change), build a
   migrated copy of the object:
   - `firstPhaseCategoryUuid` → `phase1CategoryUuid` (straight rename).
   - `firstPhaseCategoryExtraProp` → `phase1JoinAttribute` (straight rename).
   - `firstPhaseCommonAttributeUuid` → `phase2JoinAttribute` (same uuid value), plus:
     - Look up that attribute's node def in the fetched survey and set
       `phase2JoinEntityUuid` to its actual parent entity's uuid (the most faithful
       backfill, since the old field's real scope was "wherever that attribute lives").
     - Set `phase2AsSamplingPointData: false` (preserves old behavior — there was no
       linkage shortcut before).
     - If `firstPhaseCommonAttributeUuid` wasn't set (category chosen but no common
       attribute picked yet), leave `phase2JoinEntityUuid` unset — matches the new
       field's "default blank" behavior; there is nothing to faithfully backfill.
   - Delete the three old keys from the copy.
4. Persist changed chains via
   `ChainRepository.updateChain({ surveyId, chainUuid, fields: { props: { samplingDesign: migrated } } }, client)`
   — a top-level jsonb merge on the `props` column, so it replaces only the
   `samplingDesign` sub-object and leaves every other chain prop untouched.

## i18n

In `core/i18n/resources/en/common.js`, under `chainView`:

- Rename `firstPhaseCategory` / `firstPhaseCategoryInfo` → `phase1Category` /
  `phase1CategoryInfo` (text unchanged, key rename only, to match the
  `Phase1CategorySelector` rename).
- Remove `firstPhaseCategoryExtraProp.{label,info}` and
  `firstPhaseCommonAttribute.{label,info}` (superseded).
- Add `phase2JoinEntity.{label,info}`, `phase2AsSamplingPointData.label`,
  `phase1JoinAttribute.{label,info}`, `phase2JoinAttribute.{label,info}` — new text,
  written to describe each field's new, narrower behavior.

Add the same keys (English text) to the other locale files (`pt`, `es`, `ru`, `mn`,
`fr`) so nothing renders as a raw key — proper translation review is a follow-up, not
part of this change (consistent with how the two-phase-common-attribute-text change
handled this).

## Out of scope

- No change to `isPostStratificationEnabled` / post-stratification attribute handling.
- No change to non-two-phase sampling strategies' Stratum attribute behavior.
- No server-side validation added beyond what exists today (selectors constrain input
  in the UI; nothing currently enforces these constraints server-side, and this change
  doesn't add any).

## Testing

- Update `test/unit/tests/042chainSamplingDesign.test.js` for the renamed/added
  `ChainSamplingDesign` props, predicates, and `cleanupSamplingDesign` behavior.
- Update `test/integration/tests/017chainCloneFromSurveyMissingEntityTest.js` for the
  renamed remap keys in `_sanitizeChainPropsForClone`.
- Add a unit/integration test for `migrateSamplingDesignPhaseProps` covering: a chain
  with all three old keys set (including the parent-entity backfill), a chain with only
  `firstPhaseCategoryUuid`/`firstPhaseCategoryExtraProp` set (no common attribute), and
  a chain with none of the old keys (no-op, not rewritten).
- Manual verification in the browser: two-phase sampling design end-to-end — strategy
  order, join entity selection restricted to the base-unit ancestor chain, linkage
  checkbox hiding the two join-attribute selectors, phase 1 join attribute list
  (extra props + "code", no coordinate columns), phase 2 join attribute list (only the
  chosen join entity's own code/text attributes), and the two-phase Stratum attribute
  name-intersection filtering.
