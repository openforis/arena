# Chain Sampling Design: Auto-Detected Phase-1/Base-Unit Join Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Detect, from survey structure alone, whether a chain's base unit entity is keyed by a `sampling_point_data`-category code attribute; when it is, show explanatory text instead of the "Common attribute" selector in the sampling design form, make that selector hard-required when it's shown, and reflect both outcomes in the generated chain summary JSON — with no new R-generation code (metadata only, matching the existing `commonAttribute` precedent).

**Architecture:** A new survey-aware predicate pair in `common/analysis/chainSamplingDesign.js` (`isFirstPhaseSamplingPointDataJoinMethod`, `isFirstPhaseCommonAttributeRequired`) is the single source of truth, consumed by: the sampling-design form (which base unit selector or which UI to render), `common/analysis/chainValidator.js` (new required-field validation — the first field-level validation for any sampling-design prop in this codebase), and `chainSummaryGenerator.js` (which JSON keys to emit). No new stored chain property is introduced — the join method is always derived live from the base unit's node-def/category structure.

**Tech Stack:** Existing JS (this part of the codebase is not TypeScript) — React/Redux for the webapp, the existing `Validator`/`Validation`/`ValidationResult` core validation framework, `@openforis/arena-core`'s `SurveyFactory`/`NodeDefFactory`/`CategoryFactory` for unit-test fixtures (verified working directly against the real test infra before writing this plan — see Task 1).

## Global Constraints

