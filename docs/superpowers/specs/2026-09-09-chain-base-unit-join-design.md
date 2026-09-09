# Chain sampling design: auto-detected Phase-1 / base-unit join method

## Context

Open Foris Arena's "Analysis" module has a "Chain" concept — a statistical
analysis pipeline whose editable properties include a "sampling design"
(`common/analysis/chainSamplingDesign.js`). Under the `twoPhase` sampling
strategy, the chain references a base unit entity (`baseUnitNodeDefUuid`)
and a "Phase-1 category" (`firstPhaseCategoryUuid`) — a separate table of
first-phase sample records. Today, joining the base unit's records with the
Phase-1 category's items always requires the analyst to pick a "Common
attribute" (`firstPhaseCommonAttributeUuid`, exposed to R as
`commonAttribute` in the generated `chain_summary.json`) — an attribute on
the base unit (or its ancestors) whose value is matched against the
Phase-1 category's extra properties.

There is a second case where no such attribute is needed at all: when the
base unit entity's own key attribute *is itself* a code attribute drawn
from the `sampling_point_data` category (`core/survey/category.js`'s
`samplingPointDataCategoryName`/`isSamplingPointDataCategory` — defined but,
per a full-repo search, never previously used by any chain/analysis code).
In that case the base unit's key IS the sampling-point-data item, and if
the same `sampling_point_data` category also serves as the Phase-1
category, the two tables are already inherently linked — no explicit join
attribute is meaningful or needed.

This spec adds automatic detection of that second case and adjusts the
sampling-design edit form and the generated `chain_summary.json`
accordingly. **No new R-generation code is added** — Arena continues to
only expose metadata; the analyst's own R script (in `scriptCommon`/
`scriptEnd`) is responsible for the actual join, exactly as it is today for
`commonAttribute`. This mirrors the existing division of responsibility
confirmed by reading the full R-generation pipeline
(`server/modules/analysis/service/rChain/`): Arena has never generated
join code for this, only exposed the values an analyst's script needs.

## Goal

1. Detect, from survey structure alone (no new stored chain property),
   whether the base unit's key attribute uses the `sampling_point_data`
   category.
2. When true: show explanatory text in the sampling-design form instead of
   the "Common attribute" selector, and add a `phase2AsSamplingPointData:
   true` field to the generated chain summary JSON.
3. When false: behavior is unchanged from today — the "Common attribute"
   selector is shown, and it becomes a **hard-required** field (new
   validation; today no sampling-design field has field-level required
   validation, and this is the first one added deliberately, confirmed with
   the user rather than assumed).
4. No manual override — this is a fully automatic, non-configurable rule
   per the user's explicit choice.

## Approach

### 1. Detection predicate (`common/analysis/chainSamplingDesign.js`)

A new survey-aware function:

```js
const isFirstPhaseSamplingPointDataJoinMethod = ({ survey, baseUnitNodeDef }) => {
  if (!baseUnitNodeDef) return false
  return Survey.getNodeDefKeys(baseUnitNodeDef)(survey).some(
    (keyAttrDef) =>
      NodeDef.isCode(keyAttrDef) &&
      Category.isSamplingPointDataCategory(Survey.getCategoryByUuid(NodeDef.getCategoryUuid(keyAttrDef))(survey))
  )
}
```

`Survey.getNodeDefKeys(nodeDef)(survey)` (existing, `core/survey/_survey/
surveyNodeDefs.js`) returns an entity's key descendant attributes within
single entities — exactly the "base unit entity's key attribute(s)" this
needs. `Category.isSamplingPointDataCategory` already exists and does
exactly the category check needed; this is its first real caller.

A second new function combines this with the existing strategy check, and
is used everywhere the OLD `isFirstPhaseCommonAttributeSelectionEnabled`
was used *except* inside the module's own pure cleanup cascade (see below):

```js
const isFirstPhaseCommonAttributeRequired = ({ samplingDesign, survey, baseUnitNodeDef }) =>
  isFirstPhaseCategorySelectionEnabled(samplingDesign) &&
  !isFirstPhaseSamplingPointDataJoinMethod({ survey, baseUnitNodeDef })
```

