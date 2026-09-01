# 1st Phase Stratum Attribute Selector Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users pick which extra prop of the 1st phase category represents the 1st phase stratum attribute in two-phase sampling chain designs, and clarify that the existing "Stratum attribute" field is the 2nd phase one in that mode.

**Architecture:** Add a new persisted prop (`firstPhaseCategoryExtraProp`, storing an extra-prop *name* string) to the `ChainSamplingDesign` domain module, alongside its existing get/assoc/dissoc/cleanup conventions. Add one new presentational React component that renders a `Dropdown` of the selected 1st phase category's extra prop names, wired the same way sibling selectors (`FirstPhaseCategorySelector`, `FirstPhaseCommonAttributeSelector`) already are. Update one existing component's label logic. Add i18n keys to all 6 locale files.

**Tech Stack:** Node.js, React 18, Redux Toolkit, `@openforis/arena-core`, Ramda-backed `@core/arena` utils, Jest (unit tests via webpack-bundled `test/unit`).

## Global Constraints

- New persisted prop key: `firstPhaseCategoryExtraProp`. Its value is the extra prop's **name** (string), not a uuid — extra props are keyed by name on the category (`Category.getItemExtraDefsArray` / `ExtraPropDef.getName`), they have no stable uuid.
- New field is visible exactly when `ChainSamplingDesign.isFirstPhaseCategorySelectionEnabled(samplingDesign)` is true (two-phase sampling selected), same condition as `<FirstPhaseCategorySelector />`.
- New field label translation key: `chainView.firstPhaseCategoryExtraProp.label` = "1st phase stratum attribute" (en).
- Existing `StratumAttributeSelector` label becomes `chainView.stratumAttribute2ndPhase` = "2nd phase stratum attribute" (en) when `isFirstPhaseCategorySelectionEnabled` is true; otherwise stays `chainView.stratumAttribute` = "Stratum attribute".
- Follow existing code conventions in `common/analysis/chainSamplingDesign.js` (plain functions grouped by keysProps / READ / UPDATE, exported via a single object) and in the sibling selector components under `webapp/views/App/views/Analysis/Chain/`.
- JSDoc is not used in this module/these components today (no existing JSDoc on any function in `chainSamplingDesign.js` or the selector components) — do not add it, match existing style.

---

## File Structure

- **Modify:** `common/analysis/chainSamplingDesign.js` — add `firstPhaseCategoryExtraProp` key, getter, assoc, dissoc, and cleanup/dissoc-on-category-change wiring.
- **Create:** `test/unit/tests/042chainSamplingDesign.test.js` — unit tests for the new getter/assoc/dissoc/cleanup behavior.
- **Create:** `webapp/views/App/views/Analysis/Chain/FirstPhaseCategoryExtraPropSelector.js` — new dropdown selector component.
- **Modify:** `webapp/views/App/views/Analysis/Chain/ChainSamplingDesignProps.js` — render the new selector next to `FirstPhaseCategorySelector`.
- **Modify:** `webapp/views/App/views/Analysis/Chain/StratumAttributeSelector.js` — conditional label.
- **Modify:** `core/i18n/resources/en/common.js`, `es/common.js`, `ru/common.js`, `pt/common.js`, `mn/common.js`, `fr/common.js` — add the two new translation keys.

---

### Task 1: Domain model — `firstPhaseCategoryExtraProp` prop

**Files:**
- Modify: `common/analysis/chainSamplingDesign.js:5-16` (keysProps), `:32-39` (getters), `:57-60` (enabled checks), `:64-68` (dissocs), `:84-89` (cleanup), `:100-101` (assocFirstPhaseCategoryUuid), `:103-104` (assoc block), `:130-162` (exports)
- Test: `test/unit/tests/042chainSamplingDesign.test.js`