- Branch: `feat/chain-base-unit-join` (already checked out, created from `master`).
- No R-generation code — Arena only exposes metadata; the analyst's own R script (`scriptCommon`/`scriptEnd`) does the actual join, exactly as it already does for `commonAttribute` today.
- No manual override for the automatic detection (confirmed with the user).
- The chain summary JSON field name for the automatic-method case is `phase2AsSamplingPointData` (boolean, always present, `true` only when the method applies — chosen by the user, not to be changed).
- Every new user-facing string (form label, form description, validation error message) must be added to all six language files this project maintains: `core/i18n/resources/{en,es,fr,mn,pt,ru}/`. Do not add English-only placeholders — this project's own recent commit history (`4f94889d9`, "Messages: allow targeting survey admins") shows every new key translated into all six languages in the same commit.
- **Critical, independently verified detail:** a `ValidationResult.newInstance(key)` whose `key` resolves to `undefined` (i.e. the message key constant doesn't exist yet in `core/validation/_validator/validatorErrorKeys.ts`) is silently swallowed by `core/validation/validator.ts`'s `extractNestedErrorsOrWarnings` — the field will show as *valid* even though the validator logically returned an error. This was confirmed by actually running the new validator end-to-end against a real fixture before writing this plan (see Task 1) — the message key MUST be added to `validatorErrorKeys.ts` in the same task as the validator function, not deferred.
- Design doc: `docs/superpowers/specs/2026-09-09-chain-base-unit-join-design.md`.

---

### Task 1: Core domain predicates, validation, and unit tests

**Files:**
- Modify: `common/analysis/chainSamplingDesign.js`
- Modify: `common/analysis/chainValidator.js`
- Modify: `core/validation/_validator/validatorErrorKeys.ts`
- Modify: `core/i18n/resources/{en,es,fr,mn,pt,ru}/validationErrors.js`
- Modify: `test/unit/tests/042chainSamplingDesign.test.js`
- Create: `test/unit/tests/043chainValidator.test.js`

**Interfaces:**
- Produces: `ChainSamplingDesign.isFirstPhaseSamplingPointDataJoinMethod({ survey, baseUnitNodeDef }): boolean` and `ChainSamplingDesign.isFirstPhaseCommonAttributeRequired({ samplingDesign, survey, baseUnitNodeDef }): boolean`, both exported from `@common/analysis/chainSamplingDesign`. Task 2 and Task 3 both import and call these with the same argument shapes.
- Consumes: nothing new from other tasks — this is the foundation task.

- [ ] **Step 1: Write the failing tests**

In `test/unit/tests/042chainSamplingDesign.test.js`, current full file:

```js
import { ChainSamplingDesign } from '@common/analysis/chainSamplingDesign'

const { samplingStrategies } = ChainSamplingDesign

describe('ChainSamplingDesign.firstPhaseCategoryExtraProp', () => {
  it('is undefined by default', () => {
    const samplingDesign = {}
    expect(ChainSamplingDesign.getFirstPhaseCategoryExtraProp(samplingDesign)).toBeUndefined()
  })

  it('can be set and read back', () => {
    const samplingDesign = ChainSamplingDesign.assocFirstPhaseCategoryExtraProp('design_psu')({})
    expect(ChainSamplingDesign.getFirstPhaseCategoryExtraProp(samplingDesign)).toBe('design_psu')
  })

  it('is enabled only when two-phase sampling is selected', () => {
    const twoPhase = { samplingStrategy: samplingStrategies.twoPhase }
    const stratifiedRandom = { samplingStrategy: samplingStrategies.stratifiedRandom }
    expect(ChainSamplingDesign.isFirstPhaseCategoryExtraPropSelectionEnabled(twoPhase)).toBe(true)
    expect(ChainSamplingDesign.isFirstPhaseCategoryExtraPropSelectionEnabled(stratifiedRandom)).toBe(false)
  })

  it('is cleared when sampling strategy changes away from two-phase', () => {
    let samplingDesign = { samplingStrategy: samplingStrategies.twoPhase }
    samplingDesign = ChainSamplingDesign.assocFirstPhaseCategoryExtraProp('design_psu')(samplingDesign)
    samplingDesign = ChainSamplingDesign.assocSamplingStrategy(samplingStrategies.stratifiedRandom)(samplingDesign)
    expect(ChainSamplingDesign.getFirstPhaseCategoryExtraProp(samplingDesign)).toBeUndefined()
  })

  it('is cleared when the 1st phase category changes', () => {
    let samplingDesign = { samplingStrategy: samplingStrategies.twoPhase, firstPhaseCategoryUuid: 'cat-1' }
    samplingDesign = ChainSamplingDesign.assocFirstPhaseCategoryExtraProp('design_psu')(samplingDesign)
    samplingDesign = ChainSamplingDesign.assocFirstPhaseCategoryUuid('cat-2')(samplingDesign)
    expect(ChainSamplingDesign.getFirstPhaseCategoryExtraProp(samplingDesign)).toBeUndefined()
    expect(ChainSamplingDesign.getFirstPhaseCategoryUuid(samplingDesign)).toBe('cat-2')
  })
})
```

Change the top imports from:

```js
import { ChainSamplingDesign } from '@common/analysis/chainSamplingDesign'

const { samplingStrategies } = ChainSamplingDesign
```

to:

```js
import { SurveyFactory, NodeDefFactory, CategoryFactory } from '@openforis/arena-core'

import { ChainSamplingDesign } from '@common/analysis/chainSamplingDesign'
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Category from '@core/survey/category'

const { samplingStrategies } = ChainSamplingDesign
```

Leave the existing `describe('ChainSamplingDesign.firstPhaseCategoryExtraProp', ...)` block completely unchanged, and append the following after its closing `})` (i.e. at the end of the file):

```js
const _buildSurveyWithBaseUnit = ({ baseUnitKeyIsSamplingPointData }) => {
  let survey = SurveyFactory.createInstance({ name: 'test_survey' })

  const category = CategoryFactory.createInstance({
    props: { name: baseUnitKeyIsSamplingPointData ? Category.samplingPointDataCategoryName : 'other_category' },
  })
  survey = { ...survey, categories: { [category.uuid]: category } }

  const root = NodeDefFactory.createInstance({ type: NodeDef.nodeDefType.entity, props: { name: 'root' } })
  survey = Survey.assocNodeDef({ nodeDef: root })(survey)

  const plot = NodeDefFactory.createInstance({
    type: NodeDef.nodeDefType.entity,
    nodeDefParent: root,
    props: { name: 'plot', multiple: true },
  })
  survey = Survey.assocNodeDef({ nodeDef: plot })(survey)

  const plotId = NodeDefFactory.createInstance({
    type: NodeDef.nodeDefType.code,
    nodeDefParent: plot,
    props: { name: 'plot_id', key: true, categoryUuid: category.uuid },
  })
  survey = Survey.assocNodeDef({ nodeDef: plotId })(survey)

  return { survey, baseUnitNodeDef: plot }
}

describe('ChainSamplingDesign.isFirstPhaseSamplingPointDataJoinMethod', () => {
  it('is true when the base unit key attribute is a code attribute on the sampling_point_data category', () => {
    const { survey, baseUnitNodeDef } = _buildSurveyWithBaseUnit({ baseUnitKeyIsSamplingPointData: true })
    expect(ChainSamplingDesign.isFirstPhaseSamplingPointDataJoinMethod({ survey, baseUnitNodeDef })).toBe(true)
  })

  it('is false when the base unit key attribute is a code attribute on a different category', () => {
    const { survey, baseUnitNodeDef } = _buildSurveyWithBaseUnit({ baseUnitKeyIsSamplingPointData: false })
    expect(ChainSamplingDesign.isFirstPhaseSamplingPointDataJoinMethod({ survey, baseUnitNodeDef })).toBe(false)
  })

  it('is false when there is no base unit', () => {
    const { survey } = _buildSurveyWithBaseUnit({ baseUnitKeyIsSamplingPointData: true })
    expect(ChainSamplingDesign.isFirstPhaseSamplingPointDataJoinMethod({ survey, baseUnitNodeDef: null })).toBe(false)
  })
})

describe('ChainSamplingDesign.isFirstPhaseCommonAttributeRequired', () => {
  const { samplingStrategies } = ChainSamplingDesign

  it('is true for two-phase sampling with a base unit not keyed by sampling_point_data', () => {
    const { survey, baseUnitNodeDef } = _buildSurveyWithBaseUnit({ baseUnitKeyIsSamplingPointData: false })
    const samplingDesign = { samplingStrategy: samplingStrategies.twoPhase }
    expect(ChainSamplingDesign.isFirstPhaseCommonAttributeRequired({ samplingDesign, survey, baseUnitNodeDef })).toBe(
      true
    )
  })

  it('is false for two-phase sampling with a base unit keyed by sampling_point_data', () => {
    const { survey, baseUnitNodeDef } = _buildSurveyWithBaseUnit({ baseUnitKeyIsSamplingPointData: true })
    const samplingDesign = { samplingStrategy: samplingStrategies.twoPhase }
    expect(ChainSamplingDesign.isFirstPhaseCommonAttributeRequired({ samplingDesign, survey, baseUnitNodeDef })).toBe(
      false
    )
  })

  it('is false when sampling strategy is not two-phase, regardless of base unit', () => {
    const { survey, baseUnitNodeDef } = _buildSurveyWithBaseUnit({ baseUnitKeyIsSamplingPointData: false })
    const samplingDesign = { samplingStrategy: samplingStrategies.stratifiedRandom }
    expect(ChainSamplingDesign.isFirstPhaseCommonAttributeRequired({ samplingDesign, survey, baseUnitNodeDef })).toBe(
      false
    )
  })
})
```

Create `test/unit/tests/043chainValidator.test.js`:

```js
import { SurveyFactory, NodeDefFactory, CategoryFactory } from '@openforis/arena-core'

import { validateChain } from '@common/analysis/chainValidator'
import { ChainSamplingDesign } from '@common/analysis/chainSamplingDesign'
import * as Validation from '@core/validation/validation'
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Category from '@core/survey/category'

const { samplingStrategies } = ChainSamplingDesign

const _buildSurveyWithBaseUnit = ({ baseUnitKeyIsSamplingPointData }) => {
  let survey = SurveyFactory.createInstance({ name: 'test_survey' })

  const category = CategoryFactory.createInstance({
    props: { name: baseUnitKeyIsSamplingPointData ? Category.samplingPointDataCategoryName : 'other_category' },
  })
  survey = { ...survey, categories: { [category.uuid]: category } }

  const root = NodeDefFactory.createInstance({ type: NodeDef.nodeDefType.entity, props: { name: 'root' } })
  survey = Survey.assocNodeDef({ nodeDef: root })(survey)

  const plot = NodeDefFactory.createInstance({
    type: NodeDef.nodeDefType.entity,
    nodeDefParent: root,
    props: { name: 'plot', multiple: true },
  })
  survey = Survey.assocNodeDef({ nodeDef: plot })(survey)

  const plotId = NodeDefFactory.createInstance({
    type: NodeDef.nodeDefType.code,
    nodeDefParent: plot,
    props: { name: 'plot_id', key: true, categoryUuid: category.uuid },
  })
  survey = Survey.assocNodeDef({ nodeDef: plotId })(survey)

  return { survey, baseUnitNodeDef: plot }
}

const _buildChain = ({ baseUnitNodeDefUuid, firstPhaseCommonAttributeUuid }) => ({
  props: {
    labels: { en: 'test chain' },
    samplingDesign: {
      samplingStrategy: samplingStrategies.twoPhase,
      baseUnitNodeDefUuid,
      ...(firstPhaseCommonAttributeUuid ? { firstPhaseCommonAttributeUuid } : {}),
    },
  },
})

describe('chainValidator - firstPhaseCommonAttributeUuid required field', () => {
  it('reports an error when required and missing', async () => {
    const { survey, baseUnitNodeDef } = _buildSurveyWithBaseUnit({ baseUnitKeyIsSamplingPointData: false })
    const chain = _buildChain({ baseUnitNodeDefUuid: NodeDef.getUuid(baseUnitNodeDef) })

    const validation = await validateChain({ chain, defaultLang: 'en', survey })
    const fieldValidation = Validation.getFieldValidation(
      ChainSamplingDesign.keysProps.firstPhaseCommonAttributeUuid
    )(validation)

    expect(Validation.isValid(fieldValidation)).toBe(false)
  })

  it('reports no error when the sampling point data method applies', async () => {
    const { survey, baseUnitNodeDef } = _buildSurveyWithBaseUnit({ baseUnitKeyIsSamplingPointData: true })
    const chain = _buildChain({ baseUnitNodeDefUuid: NodeDef.getUuid(baseUnitNodeDef) })

    const validation = await validateChain({ chain, defaultLang: 'en', survey })
    const fieldValidation = Validation.getFieldValidation(
      ChainSamplingDesign.keysProps.firstPhaseCommonAttributeUuid
    )(validation)

    expect(Validation.isValid(fieldValidation)).toBe(true)
  })

  it('reports no error when firstPhaseCommonAttributeUuid is set', async () => {
    const { survey, baseUnitNodeDef } = _buildSurveyWithBaseUnit({ baseUnitKeyIsSamplingPointData: false })
    const chain = _buildChain({
      baseUnitNodeDefUuid: NodeDef.getUuid(baseUnitNodeDef),
      firstPhaseCommonAttributeUuid: 'some-uuid',
    })

    const validation = await validateChain({ chain, defaultLang: 'en', survey })
    const fieldValidation = Validation.getFieldValidation(
      ChainSamplingDesign.keysProps.firstPhaseCommonAttributeUuid
    )(validation)

    expect(Validation.isValid(fieldValidation)).toBe(true)
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `yarn build:test:unit`
Expected: FAIL — webpack build error, since `ChainSamplingDesign.isFirstPhaseSamplingPointDataJoinMethod`/`isFirstPhaseCommonAttributeRequired` don't exist yet (the test files reference them, causing either a build error if referenced as a clearly-undefined export pattern in this codebase's lint/webpack setup, or — more likely, since JS doesn't statically check this — the build will succeed but running the tests will fail with `TypeError: ChainSamplingDesign.isFirstPhaseSamplingPointDataJoinMethod is not a function`). Run `npx jest dist/__tests__/bundle.unit.js -t "isFirstPhaseSamplingPointDataJoinMethod"` and confirm this exact TypeError.

- [ ] **Step 3: Implement the domain predicates**

In `common/analysis/chainSamplingDesign.js`, current top of file:

```js
import { Objects } from '@openforis/arena-core'

import * as A from '@core/arena'
```

change to:

```js
import { Objects } from '@openforis/arena-core'

import * as A from '@core/arena'
import * as Category from '@core/survey/category'
import * as NodeDef from '@core/survey/nodeDef'
import * as Survey from '@core/survey/survey'
```

Current:

```js
const isFirstPhaseCommonAttributeSelectionEnabled = isFirstPhaseCategorySelectionEnabled
```

change to:

```js
const isFirstPhaseCommonAttributeSelectionEnabled = isFirstPhaseCategorySelectionEnabled

// Detects whether the base unit's own key attribute is a code attribute drawn from the
// sampling_point_data category - in that case the base unit's key IS the sampling-point-data
// item, so if the Phase-1 category is also sampling_point_data-derived the two tables are
// already inherently linked and no explicit join attribute is needed or shown.
const isFirstPhaseSamplingPointDataJoinMethod = ({ survey, baseUnitNodeDef }) => {
  if (!baseUnitNodeDef) return false
  return Survey.getNodeDefKeys(baseUnitNodeDef)(survey).some(
    (keyAttrDef) =>
      NodeDef.isCode(keyAttrDef) &&
      Category.isSamplingPointDataCategory(Survey.getCategoryByUuid(NodeDef.getCategoryUuid(keyAttrDef))(survey))
  )
}

// Whether the "Common attribute" selector should be shown AND is required: true only for
// two-phase sampling where the automatic sampling-point-data method does NOT apply.
const isFirstPhaseCommonAttributeRequired = ({ samplingDesign, survey, baseUnitNodeDef }) =>
  isFirstPhaseCategorySelectionEnabled(samplingDesign) &&
  !isFirstPhaseSamplingPointDataJoinMethod({ survey, baseUnitNodeDef })
```

Note: `isFirstPhaseCommonAttributeSelectionEnabled` itself is NOT changed or removed — it stays a pure, `samplingDesign`-only function, still used internally by `cleanupSamplingDesign` (a few lines below) which has no `survey` context available. See the design doc for why this split is deliberate.

Current (in the `ChainSamplingDesign` export object's READ section):

```js
  isFirstPhaseCategoryExtraPropSelectionEnabled,
  isFirstPhaseCategorySelectionEnabled,
  isFirstPhaseCommonAttributeSelectionEnabled,
```

change to:

```js
  isFirstPhaseCategoryExtraPropSelectionEnabled,
  isFirstPhaseCategorySelectionEnabled,
  isFirstPhaseCommonAttributeSelectionEnabled,
  isFirstPhaseCommonAttributeRequired,
  isFirstPhaseSamplingPointDataJoinMethod,
```

- [ ] **Step 4: Add the validation error message key**

In `core/validation/_validator/validatorErrorKeys.ts`, current:

```ts
  analysis: {
    labelDefaultLangRequired: 'validationErrors:analysis.labelDefaultLangRequired',
    analysisNodeDefsRequired: 'validationErrors:analysis.analysisNodeDefsRequired',
  },
```

change to:

```ts
  analysis: {
    labelDefaultLangRequired: 'validationErrors:analysis.labelDefaultLangRequired',
    analysisNodeDefsRequired: 'validationErrors:analysis.analysisNodeDefsRequired',
    firstPhaseCommonAttributeRequired: 'validationErrors:analysis.firstPhaseCommonAttributeRequired',
  },
```

In each of `core/i18n/resources/en/validationErrors.js`, `core/i18n/resources/es/validationErrors.js`, `core/i18n/resources/fr/validationErrors.js`, `core/i18n/resources/mn/validationErrors.js`, `core/i18n/resources/pt/validationErrors.js`, `core/i18n/resources/ru/validationErrors.js`, the `analysis` block currently reads:

```js
  analysis: {
    labelDefaultLangRequired: '<existing translated text>',
    analysisNodeDefsRequired: '<existing translated text>',
  },
```

Add `firstPhaseCommonAttributeRequired` as a third key in each file's `analysis` block, using exactly this text per language:

- `en`: `'A join attribute between Phase-1 and base unit tables is required'`
- `es`: `'Se requiere un atributo de unión entre las tablas de la 1ª fase y la unidad base'`
- `fr`: `"Un attribut de jointure entre les tables de la 1ère phase et de l'unité de base est requis"`
- `mn`: `'1-р үе шат ба суурь нэгжийн хүснэгтүүдийг холбох шинж чанар шаардлагатай'`
- `pt`: `'É necessário um atributo de junção entre as tabelas da 1ª fase e da unidade base'`
- `ru`: `'Требуется атрибут соединения между таблицами 1-й фазы и базовой единицы'`

(The Mongolian text is a best-effort translation matching this file's existing terminology for "1st phase"/"base unit" seen elsewhere in the same files — flag it for a native-speaker review; do not block on it.)

- [ ] **Step 5: Implement the validator**

In `common/analysis/chainValidator.js`, current top of file:

```js
import * as StringUtils from '@core/stringUtils'
import * as ObjectUtils from '@core/objectUtils'
import * as Validator from '@core/validation/validator'
import * as Validation from '@core/validation/validation'
import * as ValidationResult from '@core/validation/validationResult'
import * as Survey from '@core/survey/survey'
```

change to:

```js
import * as StringUtils from '@core/stringUtils'
import * as ObjectUtils from '@core/objectUtils'
import * as Validator from '@core/validation/validator'
import * as Validation from '@core/validation/validation'
import * as ValidationResult from '@core/validation/validationResult'
import * as Survey from '@core/survey/survey'

import * as Chain from './chain'
import { ChainSamplingDesign } from './chainSamplingDesign'
```

Current:

```js
export const validateChain = async ({ chain, defaultLang, survey }) =>
  Validator.validate(chain, {
    ..._validationsCommonProps(defaultLang),
    analysisNodeDefs: [_validateAnalysisNodeDefs({ chain, survey })],
  })
```

change to:

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

export const validateChain = async ({ chain, defaultLang, survey }) =>
  Validator.validate(chain, {
    ..._validationsCommonProps(defaultLang),
    analysisNodeDefs: [_validateAnalysisNodeDefs({ chain, survey })],
    [`${Chain.keys.props}.${Chain.keysProps.samplingDesign}.${ChainSamplingDesign.keysProps.firstPhaseCommonAttributeUuid}`]:
      [_validateFirstPhaseCommonAttribute({ chain, survey })],
  })
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `yarn build:test:unit && npx jest dist/__tests__/bundle.unit.js -t "ChainSamplingDesign.isFirstPhaseSamplingPointDataJoinMethod"`
Expected: PASS, 3/3 tests.

Run: `npx jest dist/__tests__/bundle.unit.js -t "ChainSamplingDesign.isFirstPhaseCommonAttributeRequired"`
Expected: PASS, 3/3 tests.

Run: `npx jest dist/__tests__/bundle.unit.js -t "chainValidator - firstPhaseCommonAttributeUuid required field"`
Expected: PASS, 3/3 tests.

Also run the pre-existing suite for this file to confirm no regression:
Run: `npx jest dist/__tests__/bundle.unit.js -t "ChainSamplingDesign.firstPhaseCategoryExtraProp"`
Expected: PASS, 4/4 tests (unchanged from before this task).

- [ ] **Step 7: Commit**

```bash
git add common/analysis/chainSamplingDesign.js common/analysis/chainValidator.js core/validation/_validator/validatorErrorKeys.ts core/i18n/resources/en/validationErrors.js core/i18n/resources/es/validationErrors.js core/i18n/resources/fr/validationErrors.js core/i18n/resources/mn/validationErrors.js core/i18n/resources/pt/validationErrors.js core/i18n/resources/ru/validationErrors.js test/unit/tests/042chainSamplingDesign.test.js test/unit/tests/043chainValidator.test.js
git commit -m "$(cat <<'EOF'
Detect sampling-point-data Phase-1/base-unit join method; require Common attribute otherwise

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Chain summary JSON

**Files:**
- Modify: `server/modules/analysis/service/chainSummaryGenerator.js`

**Interfaces:**
- Consumes: `ChainSamplingDesign.isFirstPhaseCommonAttributeRequired` and `ChainSamplingDesign.isFirstPhaseSamplingPointDataJoinMethod` from Task 1.

- [ ] **Step 1: Update the summary generator**

In `server/modules/analysis/service/chainSummaryGenerator.js`, current (the `generateChainSummary` return object):

```js
    ...(ChainSamplingDesign.isFirstPhaseCommonAttributeSelectionEnabled(chainSamplingDesign)
      ? getCodeAttributeSummary('commonAttribute', firstPhaseCommonAttributeDef)
      : {}),
```

change to:

```js
    ...(ChainSamplingDesign.isFirstPhaseCommonAttributeRequired({
      samplingDesign: chainSamplingDesign,
      survey,
      baseUnitNodeDef,
    })
      ? getCodeAttributeSummary('commonAttribute', firstPhaseCommonAttributeDef)
      : {}),
    phase2AsSamplingPointData: ChainSamplingDesign.isFirstPhaseSamplingPointDataJoinMethod({
      survey,
      baseUnitNodeDef,
    }),
```

`baseUnitNodeDef` is already computed earlier in this same function (`const baseUnitNodeDef = Survey.getBaseUnitNodeDef({ chain })(survey)`, near the top of `generateChainSummary`) — no new derivation needed, just reference the existing local variable.

- [ ] **Step 2: Verify no regressions**

There is no existing automated test covering `chainSummaryGenerator.js` (confirmed by repo search during design). Run the broader unit suite to confirm nothing else broke:

Run: `yarn build:test:unit && npx jest dist/__tests__/bundle.unit.js`
Expected: same pass/fail counts as before this task (no new failures related to `server/modules/analysis`).

- [ ] **Step 3: Commit**

```bash
git add server/modules/analysis/service/chainSummaryGenerator.js
git commit -m "$(cat <<'EOF'
Add phase2AsSamplingPointData to chain summary JSON when the automatic join method applies

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Sampling-design form UI

**Files:**
- Create: `webapp/views/App/views/Analysis/Chain/FirstPhaseSamplingPointDataJoinInfo.js`
- Modify: `webapp/views/App/views/Analysis/Chain/ChainSamplingDesignProps.js`
- Modify: `core/i18n/resources/{en,es,fr,mn,pt,ru}/common.js`

**Interfaces:**
- Consumes: `ChainSamplingDesign.isFirstPhaseSamplingPointDataJoinMethod` from Task 1.
- Produces: `FirstPhaseSamplingPointDataJoinInfo` component, rendered only by `ChainSamplingDesignProps.js`.

- [ ] **Step 1: Add the i18n label/description**

In each of `core/i18n/resources/{en,es,fr,mn,pt,ru}/common.js`, find the existing `firstPhaseCommonAttribute: { label: ..., info: ... }` block inside `chainView` (each language file has one, immediately before `formLabel:` in en/fr/mn/pt/ru, or immediately before `formLabel:` in es — in every file it's the block right after `firstPhaseCategoryExtraProp`). Add a new sibling key immediately after `firstPhaseCommonAttribute`'s closing `},`:

`en`:
```js
    firstPhaseSamplingPointDataJoinMethod: {
      label: 'Join method',
      description:
        "Base unit and 1st phase tables are joined using the Sampling Point Data method: the base unit's key attribute uses the Sampling Point Data category, so no separate join attribute is needed.",
    },