This single function answers both "should the Common attribute selector be
shown" and "is it required" — in this design those are the same question
(if it's shown, it's required; there's no shown-but-optional state), so one
function serves both the UI-gating and the validator.

**Why the old `isFirstPhaseCommonAttributeSelectionEnabled` (pure,
strategy-only, no survey needed) is kept, unchanged, rather than replaced:**
it is called today from `cleanupSamplingDesign`, a pure function operating
only on the `samplingDesign` object with no access to `survey` — it's used
whenever `samplingStrategy`/`firstPhaseCategoryUuid`/`stratumNodeDefUuid`
change, to strip now-irrelevant sibling props. Threading `survey` through
that whole cascade (used by several `assocXxx` setters) would be a much
larger, riskier change for no real behavioral benefit: the auto-detected
condition depends only on the base unit entity, which practically never
changes as a side effect of editing sampling-strategy-related props. The
one case where a stale `firstPhaseCommonAttributeUuid` could be left set
but unused (user picks a base unit that newly qualifies for the automatic
method) is inert — the UI stops showing it, the validator stops requiring
it, and the summary generator stops emitting it, all because they use the
new survey-aware function. It just isn't proactively cleared from storage.
This is a deliberate, minor scope decision, not an oversight.

### 2. UI (`webapp/views/App/views/Analysis/Chain/`)

`ChainSamplingDesignProps.js` already computes `baseUnitNodeDef` (line 32).
Add:

```js
const isSamplingPointDataJoinMethod = ChainSamplingDesign.isFirstPhaseSamplingPointDataJoinMethod({
  survey,
  baseUnitNodeDef,
})
```

and change the existing conditional block (currently gated on
`isFirstPhaseCommonAttributeSelectionEnabled`) to:

```jsx
{ChainSamplingDesign.isFirstPhaseCategorySelectionEnabled(samplingDesign) &&
  (isSamplingPointDataJoinMethod ? (
    <FirstPhaseSamplingPointDataJoinInfo />
  ) : (
    <FirstPhaseCommonAttributeSelector />
  ))}
```

A new, minimal component `FirstPhaseSamplingPointDataJoinInfo.js` renders a
`FormItem` with a translated explanatory sentence as its body — no new
shared "info box" component is introduced; this project has no existing
one to reuse, and a single `<div>` is enough for one sentence.

`FirstPhaseCommonAttributeSelector.js` (unchanged in behavior when shown)
gains real validation display: it reads `Chain.getValidation(chain)`,
extracts the field validation via `Validation.getFieldValidation(
ChainSamplingDesign.keysProps.firstPhaseCommonAttributeUuid)(validation)`,
and passes it into `BaseUnitAttributeSelector` (shared by this selector and
`StratumAttributeSelector`), which gains a new **optional** `validation`
prop — when provided, it wraps its `Dropdown` in the already-existing
`FormItemWithValidation`/`ValidationTooltip` (used elsewhere, e.g.
`ChainRStudioPanel.js`'s checkboxes) instead of the plain `FormItem` it
uses today. `StratumAttributeSelector` doesn't pass the new prop, so its
behavior is unchanged.

### 3. Validation (`common/analysis/chainValidator.js`, new territory)

No sampling-design field has field-level required validation today (the
file only validates the chain's default-language label and that at least
one analysis node def exists). This adds the first one:

```js
const _validateFirstPhaseCommonAttribute =
  ({ chain, survey }) =>
  () => {
    const samplingDesign = Chain.getSamplingDesign(chain)
    const baseUnitNodeDef = Survey.getBaseUnitNodeDef({ chain })(survey)
    return ChainSamplingDesign.isFirstPhaseCommonAttributeRequired({ samplingDesign, survey, baseUnitNodeDef }) &&
      !ChainSamplingDesign.getFirstPhaseCommonAttributeUuid(samplingDesign)
      ? ValidationResult.newInstance(Validation.messageKeys.analysis.firstPhaseCommonAttributeRequired)
      : null
  }
```

registered in `validateChain` (which already receives `survey`) under the
path `` `${Chain.keys.props}.${Chain.keysProps.samplingDesign}.${ChainSamplingDesign.keysProps.firstPhaseCommonAttributeUuid}` ``
— matching the existing convention (`Validator.validate`'s path-to-field-key
extraction takes the last dot-segment, which resolves to
`firstPhaseCommonAttributeUuid`, exactly what the UI looks up).

A new message key `firstPhaseCommonAttributeRequired` is added to
`core/validation/_validator/validatorErrorKeys.ts` (`analysis` section) and
to `core/i18n/resources/*/validationErrors.js` for all six languages this
project maintains (en/es/fr/mn/pt/ru — confirmed this project translates
every new user-facing string immediately, not just in English, via its own
recent commit history).

### 4. Chain summary JSON (`server/modules/analysis/service/chainSummaryGenerator.js`)

The existing `commonAttribute` block's condition changes from
`isFirstPhaseCommonAttributeSelectionEnabled` to
`isFirstPhaseCommonAttributeRequired({ samplingDesign, survey, baseUnitNodeDef })`
— its behavior is otherwise unchanged (still only present when the
explicit-join case applies, which is exactly what the redefined function
still expresses, now also accounting for the sampling-point-data case).

A new field is added, present only when the automatic method applies:

```js
...(ChainSamplingDesign.isFirstPhaseSamplingPointDataJoinMethod({ survey, baseUnitNodeDef })
  ? { phase2AsSamplingPointData: true }
  : {}),
```

`phase2AsSamplingPointData` (name chosen by the user) mirrors
`commonAttribute`'s own presence-means-something convention — an analyst's
R script can check either key's presence the same way.

### 5. Clone-sanitization — verified, no change needed

`server/modules/analysis/manager/chain/index.js`'s
`_sanitizeChainPropsForClone` spreads the entire source `samplingDesign`
object and only special-cases specific UUID-reference fields that need
remapping or clearing on clone to another survey. Nothing in this feature
adds a new stored property (the join method is fully derived, never
stored), so this file requires no change — confirmed by reading it, not
assumed.

## Out of scope

- No R-generation code for the actual join (confirmed with the user —
  metadata only, matching the existing `commonAttribute` precedent).
- No manual override for the automatic detection (confirmed with the
  user).
- No change to `checkChangeRequiresSurveyPublish` (`common/analysis/
  chain.js`) — it already doesn't track `firstPhaseCommonAttributeUuid`
  changes either, and this feature doesn't add a new stored/tracked prop.
- No proactive clearing of a stale `firstPhaseCommonAttributeUuid` when a
  base unit change newly qualifies for the automatic method (see §1 — inert,
  not a bug).

## Testing

Unit tests, mirroring the existing style in `test/unit/tests/
042chainSamplingDesign.test.js` (plain `describe`/`test`, object literals,
no DB):
- `isFirstPhaseSamplingPointDataJoinMethod`: true when the base unit's key
  attribute is a code attribute on the `sampling_point_data` category;
  false when the base unit has no key attribute on that category, when the
  key attribute isn't a code type, and when there's no base unit at all.
- `isFirstPhaseCommonAttributeRequired`: combines the strategy check and
  the new predicate correctly across all four combinations (twoPhase ×
  sampling-point-data, twoPhase × not, other-strategy × sampling-point-data,
  other-strategy × not).

A focused unit test for the new validator function in `chainValidator.js`
(no existing unit test file covers this module; a new one is added,
constructing a minimal survey/chain fixture rather than using the
integration-test DB-backed `SB` builder, since existing validator logic in
this codebase is tested at the pure-function level elsewhere).

Manual verification in the browser: open a chain's sampling design with a
`twoPhase` strategy and a base unit keyed by a `sampling_point_data`
category attribute — confirm the info text appears (not the dropdown), and
that downloading the chain summary JSON includes
`phase2AsSamplingPointData: true` and omits `commonAttribute`. Then switch
the base unit to one with an ordinary key attribute — confirm the "Common
attribute" dropdown reappears, that leaving it empty shows a validation
error, and that setting it makes the summary JSON include `commonAttribute`
again (matching today's existing output shape) and omit
`phase2AsSamplingPointData`.