**Interfaces:**
- Produces: `ChainSamplingDesign.getFirstPhaseCategoryExtraProp(samplingDesign) -> string|undefined`, `ChainSamplingDesign.assocFirstPhaseCategoryExtraProp(name) -> (samplingDesign) -> samplingDesign`, `ChainSamplingDesign.isFirstPhaseCategoryExtraPropSelectionEnabled(samplingDesign) -> boolean` (alias of `isFirstPhaseCategorySelectionEnabled`, matching the existing `isFirstPhaseCommonAttributeSelectionEnabled` pattern). These are consumed by Task 3's new component and Task 4's wiring.

- [ ] **Step 1: Write the failing unit tests**

Create `test/unit/tests/042chainSamplingDesign.test.js`:

```javascript
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

- [ ] **Step 2: Run tests to verify they fail**

Run: `yarn build:test:unit && npx jest dist/__tests__/bundle.unit.js -t "firstPhaseCategoryExtraProp"`
Expected: FAIL — `ChainSamplingDesign.getFirstPhaseCategoryExtraProp is not a function` (and similarly for the other new members).

- [ ] **Step 3: Implement the domain model changes**

In `common/analysis/chainSamplingDesign.js`:

Add to `keysProps` (right before `firstPhaseCategoryUuid`):

```javascript
  firstPhaseCategoryExtraProp: 'firstPhaseCategoryExtraProp',
```

Add getter (after `getFirstPhaseCategoryUuid`):

```javascript
const getFirstPhaseCategoryExtraProp = A.prop(keysProps.firstPhaseCategoryExtraProp)
```

Add enabled-check alias (after `isFirstPhaseCommonAttributeSelectionEnabled`):

```javascript
const isFirstPhaseCategoryExtraPropSelectionEnabled = isFirstPhaseCategorySelectionEnabled
```

Add dissoc (after `dissocFirstPhaseCategoryUuid`):

```javascript
const dissocFirstPhaseCategoryExtraProp = A.dissoc(keysProps.firstPhaseCategoryExtraProp)
```

Update `cleanupSamplingDesign` — add after the existing `isFirstPhaseCommonAttributeSelectionEnabled` block:

```javascript
  if (!isFirstPhaseCategoryExtraPropSelectionEnabled(samplingDesignUpdated)) {
    samplingDesignUpdated = dissocFirstPhaseCategoryExtraProp(samplingDesignUpdated)
  }
```

Update `assocFirstPhaseCategoryUuid` to also dissoc the extra prop when the category changes:

```javascript
const assocFirstPhaseCategoryUuid = (firstPhaseCategoryUuid) =>
  A.pipe(
    dissocFirstPhaseCommonAttributeUuid,
    dissocFirstPhaseCategoryExtraProp,
    A.assoc(keysProps.firstPhaseCategoryUuid, firstPhaseCategoryUuid)
  )
```

Add assoc (after `assocFirstPhaseCommonAttributeUuid`):

```javascript
const assocFirstPhaseCategoryExtraProp = (firstPhaseCategoryExtraProp) =>
  A.assoc(keysProps.firstPhaseCategoryExtraProp, firstPhaseCategoryExtraProp)
```

Add to the exported object — `getFirstPhaseCategoryExtraProp` and `isFirstPhaseCategoryExtraPropSelectionEnabled` under `// READ`, `assocFirstPhaseCategoryExtraProp` under `// UPDATE`:

```javascript
  // READ
  getBaseUnitNodeDefUuid,
  isAreaWeightingMethod,
  getClusteringNodeDefUuid,
  getFirstPhaseCategoryExtraProp,
  getFirstPhaseCategoryUuid,
  getFirstPhaseCommonAttributeUuid,
  isPostStratificationEnabled,
  getReportingDataAttributeDefUuid,
  getReportingDataCategoryUuid,
  isFirstPhaseCategoryExtraPropSelectionEnabled,
  isFirstPhaseCategorySelectionEnabled,
  isFirstPhaseCommonAttributeSelectionEnabled,
  isStratificationEnabled,
  isStratificationNotSpecifiedAllowed,
  getPostStratificationAttributeDefUuid,
  getSamplingStrategy,
  getStratumNodeDefUuid,

  // UPDATE
  assocAreaWeightingMethod,
  assocBaseUnitNodeDefUuid,
  assocClusteringNodeDefUuid,
  assocFirstPhaseCategoryExtraProp,
  assocFirstPhaseCategoryUuid,
  assocFirstPhaseCommonAttributeUuid,
  assocPostStratificationAttributeDefUuid,
  assocReportingDataCategoryUuid,
  assocReportingDataAttributeDefUuid,
  assocSamplingStrategy,
  assocStratumNodeDefUuid,
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `yarn build:test:unit && npx jest dist/__tests__/bundle.unit.js -t "firstPhaseCategoryExtraProp"`
Expected: PASS (all 5 new tests green).

- [ ] **Step 5: Commit**

```bash
git add common/analysis/chainSamplingDesign.js test/unit/tests/042chainSamplingDesign.test.js
git commit -m "Add firstPhaseCategoryExtraProp prop to ChainSamplingDesign"
```

---

### Task 2: English translation keys

**Files:**
- Modify: `core/i18n/resources/en/common.js:744,791` (`chainView` section)

**Interfaces:**
- Consumes: nothing.
- Produces: i18n keys `chainView.firstPhaseCategoryExtraProp.label` and `chainView.stratumAttribute2ndPhase`, consumed by Task 3 and Task 4.

- [ ] **Step 1: Add the new keys**

In `core/i18n/resources/en/common.js`, change line 744 (`firstPhaseCategory: '1st phase category',`) to add the new nested key right after it:

```javascript
    firstPhaseCategory: '1st phase category',
    firstPhaseCategoryExtraProp: {
      label: '1st phase stratum attribute',
    },
```

And change line 791 (`stratumAttribute: 'Stratum attribute',`) to add the new key right after it:

```javascript
    stratumAttribute: 'Stratum attribute',
    stratumAttribute2ndPhase: '2nd phase stratum attribute',