```

`es`:
```js
    firstPhaseSamplingPointDataJoinMethod: {
      label: 'Método de unión',
      description:
        'La unidad base y la tabla de primera fase se combinan mediante el método de Datos de Puntos de Muestreo: el atributo clave de la unidad base utiliza la categoría de Datos de Puntos de Muestreo, por lo que no es necesario especificar un atributo de unión.',
    },
```

`fr`:
```js
    firstPhaseSamplingPointDataJoinMethod: {
      label: 'Méthode de jointure',
      description:
        "L'unité de base et la table de 1ère phase sont jointes à l'aide de la méthode Sampling Point Data : l'attribut clé de l'unité de base utilise la catégorie Sampling Point Data, aucun attribut de jointure distinct n'est donc nécessaire.",
    },
```

`mn` (best-effort translation, flag for native-speaker review):
```js
    firstPhaseSamplingPointDataJoinMethod: {
      label: 'Холболтын арга',
      description:
        'Суурь нэгж ба 1-р үе шатны хүснэгтийг Түүврийн цэгийн өгөгдлийн аргаар холбоно: суурь нэгжийн түлхүүр шинж чанар Түүврийн цэгийн өгөгдлийн ангиллыг ашигладаг тул тусдаа холбох шинж чанар шаардлагагүй.',
    },
