# 1st phase stratum attribute (extra prop) selector — design

## Problem

In the chain sampling design props UI, when two-phase sampling is selected, the 1st
phase category selector becomes visible. There is currently no way to pick which
extra property of that 1st phase category represents the stratum attribute for the
1st phase. Additionally, the existing "Stratum attribute" field (which applies to the
2nd phase in two-phase sampling) doesn't make that phase explicit in its label.

## Design

### Domain model (`common/analysis/chainSamplingDesign.js`)

- New prop key `firstPhaseCategoryExtraProp`, storing the **name** of an extra prop
  defined on the 1st phase category (extra props are keyed by name; they have no
  stable uuid — `ExtraPropDef.extraDefsToArray` generates uuids on the fly for
  in-memory use only).
- `getFirstPhaseCategoryExtraProp` / `assocFirstPhaseCategoryExtraProp` /
  `dissocFirstPhaseCategoryExtraProp` following the existing get/assoc/dissoc
  conventions.
- `assocFirstPhaseCategoryUuid` also dissocs `firstPhaseCategoryExtraProp` when the
  category changes (mirrors existing handling of `firstPhaseCommonAttributeUuid`).
- `cleanupSamplingDesign` dissocs `firstPhaseCategoryExtraProp` whenever
  `isFirstPhaseCategorySelectionEnabled` is false (mirrors existing handling of the
  other first-phase props).

### UI: new selector component

`webapp/views/App/views/Analysis/Chain/FirstPhaseCategoryExtraPropSelector.js`:

- Reads the 1st phase category's extra prop names via
  `Category.getItemExtraDefsArray` + `ExtraPropDef.getName` (same data source
  `FirstPhaseCommonAttributeSelector.js` already uses to build its name filter).
- Renders a plain `Dropdown` (not the NodeDef-based `BaseUnitCodeAttributeSelector`)
  with those names as selectable items — this selects an extra prop of the category
  itself, not a survey node def attribute.
- Label: `chainView.firstPhaseCategoryExtraProp.label` = "1st phase stratum
  attribute".
- Disabled when the chain isn't editable (`useChainEditable`), consistent with
  sibling selectors.

### Placement

In `ChainSamplingDesignProps.js`, rendered immediately after `<FirstPhaseCategorySelector />`,
under the same `ChainSamplingDesign.isFirstPhaseCategorySelectionEnabled(samplingDesign)`
condition (i.e., only when two-phase sampling is selected and the category selector is shown).

### Label change on existing selector

`StratumAttributeSelector.js`: label becomes `chainView.stratumAttribute2ndPhase`
("2nd phase stratum attribute") when
`ChainSamplingDesign.isFirstPhaseCategorySelectionEnabled(samplingDesign)` is true,
otherwise stays `chainView.stratumAttribute` ("Stratum attribute").

### Translations

Add `chainView.firstPhaseCategoryExtraProp.label` and `chainView.stratumAttribute2ndPhase`
to all locale files: en, es, ru, pt, mn, fr (`core/i18n/resources/<locale>/common.js`).

## Out of scope

- No `info` tooltip is added for the new field (not requested).
- No changes to server-side chain summary/report generation — this only adds a
  stored prop value; consuming it in R report generation is a separate concern not
  requested here.