```

- [ ] **Step 2: Verify the file is still valid JS**

Run: `node -e "require('./core/i18n/resources/en/common.js')"`
Expected: no output (no syntax errors). Note this file uses `export default`, so a parse smoke check is: `npx eslint core/i18n/resources/en/common.js`
Expected: no parsing errors (pre-existing lint warnings unrelated to this change are fine).

- [ ] **Step 3: Commit**

```bash
git add core/i18n/resources/en/common.js
git commit -m "Add en translations for 1st/2nd phase stratum attribute labels"
```

---

### Task 3: `FirstPhaseCategoryExtraPropSelector` component

**Files:**
- Create: `webapp/views/App/views/Analysis/Chain/FirstPhaseCategoryExtraPropSelector.js`

**Interfaces:**
- Consumes: `Chain.getSamplingDesign(chain)`, `ChainSamplingDesign.getFirstPhaseCategoryUuid`, `ChainSamplingDesign.getFirstPhaseCategoryExtraProp`, `ChainSamplingDesign.assocFirstPhaseCategoryExtraProp` (Task 1); `Category.getItemExtraDefsArray(category) -> Array<{name, dataType, index, uuid}>`, `ExtraPropDef.getName(extraDef) -> string` (existing, already used identically in `FirstPhaseCommonAttributeSelector.js`); `Dropdown` from `@webapp/components/form`; `FormItem` from `@webapp/components/form/Input`; `useChain`, `useChainEditable`, `ChainActions` from `@webapp/store/ui/chain`; `SurveyState` from `@webapp/store/survey`; i18n key `chainView.firstPhaseCategoryExtraProp.label` (Task 2).
- Produces: named export `FirstPhaseCategoryExtraPropSelector` (React component, no props), consumed by Task 4.

- [ ] **Step 1: Create the component**

Create `webapp/views/App/views/Analysis/Chain/FirstPhaseCategoryExtraPropSelector.js`:

```javascript
import React, { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { Objects } from '@openforis/arena-core'

import * as Survey from '@core/survey/survey'
import * as Category from '@core/survey/category'
import { ExtraPropDef } from '@core/survey/extraPropDef'

import * as Chain from '@common/analysis/chain'
import { ChainSamplingDesign } from '@common/analysis/chainSamplingDesign'

import { Dropdown } from '@webapp/components/form'
import { FormItem } from '@webapp/components/form/Input'
import { SurveyState } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'
import { ChainActions, useChain, useChainEditable } from '@webapp/store/ui/chain'

const extraPropNameToItem = (name) => ({ value: name, label: name })

export const FirstPhaseCategoryExtraPropSelector = () => {
  const dispatch = useDispatch()
  const i18n = useI18n()
  const chain = useChain()
  const editable = useChainEditable()
  const samplingDesign = Chain.getSamplingDesign(chain)
  const firstPhaseCategoryUuid = ChainSamplingDesign.getFirstPhaseCategoryUuid(samplingDesign)

  const extraPropNames = useSelector((state) => {
    const survey = SurveyState.getSurvey(state)
    const firstPhaseCategory = Survey.getCategoryByUuid(firstPhaseCategoryUuid)(survey)
    if (!firstPhaseCategory) return []
    return Category.getItemExtraDefsArray(firstPhaseCategory).map(ExtraPropDef.getName)
  }, Objects.isEqual)

  const emptyItem = { value: null, label: i18n.t('common.notSpecified') }
  const items = [emptyItem, ...extraPropNames.map(extraPropNameToItem)]

  const selectedName = ChainSamplingDesign.getFirstPhaseCategoryExtraProp(samplingDesign)
  const selectedItem = selectedName ? extraPropNameToItem(selectedName) : emptyItem

  const onChange = useCallback(
    (item) => {
      const chainUpdated = Chain.updateSamplingDesign(
        ChainSamplingDesign.assocFirstPhaseCategoryExtraProp(item?.value)
      )(chain)
      dispatch(ChainActions.updateChain({ chain: chainUpdated }))
    },
    [chain, dispatch]
  )

  return (
    <FormItem label="chainView.firstPhaseCategoryExtraProp.label">
      <Dropdown items={items} selection={selectedItem} onChange={onChange} disabled={!editable} />
    </FormItem>
  )
}
```

This mirrors `FirstPhaseCommonAttributeSelector.js` for how it reads the category's extra defs (same `Objects.isEqual`-compared selector to avoid extra re-renders), but lists the extra prop names themselves as selectable items instead of filtering survey node defs by name.

- [ ] **Step 2: Lint the new file**

Run: `npx eslint --cache --fix webapp/views/App/views/Analysis/Chain/FirstPhaseCategoryExtraPropSelector.js`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add webapp/views/App/views/Analysis/Chain/FirstPhaseCategoryExtraPropSelector.js
git commit -m "Add FirstPhaseCategoryExtraPropSelector component"
```

---

### Task 4: Wire the new selector into the sampling design form + update stratum label

**Files:**
- Modify: `webapp/views/App/views/Analysis/Chain/ChainSamplingDesignProps.js:19,70`
- Modify: `webapp/views/App/views/Analysis/Chain/StratumAttributeSelector.js`

**Interfaces:**
- Consumes: `FirstPhaseCategoryExtraPropSelector` (Task 3); `ChainSamplingDesign.isFirstPhaseCategorySelectionEnabled` (existing, Task 1 untouched).
- Produces: rendered UI, no new interfaces for later tasks.

- [ ] **Step 1: Import and render the new selector in `ChainSamplingDesignProps.js`**

Add the import (`webapp/views/App/views/Analysis/Chain/ChainSamplingDesignProps.js:19`, alongside the other selector imports):

```javascript
import { FirstPhaseCategoryExtraPropSelector } from './FirstPhaseCategoryExtraPropSelector'
```

Change line 70 from:

```javascript
            {ChainSamplingDesign.isFirstPhaseCategorySelectionEnabled(samplingDesign) && <FirstPhaseCategorySelector />}
```

to:

```javascript
            {ChainSamplingDesign.isFirstPhaseCategorySelectionEnabled(samplingDesign) && (
              <>
                <FirstPhaseCategorySelector />
                <FirstPhaseCategoryExtraPropSelector />
              </>
            )}
```

- [ ] **Step 2: Update `StratumAttributeSelector.js` label**

Current file:

```javascript
import React, { useCallback } from 'react'
import { useDispatch } from 'react-redux'

import * as Chain from '@common/analysis/chain'
import { ChainSamplingDesign } from '@common/analysis/chainSamplingDesign'

import { ChainActions, useChain } from '@webapp/store/ui/chain'

import { BaseUnitCodeAttributeSelector } from './BaseUnitCodeAttributeSelector'

export const StratumAttributeSelector = () => {
  const dispatch = useDispatch()
  const chain = useChain()
  const samplingDesign = Chain.getSamplingDesign(chain)

  const onChange = useCallback(
    (stratumDefUuid) => {
      const chainUpdated = Chain.updateSamplingDesign(ChainSamplingDesign.assocStratumNodeDefUuid(stratumDefUuid))(
        chain
      )
      dispatch(ChainActions.updateChain({ chain: chainUpdated }))
    },
    [chain, dispatch]
  )

  return (
    <BaseUnitCodeAttributeSelector
      allowEmptySelection={ChainSamplingDesign.isStratificationNotSpecifiedAllowed(samplingDesign)}
      label="chainView.stratumAttribute"
      selectedNodeDefUuid={ChainSamplingDesign.getStratumNodeDefUuid(samplingDesign)}
      onChange={onChange}
    />
  )
}
```

Replace the `label="chainView.stratumAttribute"` line with a computed label, and the whole file becomes:

```javascript
import React, { useCallback } from 'react'
import { useDispatch } from 'react-redux'

import * as Chain from '@common/analysis/chain'
import { ChainSamplingDesign } from '@common/analysis/chainSamplingDesign'

import { ChainActions, useChain } from '@webapp/store/ui/chain'

import { BaseUnitCodeAttributeSelector } from './BaseUnitCodeAttributeSelector'

export const StratumAttributeSelector = () => {
  const dispatch = useDispatch()
  const chain = useChain()
  const samplingDesign = Chain.getSamplingDesign(chain)

  const onChange = useCallback(
    (stratumDefUuid) => {
      const chainUpdated = Chain.updateSamplingDesign(ChainSamplingDesign.assocStratumNodeDefUuid(stratumDefUuid))(
        chain
      )
      dispatch(ChainActions.updateChain({ chain: chainUpdated }))
    },
    [chain, dispatch]
  )

  const label = ChainSamplingDesign.isFirstPhaseCategorySelectionEnabled(samplingDesign)
    ? 'chainView.stratumAttribute2ndPhase'
    : 'chainView.stratumAttribute'

  return (
    <BaseUnitCodeAttributeSelector
      allowEmptySelection={ChainSamplingDesign.isStratificationNotSpecifiedAllowed(samplingDesign)}
      label={label}
      selectedNodeDefUuid={ChainSamplingDesign.getStratumNodeDefUuid(samplingDesign)}
      onChange={onChange}
    />
  )
}
```

- [ ] **Step 3: Lint both files**

Run: `npx eslint --cache --fix webapp/views/App/views/Analysis/Chain/ChainSamplingDesignProps.js webapp/views/App/views/Analysis/Chain/StratumAttributeSelector.js`
Expected: no errors.

- [ ] **Step 4: Manual verification in the running app**

Run: `yarn watch` (or if already running, just reload). Open a survey's Analysis > processing chain > Sampling Design tab.
- Select "Two-Phase Sampling" as the sampling strategy.
- Confirm the "1st phase category" selector appears, and immediately below it a new "1st phase stratum attribute" dropdown appears.
- Pick a 1st phase category that has extra props defined (Designer > Categories > pick a category > Extra properties) and confirm its extra prop names appear as options in the new dropdown; selecting one and reloading the chain should persist the selection.
- Confirm the field below (previously "Stratum attribute") now reads "2nd phase stratum attribute".
- Switch sampling strategy to e.g. "Stratified Random Sampling" and confirm: the 1st phase category selector and the new extra-prop dropdown disappear, and the remaining stratum field reverts to reading "Stratum attribute".
- Change the 1st phase category to a different one and confirm the extra-prop dropdown resets to "not specified".

- [ ] **Step 5: Commit**

```bash
git add webapp/views/App/views/Analysis/Chain/ChainSamplingDesignProps.js webapp/views/App/views/Analysis/Chain/StratumAttributeSelector.js
git commit -m "Show 1st phase stratum attribute selector and relabel 2nd phase stratum attribute"
```

---

### Task 5: Translations for es, ru, pt, mn, fr

**Files:**
- Modify: `core/i18n/resources/es/common.js:611,658`
- Modify: `core/i18n/resources/ru/common.js:718,765`
- Modify: `core/i18n/resources/pt/common.js:739,786`
- Modify: `core/i18n/resources/mn/common.js:719,766`
- Modify: `core/i18n/resources/fr/common.js:742,789`

**Interfaces:**
- Consumes: key names from Task 2 (`chainView.firstPhaseCategoryExtraProp.label`, `chainView.stratumAttribute2ndPhase`).
- Produces: nothing further.

- [ ] **Step 1: es** — in `core/i18n/resources/es/common.js`, after `firstPhaseCategory: 'Categoría de primera fase',` (line 611) add:

```javascript
    firstPhaseCategoryExtraProp: {
      label: '1ª fase - atributo de estrato',
    },
```

and after `stratumAttribute: 'Atributo de estrato',` (line 658) add:

```javascript
    stratumAttribute2ndPhase: 'Atributo de estrato de 2ª fase',
```

- [ ] **Step 2: ru** — in `core/i18n/resources/ru/common.js`, after `firstPhaseCategory: 'Категория 1-й фазы',` (line 718) add:

```javascript
    firstPhaseCategoryExtraProp: {
      label: 'Атрибут страты 1-й фазы',
    },
```

and after `stratumAttribute: 'Атрибут страты',` (line 765) add:

```javascript
    stratumAttribute2ndPhase: 'Атрибут страты 2-й фазы',
```

- [ ] **Step 3: pt** — in `core/i18n/resources/pt/common.js`, after `firstPhaseCategory: 'Categoria da 1ª fase',` (line 739) add:

```javascript
    firstPhaseCategoryExtraProp: {
      label: 'Atributo de estrato da 1ª fase',
    },
```

and after `stratumAttribute: 'Atributo de estrato',` (line 786) add:

```javascript
    stratumAttribute2ndPhase: 'Atributo de estrato da 2ª fase',
```

- [ ] **Step 4: mn** — in `core/i18n/resources/mn/common.js`, after `firstPhaseCategory: '1-р үе шатны ангилал',` (line 719) add:

```javascript
    firstPhaseCategoryExtraProp: {
      label: '1-р үе шатны давхаргын шинж чанар',
    },
```

and after `stratumAttribute: 'Үеийн шинж чанар',` (line 766) add:

```javascript
    stratumAttribute2ndPhase: '2-р үе шатны давхаргын шинж чанар',
```

- [ ] **Step 5: fr** — in `core/i18n/resources/fr/common.js`, after `firstPhaseCategory: 'Catégorie de 1ère phase',` (line 742) add:

```javascript
    firstPhaseCategoryExtraProp: {
      label: 'Attribut de strate de 1ère phase',
    },
```

and after `stratumAttribute: 'Attribut de strate',` (line 789) add:

```javascript
    stratumAttribute2ndPhase: 'Attribut de strate de 2ème phase',
```

- [ ] **Step 6: Lint all 5 files**

Run: `npx eslint --cache --fix core/i18n/resources/es/common.js core/i18n/resources/ru/common.js core/i18n/resources/pt/common.js core/i18n/resources/mn/common.js core/i18n/resources/fr/common.js`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add core/i18n/resources/es/common.js core/i18n/resources/ru/common.js core/i18n/resources/pt/common.js core/i18n/resources/mn/common.js core/i18n/resources/fr/common.js
git commit -m "Add es/ru/pt/mn/fr translations for 1st/2nd phase stratum attribute labels"
```