```

`pt`:
```js
    firstPhaseSamplingPointDataJoinMethod: {
      label: 'Método de junção',
      description:
        'A unidade base e a tabela da 1ª fase são unidas usando o método Sampling Point Data: o atributo chave da unidade base usa a categoria Sampling Point Data, portanto não é necessário um atributo de junção separado.',
    },
```

`ru`:
```js
    firstPhaseSamplingPointDataJoinMethod: {
      label: 'Метод соединения',
      description:
        'Базовая единица и таблица 1-й фазы соединяются с помощью метода Sampling Point Data: ключевой атрибут базовой единицы использует категорию Sampling Point Data, поэтому отдельный атрибут соединения не требуется.',
    },
```

- [ ] **Step 2: Create the info component**

Create `webapp/views/App/views/Analysis/Chain/FirstPhaseSamplingPointDataJoinInfo.js`:

```jsx
import React from 'react'

import { useI18n } from '@webapp/store/system'

import { FormItem } from '@webapp/components/form/Input'

export const FirstPhaseSamplingPointDataJoinInfo = () => {
  const i18n = useI18n()

  return (
    <FormItem label="chainView.firstPhaseSamplingPointDataJoinMethod.label">
      <div className="first-phase-sampling-point-data-join-info">
        {i18n.t('chainView.firstPhaseSamplingPointDataJoinMethod.description')}
      </div>
    </FormItem>
  )
}
```

- [ ] **Step 3: Wire it into the form**

In `webapp/views/App/views/Analysis/Chain/ChainSamplingDesignProps.js`, current imports:

```js
import { FirstPhaseCategoryExtraPropSelector } from './FirstPhaseCategoryExtraPropSelector'
import { FirstPhaseCategorySelector } from './FirstPhaseCategorySelector'
import { FirstPhaseCommonAttributeSelector } from './FirstPhaseCommonAttributeSelector'
import { SamplingDesignStrategySelector } from './SamplingDesignStrategySelector'
```

change to:

```js
import { FirstPhaseCategoryExtraPropSelector } from './FirstPhaseCategoryExtraPropSelector'
import { FirstPhaseCategorySelector } from './FirstPhaseCategorySelector'
import { FirstPhaseCommonAttributeSelector } from './FirstPhaseCommonAttributeSelector'
import { FirstPhaseSamplingPointDataJoinInfo } from './FirstPhaseSamplingPointDataJoinInfo'
import { SamplingDesignStrategySelector } from './SamplingDesignStrategySelector'
```

Current (inside the component body, right after `const samplingDesign = Chain.getSamplingDesign(chain)`):

```js
  const baseUnitNodeDef = Survey.getBaseUnitNodeDef({ chain })(survey)
  const hasBaseUnit = Boolean(baseUnitNodeDef)
  const samplingDesign = Chain.getSamplingDesign(chain)
  const chainStatisticalAnalysis = Chain.getStatisticalAnalysis(chain)
  const validation = Chain.getValidation(chain)
