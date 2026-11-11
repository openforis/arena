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
   - **Revision:** the component previously also filtered candidates down to attributes whose
     *name* already matched one of the 1st-phase category's extra property names
     (`nodeDefFilter: (nodeDef) => firstPhaseCategoryExtraDefNames.includes(NodeDef.getName(nodeDef))`).
     That filter is removed. Requiring the same name made the manual selector redundant (if the
     name always had to match, the tool could resolve it automatically instead of asking the user
     to pick); matching happens by *value* against the category's extra properties, not by name,
     so the attribute name is free to differ. This drops the `firstPhaseCategoryUuid` /
     `useSelector` / extra-def-name lookup from the component entirely.

3. `server/modules/analysis/service/chainSummaryGenerator.js`
   - `getCodeAttributeSummary('commonAttribute', firstPhaseCommonAttributeDef)` currently always
     emits `commonAttributeCategory` / `commonAttributeCategoryLevel`, which only make sense for
     a code attribute (its position in a category hierarchy). When the resolved common attribute
     def is a text attribute, emit empty strings for those two fields instead (mirrors the
     existing `NodeDef.isCode(...) ? ... : ''` pattern already used in this file for
     `resultVariables[].categoryName`). `commonAttribute` (the attribute name) is unaffected.

4. `core/i18n/resources/en/common.js` — update `chainView.firstPhaseCommonAttribute.info`
   (lines 761-765). Original text:
   > "Attribute in common between base unit and 1st phase table (it must be a code attribute
   > with the same name of an extra property defined for the 1st phase category)"

   Final text (revised after dropping the same-name filter, see item 2):
   > "Attribute in common between base unit and 1st phase table (it must be a code or text
   > attribute; its value is matched against the extra properties defined for the 1st phase
   > category - the attribute name does not need to match the extra property name)"

   **Update:** the other locale files (es/fr/ru/pt/mn) were subsequently updated too, with
   translations of the final text above. Confidence is high for es/fr/pt, moderate for ru, and
   low for mn (best-effort, worth a native-speaker review).

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
