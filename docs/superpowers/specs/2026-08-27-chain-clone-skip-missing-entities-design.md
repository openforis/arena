# Chain clone: skip analysis attributes for missing entities

Date: 2026-08-27

## Problem

When cloning a processing chain from another survey (`ChainCloneFromSurveyDialog`), every analysis
attribute in the source chain has a parent entity. If any of those parent entities don't exist (by
name) in the target survey, the clone is currently blocked outright:

- Client: the Clone button is disabled whenever any entity check fails
  (`webapp/views/App/views/Analysis/Chains/ChainCloneFromSurveyDialog/ChainCloneFromSurveyDialog.tsx`).
- Server: `cloneChainFromSurvey` (`server/modules/analysis/manager/chain/index.js`) throws a
  `SystemError('chainView.cloneFromAnotherSurveyDialog.missingEntities', ...)`, aborting the whole
  operation.

This is all-or-nothing: a user cannot clone a chain if even one of its analysis attributes belongs
to an entity absent from the target survey, even if the rest of the chain is perfectly usable.

## Goal

Let the user opt in to skipping just the analysis attributes whose parent entity is missing in the
target survey, so the rest of the chain (and its still-valid attributes) clones successfully.

## Behavior

### Default (unchanged)

If the user does not opt in, behavior is identical to today: missing entities keep the Clone button
disabled client-side, and a direct API call without the new flag still throws the existing
`SystemError`. This preserves the current safety net for any caller that doesn't know about the new
option.

### Opt-in skip

The dialog gains a checkbox, shown only when the entity-compatibility check finds at least one
missing entity: *"Skip analysis attributes for entities missing in the target survey"*.

- Unchecked: Clone stays disabled, same as today.
- Checked: Clone becomes enabled. On confirm, the clone proceeds, and every source analysis
  attribute whose parent entity is missing in the target survey is left out of the clone. All other
  analysis attributes (and the chain itself) clone normally.
- If checking the box would result in zero attributes being cloned (every entity is missing), the
  clone still proceeds — this is equivalent to cloning a chain that has no analysis attributes to
  begin with, which the dialog already supports and displays.

## Design

### Client — `ChainCloneFromSurveyDialog.tsx`

- New state `skipMissingEntities: boolean` (default `false`), reset to `false` whenever
  `entityCheckItems` is reset (i.e., in `onSurveyChange` and `onChainChange`).
- Render a `Checkbox` (from `@webapp/components/form`) under the entity-check list, only when
  `entityCheckItems.some(item => !item.found)`.
- `confirmDisabled` becomes:
  ```
  !selectedSurveyItem || !selectedChainItem || loadingEntityCheck || (!allEntitiesFound && !skipMissingEntities)
  ```
- `onConfirm` passes `skipMissingEntityAttributes: skipMissingEntities` into
  `ChainActions.cloneChainFromSurvey(...)`.

### Redux action — `webapp/store/ui/chain/actions/cloneChainFromSurvey.js`

- Accepts and forwards `skipMissingEntityAttributes` to `API.cloneChainFromSurvey`.

### API client — `webapp/service/api/analysis/index.js`

- `cloneChainFromSurvey({ targetSurveyId, sourceSurveyId, sourceChainUuid, skipMissingEntityAttributes })`
  sends `skipMissingEntityAttributes` in the POST body.

### Server API route — `server/modules/analysis/api/chainApi.js`

- `POST /survey/:surveyId/chain/clone-from-survey` reads `skipMissingEntityAttributes` from the
  request body (default `false`) and forwards it to `AnalysisService.cloneChainFromSurvey`.

### Manager — `server/modules/analysis/manager/chain/index.js`

- `cloneChainFromSurvey({ user, surveyId, sourceSurveyId, sourceChainUuid, skipMissingEntityAttributes = false }, client)`.
- After computing `missingEntityNames` (unchanged logic):
  - If `missingEntityNames.length > 0 && !skipMissingEntityAttributes`: throw the existing
    `SystemError`, exactly as today.
  - If `missingEntityNames.length > 0 && skipMissingEntityAttributes`: do not throw. Instead, filter
    `sourceAnalysisNodeDefs` to exclude any node def whose parent entity name is in
    `missingEntityNames`, and use that filtered list for the rest of the function (building
    `clonedNodeDefs`, category/taxonomy resolution, etc.).
- No changes needed to `_sanitizeChainPropsForClone` / `_remapNodeDefUuid`: they already drop any
  sampling-design or statistical-analysis prop that references a node def not found by name in the
  target survey, which is exactly what happens to props pointing at skipped attributes.

  > **Correction (post-implementation fix pass):** this premise was false as originally implemented.
  > `_remapNodeDefUuid` called `Survey.getNodeDefByName`, which throws `SystemError` when the name
  > isn't found in the target survey rather than returning `undefined`, so the "already tolerates
  > dropped node defs" behavior described above did not actually hold — it broke exactly the
  > `skipMissingEntityAttributes: true` scenario whenever a sampling-design/statistical-analysis prop
  > referenced the skipped entity. Fixed by swapping it for the non-throwing
  > `Survey.findNodeDefByName`, which does return `undefined` on a miss.

## Out of scope

- Per-entity or per-attribute counts/summaries beyond the existing found/missing list (e.g., "3
  attributes will be skipped"). The existing entity list already shows which entities are missing;
  no extra bookkeeping is added for attribute-level counts.
- Any UI/behavior change for the case where there are no missing entities at all.

## i18n

Add one new key to `core/i18n/resources/en/common.js` under `chainView.cloneFromAnotherSurveyDialog`:

- `skipMissingEntities`: `"Skip analysis attributes for entities missing in the target survey"`

The existing `missingEntities` key is unchanged and still used for the blocking-error case. Other
language files are left with the English fallback text for the new key, consistent with how new
keys are typically introduced in this codebase.

## Testing

Extend the integration tests alongside
`test/integration/tests/011chainCloneFromSurveyCategoryTest.js` (new test file or additional cases)
covering:

1. Missing entity + `skipMissingEntityAttributes: false` (default) → `cloneChainFromSurvey` still
   throws `SystemError`.
2. Missing entity + `skipMissingEntityAttributes: true` → the chain clones successfully; the
   analysis attribute tied to the missing entity is absent from the target survey; other analysis
   attributes belonging to entities that do exist in the target still clone normally.