```

change to:

```js
  const baseUnitNodeDef = Survey.getBaseUnitNodeDef({ chain })(survey)
  const hasBaseUnit = Boolean(baseUnitNodeDef)
  const samplingDesign = Chain.getSamplingDesign(chain)
  const chainStatisticalAnalysis = Chain.getStatisticalAnalysis(chain)
  const validation = Chain.getValidation(chain)
  const isSamplingPointDataJoinMethod = ChainSamplingDesign.isFirstPhaseSamplingPointDataJoinMethod({
    survey,
    baseUnitNodeDef,
  })
```

Current:

```jsx
            {ChainSamplingDesign.isFirstPhaseCommonAttributeSelectionEnabled(samplingDesign) && (
              <FirstPhaseCommonAttributeSelector />
            )}
```

change to:

```jsx
            {ChainSamplingDesign.isFirstPhaseCategorySelectionEnabled(samplingDesign) &&
              (isSamplingPointDataJoinMethod ? (
                <FirstPhaseSamplingPointDataJoinInfo />
              ) : (
                <FirstPhaseCommonAttributeSelector />
              ))}
```

- [ ] **Step 4: Manual smoke check**

Run: `yarn watch` (or confirm it's already running — `curl -s -o /dev/null -w "%{http_code}" http://localhost:9000/`).
Open a chain's sampling design in the browser with `twoPhase` strategy selected and a base unit whose key attribute uses an ordinary (non-`sampling_point_data`) category — confirm the "Common attribute" dropdown still appears exactly as before this change (this task's UI change should be a no-op for that case). Full end-to-end verification of the sampling-point-data case happens in Task 5, once Task 4's validation display is also in place.

