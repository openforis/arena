# Two-Phase Sampling: allow text common attribute

## Context

In Chain > Sampling design > Two-Phase Sampling, the base unit's "Common attribute" links
a base-unit attribute to an extra property of the 1st-phase category (matched by name; values
compared as strings). Today the selector only lists **code** attributes
(`BaseUnitCodeAttributeSelector.js`), and the info popup says the attribute "must be a code
attribute with the same name of an extra property defined for the 1st phase category".

Since the match is a string comparison, a **text** attribute works just as well as a code
attribute. This spec allows the common attribute to be either type.

The same shared selector component (`BaseUnitCodeAttributeSelector`) also backs two other,
unrelated selectors — "Stratum attribute" and "Post-stratification attribute" — which must
**stay code-only**.

## Changes

1. `webapp/views/App/views/Analysis/Chain/BaseUnitCodeAttributeSelector.js`
   - Add an optional `nodeDefTypes` prop (array of `NodeDef` types), defaulting to
     `[NodeDef.nodeDefType.code]`.
   - Replace the hardcoded `NodeDef.isCode(descendantDef)` filter with
     `nodeDefTypes.includes(NodeDef.getType(descendantDef))`.
   - No change for existing callers (Stratum attribute, Post-stratification attribute), which
     don't pass the new prop and keep the code-only default.

2. `webapp/views/App/views/Analysis/Chain/FirstPhaseCommonAttributeSelector.js`
   - Pass `nodeDefTypes={[NodeDef.nodeDefType.code, NodeDef.nodeDefType.text]}`.

3. `server/modules/analysis/service/chainSummaryGenerator.js`
   - `getCodeAttributeSummary('commonAttribute', firstPhaseCommonAttributeDef)` currently always
     emits `commonAttributeCategory` / `commonAttributeCategoryLevel`, which only make sense for
     a code attribute (its position in a category hierarchy). When the resolved common attribute
     def is a text attribute, emit empty strings for those two fields instead (mirrors the
     existing `NodeDef.isCode(...) ? ... : ''` pattern already used in this file for
     `resultVariables[].categoryName`). `commonAttribute` (the attribute name) is unaffected.

4. `core/i18n/resources/en/common.js` — update `chainView.firstPhaseCommonAttribute.info`
   (lines 761-765) from:
   > "Attribute in common between base unit and 1st phase table (it must be a code attribute
   > with the same name of an extra property defined for the 1st phase category)"

   to:
   > "Attribute in common between base unit and 1st phase table (it must be a code or text
   > attribute with the same name of an extra property defined for the 1st phase category)"

   Other locale files (es/fr/ru/pt/mn) are left unchanged — no reliable translation available;
   their copy remains stale until translated separately.

## Out of scope

- No server-side validation currently enforces the code-only restriction beyond the dropdown's
  filtering; none is being added for text, consistent with the current code-attribute behavior.
- No rename of `BaseUnitCodeAttributeSelector` (still shared, still defaults to code-only).
- No changes to the Stratum attribute or Post-stratification attribute selectors.

## Testing

- Existing unit tests in `test/unit/tests/042chainSamplingDesign.test.js` cover
  `ChainSamplingDesign` behavior and are unaffected (no domain-model changes).
- Manual verification: create a two-phase sampling chain, confirm a text attribute now appears
  in the "Common attribute" dropdown alongside code attributes, and that selecting one persists
  and the info popup shows the updated text.