- [ ] **Step 5: Commit**

```bash
git add webapp/views/App/views/Analysis/Chain/FirstPhaseSamplingPointDataJoinInfo.js webapp/views/App/views/Analysis/Chain/ChainSamplingDesignProps.js core/i18n/resources/en/common.js core/i18n/resources/es/common.js core/i18n/resources/fr/common.js core/i18n/resources/mn/common.js core/i18n/resources/pt/common.js core/i18n/resources/ru/common.js
git commit -m "$(cat <<'EOF'
Show sampling-point-data join explanation instead of Common attribute selector when applicable

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: Validation display on the Common attribute selector

**Files:**
- Modify: `webapp/views/App/views/Analysis/Chain/BaseUnitAttributeSelector.js`
- Modify: `webapp/views/App/views/Analysis/Chain/FirstPhaseCommonAttributeSelector.js`

**Interfaces:**
- Consumes: `ChainSamplingDesign.keysProps.firstPhaseCommonAttributeUuid` (already exists; Task 1 doesn't change it) as the field-validation lookup key, matching the validator registered in Task 1 (whose path's last segment is exactly this key).
- Produces: `BaseUnitAttributeSelector` gains an optional `validation` prop (default `undefined`, fully backward compatible). Its only other caller, `StratumAttributeSelector.js`, is not touched and does not pass this prop, so its behavior is unchanged.

- [ ] **Step 1: Add optional validation display to the shared selector**

In `webapp/views/App/views/Analysis/Chain/BaseUnitAttributeSelector.js`, current:

```jsx
import React, { useCallback, useMemo } from 'react'
import PropTypes from 'prop-types'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import { useI18n } from '@webapp/store/system'
import { useSurvey } from '@webapp/store/survey'
import { useChain, useChainEditable } from '@webapp/store/ui/chain'

import { Dropdown } from '@webapp/components/form'
import { FormItem } from '@webapp/components/form/Input'
```

change to:

```jsx
import React, { useCallback, useMemo } from 'react'
import PropTypes from 'prop-types'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import { useI18n } from '@webapp/store/system'
import { useSurvey } from '@webapp/store/survey'
import { useChain, useChainEditable } from '@webapp/store/ui/chain'

import { Dropdown } from '@webapp/components/form'
import { FormItem } from '@webapp/components/form/Input'
import ValidationTooltip from '@webapp/components/validationTooltip'
```

Current:

```jsx
export const BaseUnitAttributeSelector = (props) => {
  const {
    allowEmptySelection,
    info,
    label,
    nodeDefFilter,
    nodeDefTypes = [NodeDef.nodeDefType.code],
    onChange: onChangeProp,
    selectedNodeDefUuid,
  } = props
```

change to:

```jsx
export const BaseUnitAttributeSelector = (props) => {
  const {
    allowEmptySelection,
    info,
    label,
    nodeDefFilter,
    nodeDefTypes = [NodeDef.nodeDefType.code],
    onChange: onChangeProp,
    selectedNodeDefUuid,
    validation,
  } = props
```

Current (the returned JSX):

```jsx
  return (
    <FormItem label={label} info={info}>
      <Dropdown selection={selectedItem} items={selectableItems} onChange={onChange} disabled={!editable} />
    </FormItem>
  )
}
```

change to:

```jsx
  const dropdown = <Dropdown selection={selectedItem} items={selectableItems} onChange={onChange} disabled={!editable} />

  return (
    <FormItem label={label} info={info}>
      {validation ? <ValidationTooltip validation={validation}>{dropdown}</ValidationTooltip> : dropdown}
    </FormItem>
  )
}
```

Current (propTypes, end of file):

```jsx
BaseUnitAttributeSelector.propTypes = {
  allowEmptySelection: PropTypes.bool,
  info: PropTypes.string,
  label: PropTypes.string.isRequired,
  nodeDefFilter: PropTypes.func,
  nodeDefTypes: PropTypes.arrayOf(PropTypes.string),
  onChange: PropTypes.func.isRequired,
  selectedNodeDefUuid: PropTypes.string,
}
```

change to:

```jsx
BaseUnitAttributeSelector.propTypes = {
  allowEmptySelection: PropTypes.bool,
  info: PropTypes.string,
  label: PropTypes.string.isRequired,
  nodeDefFilter: PropTypes.func,
  nodeDefTypes: PropTypes.arrayOf(PropTypes.string),
  onChange: PropTypes.func.isRequired,
  selectedNodeDefUuid: PropTypes.string,
  validation: PropTypes.object,
}
```

- [ ] **Step 2: Pass validation from `FirstPhaseCommonAttributeSelector`**

Current:

```jsx
import React from 'react'
import { useDispatch } from 'react-redux'

import * as Chain from '@common/analysis/chain'
import { ChainSamplingDesign } from '@common/analysis/chainSamplingDesign'
import * as NodeDef from '@core/survey/nodeDef'

import { ChainActions, useChain } from '@webapp/store/ui/chain'

import { BaseUnitAttributeSelector } from './BaseUnitAttributeSelector'

export const FirstPhaseCommonAttributeSelector = () => {
  const dispatch = useDispatch()
  const chain = useChain()
  const samplingDesign = Chain.getSamplingDesign(chain)

  const onChange = (attrDefUuid) => {
    const chainUpdated = Chain.updateSamplingDesign(
      ChainSamplingDesign.assocFirstPhaseCommonAttributeUuid(attrDefUuid)
    )(chain)
    dispatch(ChainActions.updateChain({ chain: chainUpdated }))
  }

  return (
    <BaseUnitAttributeSelector
      info="chainView.firstPhaseCommonAttribute.info"
      label="chainView.firstPhaseCommonAttribute.label"
      nodeDefTypes={[NodeDef.nodeDefType.code, NodeDef.nodeDefType.text]}
      selectedNodeDefUuid={ChainSamplingDesign.getFirstPhaseCommonAttributeUuid(samplingDesign)}
      onChange={onChange}
    />
  )
}
```

change to:

```jsx
import React from 'react'
import { useDispatch } from 'react-redux'

import * as Chain from '@common/analysis/chain'
import { ChainSamplingDesign } from '@common/analysis/chainSamplingDesign'
import * as NodeDef from '@core/survey/nodeDef'
import * as Validation from '@core/validation/validation'

import { ChainActions, useChain } from '@webapp/store/ui/chain'

import { BaseUnitAttributeSelector } from './BaseUnitAttributeSelector'

export const FirstPhaseCommonAttributeSelector = () => {
  const dispatch = useDispatch()
  const chain = useChain()
  const samplingDesign = Chain.getSamplingDesign(chain)
  const validation = Chain.getValidation(chain)

  const onChange = (attrDefUuid) => {
    const chainUpdated = Chain.updateSamplingDesign(
      ChainSamplingDesign.assocFirstPhaseCommonAttributeUuid(attrDefUuid)
    )(chain)
    dispatch(ChainActions.updateChain({ chain: chainUpdated }))
  }

  return (
    <BaseUnitAttributeSelector
      info="chainView.firstPhaseCommonAttribute.info"
      label="chainView.firstPhaseCommonAttribute.label"
      nodeDefTypes={[NodeDef.nodeDefType.code, NodeDef.nodeDefType.text]}
      selectedNodeDefUuid={ChainSamplingDesign.getFirstPhaseCommonAttributeUuid(samplingDesign)}
      onChange={onChange}
      validation={Validation.getFieldValidation(ChainSamplingDesign.keysProps.firstPhaseCommonAttributeUuid)(
        validation
      )}
    />
  )
}
```

- [ ] **Step 3: Verify `StratumAttributeSelector` is unaffected**

Read `webapp/views/App/views/Analysis/Chain/StratumAttributeSelector.js` and confirm it does NOT pass a `validation` prop to `BaseUnitAttributeSelector` (it shouldn't need to — this task doesn't add validation for stratum selection) — its rendering must stay exactly as it was before this task (plain `FormItem`, no `ValidationTooltip`), since `BaseUnitAttributeSelector`'s new logic only wraps with `ValidationTooltip` when a `validation` prop is truthy.

- [ ] **Step 4: Commit**

```bash
git add webapp/views/App/views/Analysis/Chain/BaseUnitAttributeSelector.js webapp/views/App/views/Analysis/Chain/FirstPhaseCommonAttributeSelector.js
git commit -m "$(cat <<'EOF'
Show validation error on Common attribute selector when required and missing

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: Manual verification

**Files:** none (verification only).

- [ ] **Step 1: Start the app**

Run: `yarn watch` (or confirm it's already running).

- [ ] **Step 2: Verify the sampling-point-data case**

In a survey that has (or where you can quickly create, via the survey designer) a `sampling_point_data` category and an entity keyed by a code attribute using that category, open a chain, set the sampling design's strategy to two-phase (`twoPhase`), and set that entity as the base unit. Confirm:
- The "Common attribute" dropdown does NOT appear.
- Instead, the new info text ("Join method" label + explanation) appears in its place.
- Save the chain and download its Summary JSON (`downloadSummaryJSON` button/action already in the UI) — confirm it includes `"phase2AsSamplingPointData": true` and does NOT include a `commonAttribute` key.

- [ ] **Step 3: Verify the explicit-join case**

Change the base unit to an entity keyed by an ordinary (non-`sampling_point_data`) code attribute, still under `twoPhase` strategy. Confirm:
- The "Common attribute" dropdown reappears.
- Leaving it unset and attempting to save/trigger validation shows a validation error on that field (the new required-field message).
- Setting a value clears the error.
- Download the Summary JSON again — confirm it now includes `"commonAttribute": "<attribute name>"` (plus `commonAttributeCategory`/`commonAttributeCategoryLevel`, unchanged from today's existing behavior) and `"phase2AsSamplingPointData": false`.

- [ ] **Step 4: Verify other sampling strategies are unaffected**

Switch the sampling strategy away from `twoPhase` (e.g. to `stratifiedRandom`). Confirm neither the "Common attribute" dropdown nor the new info text appears — matching today's existing behavior for non-two-phase strategies.

- [ ] **Step 5: Note results**

No commit for this task (verification only). If any step fails, fix the underlying issue in the relevant earlier task's files and re-commit there before continuing.
