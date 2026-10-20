# Chain Sampling Design Editor: Phase 2 Join Props Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the Chain > Sampling design > Two-Phase Sampling UI to add an explicit
phase-2 join entity and a Sampling Point Data linkage shortcut, rename/narrow the two join
attribute selectors, change the Stratum attribute selector's two-phase behavior, and migrate
existing chains at app startup.

**Architecture:** A renamed/extended `common/analysis/chainSamplingDesign.js` domain model
drives new and updated React selector components under
`webapp/views/App/views/Analysis/Chain/`, a renamed/extended R-facing summary in
`server/modules/analysis/service/chainSummaryGenerator.js`, an updated clone-from-survey
remap in `server/modules/analysis/manager/chain/index.js`, and a one-time per-survey data
migration wired into the existing `surveyDataMigrationSteps.js` startup pipeline.

**Tech Stack:** React 18, Redux Toolkit, Node.js/Express, pg-promise, Jest.

## Global Constraints

- No backward-compat aliases for the renamed domain-model props — old chains are migrated
  in place at startup (see Task 11); do not add dual-read fallbacks anywhere in application
  code.
- `phase1JoinAttribute` / `phase2JoinAttribute` are the exact key names used in the
  R-facing summary JSON (`chainSummaryGenerator.js`) — spelled correctly (not the
  `JoinAttibute` typo from the original mockup).
- Follow existing code style exactly: no JSDoc on webapp React components (none of the
  sibling selector files have it), JSDoc on new server-side repository/manager functions
  that sit next to already-documented functions (matches `surveyDataMigrationSteps.js` and
  `repository/chain/read.js` / `update.js` conventions).
- Full spec: `docs/superpowers/specs/2026-09-10-chain-sampling-design-props-design.md`.

---

## Task 1: Domain model — rename and extend `ChainSamplingDesign`

**Files:**
- Modify: `common/analysis/chainSamplingDesign.js` (full rewrite)
- Test: `test/unit/tests/042chainSamplingDesign.test.js` (full rewrite)

**Interfaces:**
- Produces (used by every later task): `ChainSamplingDesign.keysProps.{phase1CategoryUuid, phase1JoinAttribute, phase2JoinEntityUuid, phase2AsSamplingPointData, phase2JoinAttribute}`;
  `getPhase1CategoryUuid`, `assocPhase1CategoryUuid`, `getPhase1JoinAttribute`,
  `assocPhase1JoinAttribute`, `getPhase2JoinEntityUuid`, `assocPhase2JoinEntityUuid`,
  `isPhase2AsSamplingPointData`, `assocPhase2AsSamplingPointData`, `getPhase2JoinAttribute`,
  `assocPhase2JoinAttribute`, `isPhase1CategorySelectionEnabled`,
  `isPhase2JoinEntitySelectionEnabled`, `isPhase2AsSamplingPointDataSelectionEnabled`,
  `isPhase1JoinAttributeSelectionEnabled`, `isPhase2JoinAttributeSelectionEnabled` (all
  `(samplingDesign) => boolean`, all imported as `import { ChainSamplingDesign } from '@common/analysis/chainSamplingDesign'`).

- [ ] **Step 1: Replace the unit test file with the expanded suite**

Write the full new content to `test/unit/tests/042chainSamplingDesign.test.js`:

```js
import { ChainSamplingDesign } from '@common/analysis/chainSamplingDesign'

const { samplingStrategies } = ChainSamplingDesign

describe('ChainSamplingDesign.phase1CategoryUuid', () => {
  it('can be set and read back', () => {
    const samplingDesign = ChainSamplingDesign.assocPhase1CategoryUuid('cat-1')({})
    expect(ChainSamplingDesign.getPhase1CategoryUuid(samplingDesign)).toBe('cat-1')
  })

  it('is cleared when sampling strategy changes away from two-phase', () => {
    let samplingDesign = { samplingStrategy: samplingStrategies.twoPhase }
    samplingDesign = ChainSamplingDesign.assocPhase1CategoryUuid('cat-1')(samplingDesign)
    samplingDesign = ChainSamplingDesign.assocSamplingStrategy(samplingStrategies.stratifiedRandom)(samplingDesign)
    expect(ChainSamplingDesign.getPhase1CategoryUuid(samplingDesign)).toBeUndefined()
  })
})

describe('ChainSamplingDesign.phase1JoinAttribute', () => {
  it('is undefined by default', () => {
    expect(ChainSamplingDesign.getPhase1JoinAttribute({})).toBeUndefined()
  })

  it('can be set and read back', () => {
    const samplingDesign = ChainSamplingDesign.assocPhase1JoinAttribute('design_psu')({})
    expect(ChainSamplingDesign.getPhase1JoinAttribute(samplingDesign)).toBe('design_psu')
  })

  it('is enabled only when two-phase sampling is selected and sampling point data linkage is off', () => {
    const twoPhase = { samplingStrategy: samplingStrategies.twoPhase }
    const twoPhaseWithLinkage = { samplingStrategy: samplingStrategies.twoPhase, phase2AsSamplingPointData: true }
    const stratifiedRandom = { samplingStrategy: samplingStrategies.stratifiedRandom }
    expect(ChainSamplingDesign.isPhase1JoinAttributeSelectionEnabled(twoPhase)).toBe(true)
    expect(ChainSamplingDesign.isPhase1JoinAttributeSelectionEnabled(twoPhaseWithLinkage)).toBe(false)
    expect(ChainSamplingDesign.isPhase1JoinAttributeSelectionEnabled(stratifiedRandom)).toBe(false)
  })

  it('is cleared when sampling strategy changes away from two-phase', () => {
    let samplingDesign = { samplingStrategy: samplingStrategies.twoPhase }
    samplingDesign = ChainSamplingDesign.assocPhase1JoinAttribute('design_psu')(samplingDesign)
    samplingDesign = ChainSamplingDesign.assocSamplingStrategy(samplingStrategies.stratifiedRandom)(samplingDesign)
    expect(ChainSamplingDesign.getPhase1JoinAttribute(samplingDesign)).toBeUndefined()
  })

  it('is cleared when the 1st phase category changes', () => {
    let samplingDesign = { samplingStrategy: samplingStrategies.twoPhase, phase1CategoryUuid: 'cat-1' }
    samplingDesign = ChainSamplingDesign.assocPhase1JoinAttribute('design_psu')(samplingDesign)
    samplingDesign = ChainSamplingDesign.assocPhase1CategoryUuid('cat-2')(samplingDesign)
    expect(ChainSamplingDesign.getPhase1JoinAttribute(samplingDesign)).toBeUndefined()
    expect(ChainSamplingDesign.getPhase1CategoryUuid(samplingDesign)).toBe('cat-2')
  })

  it('is cleared when sampling point data linkage is turned on', () => {
    let samplingDesign = { samplingStrategy: samplingStrategies.twoPhase }
    samplingDesign = ChainSamplingDesign.assocPhase1JoinAttribute('design_psu')(samplingDesign)
    samplingDesign = ChainSamplingDesign.assocPhase2AsSamplingPointData(true)(samplingDesign)
    expect(ChainSamplingDesign.getPhase1JoinAttribute(samplingDesign)).toBeUndefined()
  })
})

describe('ChainSamplingDesign.phase2JoinEntityUuid', () => {
  it('is undefined by default', () => {
    expect(ChainSamplingDesign.getPhase2JoinEntityUuid({})).toBeUndefined()
  })

  it('can be set and read back', () => {
    const samplingDesign = ChainSamplingDesign.assocPhase2JoinEntityUuid('entity-1')({})
    expect(ChainSamplingDesign.getPhase2JoinEntityUuid(samplingDesign)).toBe('entity-1')
  })

  it('is enabled only when two-phase sampling is selected', () => {
    const twoPhase = { samplingStrategy: samplingStrategies.twoPhase }
    const stratifiedRandom = { samplingStrategy: samplingStrategies.stratifiedRandom }
    expect(ChainSamplingDesign.isPhase2JoinEntitySelectionEnabled(twoPhase)).toBe(true)
    expect(ChainSamplingDesign.isPhase2JoinEntitySelectionEnabled(stratifiedRandom)).toBe(false)
  })

  it('stays set when sampling point data linkage is turned on (only the join attributes are hidden, not the entity)', () => {
    let samplingDesign = { samplingStrategy: samplingStrategies.twoPhase }
    samplingDesign = ChainSamplingDesign.assocPhase2JoinEntityUuid('entity-1')(samplingDesign)
    samplingDesign = ChainSamplingDesign.assocPhase2AsSamplingPointData(true)(samplingDesign)
    expect(ChainSamplingDesign.getPhase2JoinEntityUuid(samplingDesign)).toBe('entity-1')
  })

  it('is cleared when sampling strategy changes away from two-phase', () => {
    let samplingDesign = { samplingStrategy: samplingStrategies.twoPhase }
    samplingDesign = ChainSamplingDesign.assocPhase2JoinEntityUuid('entity-1')(samplingDesign)
    samplingDesign = ChainSamplingDesign.assocSamplingStrategy(samplingStrategies.stratifiedRandom)(samplingDesign)
    expect(ChainSamplingDesign.getPhase2JoinEntityUuid(samplingDesign)).toBeUndefined()
  })
})

describe('ChainSamplingDesign.phase2AsSamplingPointData', () => {
  it('is false by default', () => {
    expect(ChainSamplingDesign.isPhase2AsSamplingPointData({})).toBe(false)
  })

  it('can be set and read back', () => {
    // starts from a two-phase design: assocPhase2AsSamplingPointData runs cleanupSamplingDesign,
    // which would immediately strip the flag again on a design where two-phase isn't selected
    const samplingDesign = ChainSamplingDesign.assocPhase2AsSamplingPointData(true)({
      samplingStrategy: samplingStrategies.twoPhase,
    })
    expect(ChainSamplingDesign.isPhase2AsSamplingPointData(samplingDesign)).toBe(true)
  })

  it('is enabled only when two-phase sampling is selected', () => {
    const twoPhase = { samplingStrategy: samplingStrategies.twoPhase }
    const stratifiedRandom = { samplingStrategy: samplingStrategies.stratifiedRandom }
    expect(ChainSamplingDesign.isPhase2AsSamplingPointDataSelectionEnabled(twoPhase)).toBe(true)
    expect(ChainSamplingDesign.isPhase2AsSamplingPointDataSelectionEnabled(stratifiedRandom)).toBe(false)
  })

  it('is cleared (reset to false) when sampling strategy changes away from two-phase', () => {
    let samplingDesign = { samplingStrategy: samplingStrategies.twoPhase }
    samplingDesign = ChainSamplingDesign.assocPhase2AsSamplingPointData(true)(samplingDesign)
    samplingDesign = ChainSamplingDesign.assocSamplingStrategy(samplingStrategies.stratifiedRandom)(samplingDesign)
    expect(ChainSamplingDesign.isPhase2AsSamplingPointData(samplingDesign)).toBe(false)
  })
})

describe('ChainSamplingDesign.phase2JoinAttribute', () => {
  it('is undefined by default', () => {
    expect(ChainSamplingDesign.getPhase2JoinAttribute({})).toBeUndefined()
  })

  it('can be set and read back', () => {
    const samplingDesign = ChainSamplingDesign.assocPhase2JoinAttribute('attr-uuid')({})
    expect(ChainSamplingDesign.getPhase2JoinAttribute(samplingDesign)).toBe('attr-uuid')
  })

  it('is enabled only when two-phase sampling is selected and sampling point data linkage is off', () => {
    const twoPhase = { samplingStrategy: samplingStrategies.twoPhase }
    const twoPhaseWithLinkage = { samplingStrategy: samplingStrategies.twoPhase, phase2AsSamplingPointData: true }
    expect(ChainSamplingDesign.isPhase2JoinAttributeSelectionEnabled(twoPhase)).toBe(true)
    expect(ChainSamplingDesign.isPhase2JoinAttributeSelectionEnabled(twoPhaseWithLinkage)).toBe(false)
  })

  it('is cleared when the phase 2 join entity changes', () => {
    let samplingDesign = { samplingStrategy: samplingStrategies.twoPhase, phase2JoinEntityUuid: 'entity-1' }
    samplingDesign = ChainSamplingDesign.assocPhase2JoinAttribute('attr-uuid')(samplingDesign)
    samplingDesign = ChainSamplingDesign.assocPhase2JoinEntityUuid('entity-2')(samplingDesign)
    expect(ChainSamplingDesign.getPhase2JoinAttribute(samplingDesign)).toBeUndefined()
    expect(ChainSamplingDesign.getPhase2JoinEntityUuid(samplingDesign)).toBe('entity-2')
  })

  it('is cleared when sampling point data linkage is turned on', () => {
    let samplingDesign = { samplingStrategy: samplingStrategies.twoPhase }
    samplingDesign = ChainSamplingDesign.assocPhase2JoinAttribute('attr-uuid')(samplingDesign)
    samplingDesign = ChainSamplingDesign.assocPhase2AsSamplingPointData(true)(samplingDesign)
    expect(ChainSamplingDesign.getPhase2JoinAttribute(samplingDesign)).toBeUndefined()
  })

  it('is cleared when sampling strategy changes away from two-phase', () => {
    let samplingDesign = { samplingStrategy: samplingStrategies.twoPhase }
    samplingDesign = ChainSamplingDesign.assocPhase2JoinAttribute('attr-uuid')(samplingDesign)
    samplingDesign = ChainSamplingDesign.assocSamplingStrategy(samplingStrategies.stratifiedRandom)(samplingDesign)
    expect(ChainSamplingDesign.getPhase2JoinAttribute(samplingDesign)).toBeUndefined()
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `yarn build:test:unit && jest dist/__tests__/bundle.unit.js -t "ChainSamplingDesign"`
Expected: FAIL — `ChainSamplingDesign.assocPhase1CategoryUuid is not a function` (and similar
for every other new/renamed name), since the domain model hasn't been rewritten yet.

- [ ] **Step 3: Rewrite the domain model**

Write the full new content to `common/analysis/chainSamplingDesign.js`:

```js
import { Objects } from '@openforis/arena-core'

import * as A from '@core/arena'

const keysProps = {
  areaWeightingMethod: 'areaWeightingMethod',
  baseUnitNodeDefUuid: 'baseUnitNodeDefUuid',
  clusteringNodeDefUuid: 'clusteringNodeDefUuid',
  phase1CategoryUuid: 'phase1CategoryUuid',
  phase1JoinAttribute: 'phase1JoinAttribute',
  phase2AsSamplingPointData: 'phase2AsSamplingPointData',
  phase2JoinAttribute: 'phase2JoinAttribute',
  phase2JoinEntityUuid: 'phase2JoinEntityUuid',
  postStratificationAttributeDefUuid: 'postStratificationAttributeDefUuid',
  reportingDataCategoryUuid: 'reportingDataCategoryUuid',
  reportingDataAttributeDefsByLevelUuid: 'reportingDataAttributeDefsByLevelUuid',
  samplingStrategy: 'samplingStrategy',
  stratumNodeDefUuid: 'stratumNodeDefUuid',
}

const samplingStrategies = {
  simpleRandom: 'simpleRandom',
  systematic: 'systematic',
  stratifiedRandom: 'stratifiedRandom',
  stratifiedSystematic: 'stratifiedSystematic',
  twoPhase: 'twoPhase',
  // doublePhase: 'doublePhase'
}

const isPropTrue = (prop) => (obj) => A.prop(prop)(obj) === true

const isAreaWeightingMethod = isPropTrue(keysProps.areaWeightingMethod)
const getBaseUnitNodeDefUuid = A.prop(keysProps.baseUnitNodeDefUuid)
const getClusteringNodeDefUuid = A.prop(keysProps.clusteringNodeDefUuid)
const getPhase1CategoryUuid = A.prop(keysProps.phase1CategoryUuid)
const getPhase1JoinAttribute = A.prop(keysProps.phase1JoinAttribute)
const isPhase2AsSamplingPointData = isPropTrue(keysProps.phase2AsSamplingPointData)
const getPhase2JoinAttribute = A.prop(keysProps.phase2JoinAttribute)
const getPhase2JoinEntityUuid = A.prop(keysProps.phase2JoinEntityUuid)
const getPostStratificationAttributeDefUuid = A.prop(keysProps.postStratificationAttributeDefUuid)
const getReportingDataCategoryUuid = A.prop(keysProps.reportingDataCategoryUuid)
const getReportingDataAttributeDefUuid = ({ categoryLevelUuid }) =>
  Objects.path([keysProps.reportingDataAttributeDefsByLevelUuid, categoryLevelUuid])
const getSamplingStrategy = A.prop(keysProps.samplingStrategy)
const getStratumNodeDefUuid = A.prop(keysProps.stratumNodeDefUuid)

// CHECK
const isPostStratificationEnabled = (samplingDesign) => Boolean(getSamplingStrategy(samplingDesign))

const isStratificationEnabled = (chain) => {
  const samplingStrategy = getSamplingStrategy(chain)
  return (
    samplingStrategy && ![samplingStrategies.simpleRandom, samplingStrategies.systematic].includes(samplingStrategy)
  )
}

const isStratificationNotSpecifiedAllowed = () => {
  return false
  // TODO return true if samplingStrategy is double phase
  // return getSamplingStrategy(chain) === samplingStrategies.doublePhase
}

const isPhase1CategorySelectionEnabled = (samplingDesign) =>
  getSamplingStrategy(samplingDesign) === samplingStrategies.twoPhase

const isPhase2JoinEntitySelectionEnabled = isPhase1CategorySelectionEnabled

const isPhase2AsSamplingPointDataSelectionEnabled = isPhase1CategorySelectionEnabled

const isPhase1JoinAttributeSelectionEnabled = (samplingDesign) =>
  isPhase1CategorySelectionEnabled(samplingDesign) && !isPhase2AsSamplingPointData(samplingDesign)

const isPhase2JoinAttributeSelectionEnabled = isPhase1JoinAttributeSelectionEnabled

// UPDATE

const dissocPhase1CategoryUuid = A.dissoc(keysProps.phase1CategoryUuid)
const dissocPhase1JoinAttribute = A.dissoc(keysProps.phase1JoinAttribute)
const dissocPhase2AsSamplingPointData = A.dissoc(keysProps.phase2AsSamplingPointData)
const dissocPhase2JoinAttribute = A.dissoc(keysProps.phase2JoinAttribute)
const dissocPhase2JoinEntityUuid = A.dissoc(keysProps.phase2JoinEntityUuid)
const dissocPostStratificationAttributeDefUuid = A.dissoc(keysProps.postStratificationAttributeDefUuid)
const dissocStratumNodeDefUuid = A.dissoc(keysProps.stratumNodeDefUuid)
const dissocReportingDataAttributeDefsByLevelUuid = A.dissoc(keysProps.reportingDataAttributeDefsByLevelUuid)

const cleanupSamplingDesign = (samplingDesign) => {
  let samplingDesignUpdated = samplingDesign
  if (getPostStratificationAttributeDefUuid(samplingDesignUpdated) === getStratumNodeDefUuid(samplingDesignUpdated)) {
    samplingDesignUpdated = dissocPostStratificationAttributeDefUuid(samplingDesignUpdated)
  }
  if (!isStratificationEnabled(samplingDesignUpdated) && getStratumNodeDefUuid(samplingDesignUpdated)) {
    samplingDesignUpdated = dissocStratumNodeDefUuid(samplingDesignUpdated)
  }
  if (
    !isPostStratificationEnabled(samplingDesignUpdated) &&
    getPostStratificationAttributeDefUuid(samplingDesignUpdated)
  ) {
    samplingDesignUpdated = dissocPostStratificationAttributeDefUuid(samplingDesignUpdated)
  }
  if (!isPhase1CategorySelectionEnabled(samplingDesignUpdated)) {
    samplingDesignUpdated = dissocPhase1CategoryUuid(samplingDesignUpdated)
  }
  if (!isPhase2JoinEntitySelectionEnabled(samplingDesignUpdated)) {
    samplingDesignUpdated = dissocPhase2JoinEntityUuid(samplingDesignUpdated)
  }
  if (!isPhase2AsSamplingPointDataSelectionEnabled(samplingDesignUpdated)) {
    samplingDesignUpdated = dissocPhase2AsSamplingPointData(samplingDesignUpdated)
  }
  if (!isPhase1JoinAttributeSelectionEnabled(samplingDesignUpdated)) {
    samplingDesignUpdated = dissocPhase1JoinAttribute(samplingDesignUpdated)
  }
  if (!isPhase2JoinAttributeSelectionEnabled(samplingDesignUpdated)) {
    samplingDesignUpdated = dissocPhase2JoinAttribute(samplingDesignUpdated)
  }
  return samplingDesignUpdated
}

const assocBaseUnitNodeDefUuid = (baseUnitNodeDefUuid) => A.assoc(keysProps.baseUnitNodeDefUuid, baseUnitNodeDefUuid)

const assocAreaWeightingMethod = (areaWeightingMethod) => A.assoc(keysProps.areaWeightingMethod, areaWeightingMethod)

const assocClusteringNodeDefUuid = (clusteringNodeDefUuid) =>
  A.assoc(keysProps.clusteringNodeDefUuid, clusteringNodeDefUuid)

const assocPhase1CategoryUuid = (phase1CategoryUuid) =>
  A.pipe(dissocPhase1JoinAttribute, A.assoc(keysProps.phase1CategoryUuid, phase1CategoryUuid))

const assocPhase1JoinAttribute = (phase1JoinAttribute) => A.assoc(keysProps.phase1JoinAttribute, phase1JoinAttribute)

const assocPhase2JoinEntityUuid = (phase2JoinEntityUuid) =>
  A.pipe(dissocPhase2JoinAttribute, A.assoc(keysProps.phase2JoinEntityUuid, phase2JoinEntityUuid))

const assocPhase2AsSamplingPointData = (phase2AsSamplingPointData) =>
  A.pipe(A.assoc(keysProps.phase2AsSamplingPointData, phase2AsSamplingPointData), cleanupSamplingDesign)

const assocPhase2JoinAttribute = (phase2JoinAttribute) => A.assoc(keysProps.phase2JoinAttribute, phase2JoinAttribute)

const assocPostStratificationAttributeDefUuid = (postStratificationAttributeDefUuid) =>
  A.assoc(keysProps.postStratificationAttributeDefUuid, postStratificationAttributeDefUuid)

const assocStratumNodeDefUuid = (stratumNodeDefUuid) =>
  A.pipe(A.assoc(keysProps.stratumNodeDefUuid, stratumNodeDefUuid), cleanupSamplingDesign)

const assocSamplingStrategy = (samplingStrategy) =>
  A.pipe(A.assoc(keysProps.samplingStrategy, samplingStrategy), cleanupSamplingDesign)

const assocReportingDataCategoryUuid = (reportingDataCategoryUuid) =>
  A.pipe(
    dissocReportingDataAttributeDefsByLevelUuid,
    A.assoc(keysProps.reportingDataCategoryUuid, reportingDataCategoryUuid)
  )

const assocReportingDataAttributeDefUuid =
  ({ categoryLevelUuid, nodeDefUuid }) =>
  (samplingDesign) =>
    Objects.assocPath({
      obj: samplingDesign,
      path: [keysProps.reportingDataAttributeDefsByLevelUuid, categoryLevelUuid],
      value: nodeDefUuid,
    })

export const ChainSamplingDesign = {
  keysProps,
  samplingStrategies,

  // READ
  getBaseUnitNodeDefUuid,
  isAreaWeightingMethod,
  getClusteringNodeDefUuid,
  getPhase1CategoryUuid,
  getPhase1JoinAttribute,
  isPhase2AsSamplingPointData,
  getPhase2JoinAttribute,
  getPhase2JoinEntityUuid,
  isPostStratificationEnabled,
  getReportingDataAttributeDefUuid,
  getReportingDataCategoryUuid,
  isPhase1CategorySelectionEnabled,
  isPhase1JoinAttributeSelectionEnabled,
  isPhase2AsSamplingPointDataSelectionEnabled,
  isPhase2JoinAttributeSelectionEnabled,
  isPhase2JoinEntitySelectionEnabled,
  isStratificationEnabled,
  isStratificationNotSpecifiedAllowed,
  getPostStratificationAttributeDefUuid,
  getSamplingStrategy,
  getStratumNodeDefUuid,

  // UPDATE
  assocAreaWeightingMethod,
  assocBaseUnitNodeDefUuid,
  assocClusteringNodeDefUuid,
  assocPhase1CategoryUuid,
  assocPhase1JoinAttribute,
  assocPhase2AsSamplingPointData,
  assocPhase2JoinAttribute,
  assocPhase2JoinEntityUuid,
  assocPostStratificationAttributeDefUuid,
  assocReportingDataCategoryUuid,
  assocReportingDataAttributeDefUuid,
  assocSamplingStrategy,
  assocStratumNodeDefUuid,
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `yarn build:test:unit && jest dist/__tests__/bundle.unit.js -t "ChainSamplingDesign"`
Expected: PASS (all `describe('ChainSamplingDesign.*')` blocks green).

- [ ] **Step 5: Commit**

```bash
git add common/analysis/chainSamplingDesign.js test/unit/tests/042chainSamplingDesign.test.js
git commit -m "Rename and extend ChainSamplingDesign phase 1/2 props

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 2: i18n — rename/add `chainView` translation keys

**Files:**
- Modify: `core/i18n/resources/en/common.js`
- Modify: `core/i18n/resources/es/common.js`
- Modify: `core/i18n/resources/fr/common.js`
- Modify: `core/i18n/resources/pt/common.js`
- Modify: `core/i18n/resources/ru/common.js`
- Modify: `core/i18n/resources/mn/common.js`

**Interfaces:**
- Produces (used by Tasks 3, 5, 6, and the `Phase2JoinEntitySelector` /
  `Phase2AsSamplingPointDataSelector` in Task 4): `chainView.phase1Category`,
  `chainView.phase1CategoryInfo`, `chainView.phase2JoinEntity.label`,
  `chainView.phase2JoinEntity.info`, `chainView.phase2AsSamplingPointData.label`,
  `chainView.phase1JoinAttribute.label`, `chainView.phase1JoinAttribute.info`,
  `chainView.phase2JoinAttribute.label`, `chainView.phase2JoinAttribute.info`.

This task has no automated test (translation text); verify by grepping for stray old keys
afterward (Step 8).

- [ ] **Step 1: Update `en/common.js`**

Replace:
```js
    firstPhaseCategory: '1st phase category',
    firstPhaseCategoryInfo: 'Select the category that contains the first-phase samples.',
    firstPhaseCategoryExtraProp: {
      label: '1st phase stratum attribute',
      info: 'Select the extra property of the $t(chainView.firstPhaseCategory) (column of the category table) used to divide the original population into broad strata for the initial sampling phase.',
    },
    firstPhaseCommonAttribute: {
      label: 'Common attribute',
      info: `Attribute in common between base unit and 1st phase table
(it must be a code or text attribute; its value is matched against the extra properties defined for the 1st phase category - the attribute name does not need to match the extra property name)`,
    },
```
With:
```js
    phase1Category: '1st phase category',
    phase1CategoryInfo: 'Select the category that contains the first-phase samples.',
    phase2JoinEntity: {
      label: 'Join entity (2nd phase)',
      info: 'Entity used to join the base unit with the 1st phase category: the base unit entity itself, or one of its parent entities.',
    },
    phase2AsSamplingPointData: {
      label: 'Join by using Sampling Point Data linkage',
    },
    phase1JoinAttribute: {
      label: 'Join attribute (1st phase)',
      info: 'Select the column of the $t(chainView.phase1Category) table (an extra property, or "code") used to join it with the 2nd phase join entity.',
    },
    phase2JoinAttribute: {
      label: 'Join attribute (2nd phase)',
      info: `Select the code or text attribute of the join entity (2nd phase) used to join it with the 1st phase table;
its value is matched against the extra properties defined for the 1st phase category.`,
    },
```

- [ ] **Step 2: Update `es/common.js`**

Replace:
```js
    firstPhaseCategory: 'Categoría de primera fase',
    firstPhaseCategoryInfo: 'Seleccione la categoría que contiene las muestras de la primera fase.',
    firstPhaseCategoryExtraProp: {
      label: 'Atributo de estrato de 1ª fase',
      info: 'Seleccione la variable utilizada para dividir la población original en estratos amplios para la fase inicial de muestreo.',
    },
    firstPhaseCommonAttribute: {
      label: 'Atributo común',
      info: 'Atributo común entre la unidad base y la tabla de primera fase (debe ser un atributo de código o de texto; su valor se compara con las propiedades adicionales definidas para la categoría de primera fase - el nombre del atributo no necesita coincidir con el de la propiedad adicional)',
    },
```
With:
```js
    phase1Category: 'Categoría de primera fase',
    phase1CategoryInfo: 'Seleccione la categoría que contiene las muestras de la primera fase.',
    phase2JoinEntity: {
      label: 'Entidad de unión (2ª fase)',
      info: 'Entidad utilizada para unir la unidad base con la categoría de 1ª fase: la propia entidad de la unidad base, o una de sus entidades superiores.',
    },
    phase2AsSamplingPointData: {
      label: 'Unir usando el enlace de Sampling Point Data',
    },
    phase1JoinAttribute: {
      label: 'Atributo de unión (1ª fase)',
      info: 'Seleccione la columna de la tabla $t(chainView.phase1Category) (una propiedad adicional, o "code") utilizada para unirla con la entidad de unión de la 2ª fase.',
    },
    phase2JoinAttribute: {
      label: 'Atributo de unión (2ª fase)',
      info: 'Seleccione el atributo de código o texto de la entidad de unión (2ª fase) utilizado para unirla con la tabla de 1ª fase; su valor se compara con las propiedades adicionales definidas para la categoría de 1ª fase.',
    },
```

- [ ] **Step 3: Update `fr/common.js`**

Replace:
```js
    firstPhaseCategory: 'Catégorie de 1ère phase',
    firstPhaseCategoryInfo: 'Sélectionnez la catégorie contenant les échantillons de la 1ère phase.',
    firstPhaseCategoryExtraProp: {
      label: 'Attribut de strate de 1ère phase',
      info: "Sélectionnez la variable utilisée pour diviser la population d'origine en strates larges pour la phase initiale d'échantillonnage.",
    },
    firstPhaseCommonAttribute: {
      label: 'Attribut commun',
      info: `Attribut en commun entre l'unité de base et la table de 1ère phase
(il doit s'agir d'un attribut de type code ou texte ; sa valeur est comparée aux propriétés supplémentaires définies pour la catégorie de 1ère phase - le nom de l'attribut n'a pas besoin de correspondre à celui de la propriété supplémentaire)`,
    },
```
With:
```js
    phase1Category: 'Catégorie de 1ère phase',
    phase1CategoryInfo: 'Sélectionnez la catégorie contenant les échantillons de la 1ère phase.',
    phase2JoinEntity: {
      label: 'Entité de jointure (2e phase)',
      info: "Entité utilisée pour joindre l'unité de base à la catégorie de 1ère phase : l'entité de l'unité de base elle-même, ou l'une de ses entités parentes.",
    },
    phase2AsSamplingPointData: {
      label: 'Joindre en utilisant le lien Sampling Point Data',
    },
    phase1JoinAttribute: {
      label: 'Attribut de jointure (1ère phase)',
      info: "Sélectionnez la colonne de la table $t(chainView.phase1Category) (une propriété supplémentaire, ou « code ») utilisée pour la joindre à l'entité de jointure de la 2e phase.",
    },
    phase2JoinAttribute: {
      label: 'Attribut de jointure (2e phase)',
      info: "Sélectionnez l'attribut de type code ou texte de l'entité de jointure (2e phase) utilisé pour la joindre à la table de 1ère phase ; sa valeur est comparée aux propriétés supplémentaires définies pour la catégorie de 1ère phase.",
    },
```

- [ ] **Step 4: Update `pt/common.js`**

Replace:
```js
    firstPhaseCategory: 'Categoria da 1ª fase',
    firstPhaseCategoryInfo: 'Selecione a categoria que contém as amostras da 1ª fase.',
    firstPhaseCategoryExtraProp: {
      label: 'Atributo de estrato da 1ª fase',
      info: 'Selecione a variável usada para dividir a população original em estratos amplos para a fase inicial de amostragem.',
    },
    firstPhaseCommonAttribute: {
      label: 'Atributo comum',
      info: `Atributo em comum entre a unidade base e a tabela da 1ª fase
    (deve ser um atributo de código ou de texto; o seu valor é comparado com as propriedades extra definidas para a categoria da 1ª fase - o nome do atributo não precisa corresponder ao nome da propriedade extra)`,
    },
```
With:
```js
    phase1Category: 'Categoria da 1ª fase',
    phase1CategoryInfo: 'Selecione a categoria que contém as amostras da 1ª fase.',
    phase2JoinEntity: {
      label: 'Entidade de junção (2ª fase)',
      info: 'Entidade usada para unir a unidade base à categoria da 1ª fase: a própria entidade da unidade base, ou uma das suas entidades superiores.',
    },
    phase2AsSamplingPointData: {
      label: 'Unir usando a ligação de Sampling Point Data',
    },
    phase1JoinAttribute: {
      label: 'Atributo de junção (1ª fase)',
      info: 'Selecione a coluna da tabela $t(chainView.phase1Category) (uma propriedade extra, ou "code") usada para a unir à entidade de junção da 2ª fase.',
    },
    phase2JoinAttribute: {
      label: 'Atributo de junção (2ª fase)',
      info: 'Selecione o atributo de código ou texto da entidade de junção (2ª fase) usado para a unir à tabela da 1ª fase; o seu valor é comparado com as propriedades extra definidas para a categoria da 1ª fase.',
    },
```

- [ ] **Step 5: Update `ru/common.js`**

Replace:
```js
    firstPhaseCategory: 'Категория 1-й фазы',
    firstPhaseCategoryInfo: 'Выберите категорию, содержащую выборки 1-й фазы.',
    firstPhaseCategoryExtraProp: {
      label: 'Атрибут страты 1-й фазы',
      info: 'Выберите переменную, используемую для разделения исходной совокупности на широкие страты для начальной фазы выборки.',
    },
    firstPhaseCommonAttribute: {
      label: 'Общий атрибут',
      info: `Атрибут, общий для базовой единицы и таблицы 1-й фазы
(это должен быть атрибут типа "код" или "текст"; его значение сопоставляется с дополнительными свойствами, определенными для категории 1-й фазы — имя атрибута не обязательно должно совпадать с именем дополнительного свойства)`,
    },
```
With:
```js
    phase1Category: 'Категория 1-й фазы',
    phase1CategoryInfo: 'Выберите категорию, содержащую выборки 1-й фазы.',
    phase2JoinEntity: {
      label: 'Объект соединения (2-я фаза)',
      info: 'Объект, используемый для соединения базовой единицы с категорией 1-й фазы: сама базовая единица или одна из её родительских сущностей.',
    },
    phase2AsSamplingPointData: {
      label: 'Соединять с использованием связи Sampling Point Data',
    },
    phase1JoinAttribute: {
      label: 'Атрибут соединения (1-я фаза)',
      info: 'Выберите столбец таблицы $t(chainView.phase1Category) (дополнительное свойство или "code"), используемый для соединения с объектом соединения 2-й фазы.',
    },
    phase2JoinAttribute: {
      label: 'Атрибут соединения (2-я фаза)',
      info: 'Выберите атрибут типа "код" или "текст" объекта соединения (2-я фаза), используемый для соединения с таблицей 1-й фазы; его значение сопоставляется с дополнительными свойствами, определёнными для категории 1-й фазы.',
    },
```

- [ ] **Step 6: Update `mn/common.js`**

Replace:
```js
    firstPhaseCategory: '1-р үе шатны ангилал',
    firstPhaseCategoryInfo: '1-р үе шатны түүврийг агуулсан ангиллыг сонгоно уу.',
    firstPhaseCategoryExtraProp: {
      label: '1-р үе шатны давхаргын шинж чанар',
      info: 'Анхны популяцийг эхний түүврийн шатанд өргөн давхаргад хуваахад ашиглах хувьсагчийг сонгоно уу.',
    },
    firstPhaseCommonAttribute: {
      label: 'Нийтлэг шинж чанар',
      info: `Суурь нэгж ба 1-р үе шатны хүснэгтийн хоорондох нийтлэг шинж чанар
(энэ нь код эсвэл текст төрлийн шинж чанар байх ёстой; түүний утгыг 1-р үе шатны ангилалд тодорхойлогдсон нэмэлт шинж чанаруудтай харьцуулна - шинж чанарын нэр нэмэлт шинж чанарын нэртэй адил байх шаардлагагүй)`,
    },
```
With:
```js
    phase1Category: '1-р үе шатны ангилал',
    phase1CategoryInfo: '1-р үе шатны түүврийг агуулсан ангиллыг сонгоно уу.',
    phase2JoinEntity: {
      label: 'Холболтын объект (2-р үе шат)',
      info: 'Суурь нэгжийг 1-р үе шатны ангилалтай холбоход ашиглах объект: суурь нэгж өөрөө, эсвэл түүний эцэг объектуудын аль нэг.',
    },
    phase2AsSamplingPointData: {
      label: 'Sampling Point Data холбоосыг ашиглан холбох',
    },
    phase1JoinAttribute: {
      label: 'Холболтын шинж чанар (1-р үе шат)',
      info: '$t(chainView.phase1Category) хүснэгтийн баганыг (нэмэлт шинж чанар эсвэл "code") 2-р үе шатны холболтын объекттой холбоход ашиглана.',
    },
    phase2JoinAttribute: {
      label: 'Холболтын шинж чанар (2-р үе шат)',
      info: 'Холболтын объектын (2-р үе шат) код эсвэл текст төрлийн шинж чанарыг 1-р үе шатны хүснэгттэй холбоход ашиглана; түүний утгыг 1-р үе шатны ангиллын нэмэлт шинж чанаруудтай харьцуулна.',
    },
```

- [ ] **Step 7: Verify no stray references to the removed keys remain**

Run: `grep -rn "firstPhaseCategoryExtraProp\|firstPhaseCommonAttribute\|chainView.firstPhaseCategory\b\|chainView.firstPhaseCategoryInfo" core/i18n webapp/views/App/views/Analysis/Chain`
Expected: no output (the webapp references are updated in Tasks 3, 5, 6; if this is run
before those tasks, matches in `webapp/` are expected and will be cleared by then — only
`core/i18n` matches must be empty after this task).

- [ ] **Step 8: Commit**

```bash
git add core/i18n/resources/en/common.js core/i18n/resources/es/common.js core/i18n/resources/fr/common.js core/i18n/resources/pt/common.js core/i18n/resources/ru/common.js core/i18n/resources/mn/common.js
git commit -m "Rename and add chainView translation keys for phase 1/2 join props

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 3: Webapp — rename `FirstPhaseCategorySelector` to `Phase1CategorySelector`

**Files:**
- Rename: `webapp/views/App/views/Analysis/Chain/FirstPhaseCategorySelector/FirstPhaseCategorySelector.js` → `webapp/views/App/views/Analysis/Chain/Phase1CategorySelector/Phase1CategorySelector.js`

**Interfaces:**
- Consumes: `ChainSamplingDesign.getPhase1CategoryUuid`, `assocPhase1CategoryUuid` (Task 1);
  `chainView.phase1Category` / `chainView.phase1CategoryInfo` (Task 2).
- Produces: `Phase1CategorySelector` React component, imported by Task 8 as
  `import { Phase1CategorySelector } from './Phase1CategorySelector/Phase1CategorySelector'`.

- [ ] **Step 1: Rename the directory and file**

Run: `git mv webapp/views/App/views/Analysis/Chain/FirstPhaseCategorySelector webapp/views/App/views/Analysis/Chain/Phase1CategorySelector && git mv webapp/views/App/views/Analysis/Chain/Phase1CategorySelector/FirstPhaseCategorySelector.js webapp/views/App/views/Analysis/Chain/Phase1CategorySelector/Phase1CategorySelector.js`

Note: this directory also has an `index.js` barrel file (`export { FirstPhaseCategorySelector } from './FirstPhaseCategorySelector'`, matching the sibling `BaseUnitSelector/index.js` and `SamplingDesignStrategySelector/index.js` pattern) — update it in this same step to `export { Phase1CategorySelector } from './Phase1CategorySelector'`, and update the one consumer of this barrel import, `webapp/views/App/views/Analysis/Chain/ChainSamplingDesignProps.js`'s `import { FirstPhaseCategorySelector } from './FirstPhaseCategorySelector'` line, to `import { Phase1CategorySelector } from './Phase1CategorySelector'`, so the app still builds after this task (Task 8 replaces the rest of that file's imports and JSX later; this one line is already correct by then).

- [ ] **Step 2: Update the moved file's content**

Replace the full content of `webapp/views/App/views/Analysis/Chain/Phase1CategorySelector/Phase1CategorySelector.js`:

```js
import { useDispatch } from 'react-redux'

import * as Chain from '@common/analysis/chain'
import * as Category from '@core/survey/category'
import { ChainSamplingDesign } from '@common/analysis/chainSamplingDesign'

import { FormItem } from '@webapp/components/form/Input'
import { ChainActions, useChain, useChainEditable } from '@webapp/store/ui/chain'
import { CategorySelector } from '@webapp/components/survey/CategorySelector'

export const Phase1CategorySelector = () => {
  const dispatch = useDispatch()
  const chain = useChain()
  const editable = useChainEditable()
  const samplingDesign = Chain.getSamplingDesign(chain)

  const onChange = (category) => {
    const chainUpdated = Chain.updateSamplingDesign(
      ChainSamplingDesign.assocPhase1CategoryUuid(Category.getUuid(category))
    )(chain)
    dispatch(ChainActions.updateChain({ chain: chainUpdated }))
  }

  return (
    <FormItem label="chainView.phase1Category" info="chainView.phase1CategoryInfo">
      <CategorySelector
        categoryUuid={ChainSamplingDesign.getPhase1CategoryUuid(samplingDesign)}
        onChange={onChange}
        showAdd={false}
        showEdit={editable}
        showManage={false}
        disabled={!editable}
      />
    </FormItem>
  )
}
```

- [ ] **Step 3: Verify no other file still imports the old path**

Run: `grep -rn "FirstPhaseCategorySelector" webapp`
Expected: no output (Task 8 will add the new import; if run before Task 8, this checks only
that no stale import of the *old* path remains — there should already be none since the
directory was renamed via `git mv`).

- [ ] **Step 4: Commit**

```bash
git add webapp/views/App/views/Analysis/Chain/Phase1CategorySelector
git commit -m "Rename FirstPhaseCategorySelector to Phase1CategorySelector

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 4: Webapp — new `Phase2JoinEntitySelector` and `Phase2AsSamplingPointDataSelector`

**Files:**
- Create: `webapp/views/App/views/Analysis/Chain/Phase2JoinEntitySelector.js`
- Create: `webapp/views/App/views/Analysis/Chain/Phase2AsSamplingPointDataSelector.js`

**Interfaces:**
- Consumes: `ChainSamplingDesign.getPhase2JoinEntityUuid`, `assocPhase2JoinEntityUuid`,
  `isPhase2AsSamplingPointData`, `assocPhase2AsSamplingPointData` (Task 1);
  `chainView.phase2JoinEntity.{label,info}`, `chainView.phase2AsSamplingPointData.label`
  (Task 2); `Survey.getBaseUnitNodeDef`, `Survey.getHierarchy`, `NodeDef.isRoot`,
  `NodeDef.isAncestorOf`, `NodeDef.getUuid` (existing core APIs).
- Produces: `Phase2JoinEntitySelector` and `Phase2AsSamplingPointDataSelector` React
  components, imported by Task 8.

- [ ] **Step 1: Create `Phase2JoinEntitySelector.js`**

```js
import React, { useCallback } from 'react'
import { useDispatch } from 'react-redux'

import * as Chain from '@common/analysis/chain'
import { ChainSamplingDesign } from '@common/analysis/chainSamplingDesign'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import { ChainActions, useChain, useChainEditable } from '@webapp/store/ui/chain'
import { useSurvey } from '@webapp/store/survey'

import { FormItem } from '@webapp/components/form/Input'
import { EntitySelector } from '@webapp/components/survey/NodeDefsSelector'

export const Phase2JoinEntitySelector = () => {
  const dispatch = useDispatch()
  const survey = useSurvey()

  const chain = useChain()
  const editable = useChainEditable()
  const samplingDesign = Chain.getSamplingDesign(chain)

  const baseUnitNodeDef = Survey.getBaseUnitNodeDef({ chain })(survey)

  const hierarchy = Survey.getHierarchy(
    (nodeDef) =>
      NodeDef.isRoot(nodeDef) ||
      (Boolean(baseUnitNodeDef) &&
        (NodeDef.getUuid(nodeDef) === NodeDef.getUuid(baseUnitNodeDef) ||
          NodeDef.isAncestorOf(baseUnitNodeDef)(nodeDef)))
  )(survey)

  const selectedEntityUuid = ChainSamplingDesign.getPhase2JoinEntityUuid(samplingDesign)

  const onChange = useCallback(
    (entityDefUuid) => {
      const chainUpdated = Chain.updateSamplingDesign(
        ChainSamplingDesign.assocPhase2JoinEntityUuid(entityDefUuid === 'null' ? null : entityDefUuid)
      )(chain)
      dispatch(ChainActions.updateChain({ chain: chainUpdated }))
    },
    [dispatch, chain]
  )

  return (
    <FormItem label="chainView.phase2JoinEntity.label" info="chainView.phase2JoinEntity.info">
      <EntitySelector
        hierarchy={hierarchy}
        nodeDefUuidEntity={selectedEntityUuid}
        onChange={onChange}
        showSingleEntities={true}
        useNameAsLabel={true}
        allowEmptySelection={true}
        disabled={!editable}
      />
    </FormItem>
  )
}
```

- [ ] **Step 2: Create `Phase2AsSamplingPointDataSelector.js`**

```js
import React, { useCallback } from 'react'
import { useDispatch } from 'react-redux'

import * as Chain from '@common/analysis/chain'
import { ChainSamplingDesign } from '@common/analysis/chainSamplingDesign'

import { Checkbox } from '@webapp/components/form'
import { FormItem } from '@webapp/components/form/Input'
import { ChainActions, useChain, useChainEditable } from '@webapp/store/ui/chain'

export const Phase2AsSamplingPointDataSelector = () => {
  const dispatch = useDispatch()
  const chain = useChain()
  const editable = useChainEditable()
  const samplingDesign = Chain.getSamplingDesign(chain)

  const onChange = useCallback(
    (value) => {
      const chainUpdated = Chain.updateSamplingDesign(ChainSamplingDesign.assocPhase2AsSamplingPointData(value))(
        chain
      )
      dispatch(ChainActions.updateChain({ chain: chainUpdated }))
    },
    [dispatch, chain]
  )

  return (
    <FormItem label="chainView.phase2AsSamplingPointData.label">
      <Checkbox
        checked={ChainSamplingDesign.isPhase2AsSamplingPointData(samplingDesign)}
        onChange={onChange}
        disabled={!editable}
      />
    </FormItem>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add webapp/views/App/views/Analysis/Chain/Phase2JoinEntitySelector.js webapp/views/App/views/Analysis/Chain/Phase2AsSamplingPointDataSelector.js
git commit -m "Add Phase2JoinEntitySelector and Phase2AsSamplingPointDataSelector

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

(These components aren't wired into the page yet — that happens in Task 8. Nothing to
manually verify in the browser until then.)

---

## Task 5: Webapp — new `Phase1JoinAttributeSelector` (replaces `FirstPhaseCategoryExtraPropSelector`)

**Files:**
- Create: `webapp/views/App/views/Analysis/Chain/Phase1JoinAttributeSelector.js`
- Delete: `webapp/views/App/views/Analysis/Chain/FirstPhaseCategoryExtraPropSelector.js`

**Interfaces:**
- Consumes: `ChainSamplingDesign.getPhase1CategoryUuid`, `getPhase1JoinAttribute`,
  `assocPhase1JoinAttribute` (Task 1); `chainView.phase1JoinAttribute.{label,info}` (Task 2);
  `Category.getItemExtraDefsArray`, `ExtraPropDef.{getName,getDataType,dataTypes}` (existing
  core APIs).
- Produces: `Phase1JoinAttributeSelector` React component, imported by Task 8.

- [ ] **Step 1: Create `Phase1JoinAttributeSelector.js`**

```js
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

const codeAttributeName = 'code'

const attributeNameToItem = (name) => ({ value: name, label: name })

export const Phase1JoinAttributeSelector = () => {
  const dispatch = useDispatch()
  const i18n = useI18n()
  const chain = useChain()
  const editable = useChainEditable()
  const samplingDesign = Chain.getSamplingDesign(chain)
  const phase1CategoryUuid = ChainSamplingDesign.getPhase1CategoryUuid(samplingDesign)

  const attributeNames = useSelector((state) => {
    const survey = SurveyState.getSurvey(state)
    const phase1Category = Survey.getCategoryByUuid(phase1CategoryUuid)(survey)
    if (!phase1Category) return [codeAttributeName]
    const extraPropNames = Category.getItemExtraDefsArray(phase1Category)
      .filter((extraDef) => ExtraPropDef.getDataType(extraDef) !== ExtraPropDef.dataTypes.geometryPoint)
      .map(ExtraPropDef.getName)
    return [codeAttributeName, ...extraPropNames]
  }, Objects.isEqual)

  const emptyItem = { value: null, label: i18n.t('common.notSpecified') }
  const items = [emptyItem, ...attributeNames.map(attributeNameToItem)]

  const selectedName = ChainSamplingDesign.getPhase1JoinAttribute(samplingDesign)
  const selectedItem =
    selectedName && attributeNames.includes(selectedName) ? attributeNameToItem(selectedName) : emptyItem

  const onChange = useCallback(
    (item) => {
      const chainUpdated = Chain.updateSamplingDesign(ChainSamplingDesign.assocPhase1JoinAttribute(item?.value))(
        chain
      )
      dispatch(ChainActions.updateChain({ chain: chainUpdated }))
    },
    [chain, dispatch]
  )

  return (
    <FormItem label="chainView.phase1JoinAttribute.label" info="chainView.phase1JoinAttribute.info">
      <Dropdown
        items={items}
        selection={selectedItem}
        onChange={onChange}
        disabled={!editable || !phase1CategoryUuid}
      />
    </FormItem>
  )
}
```

- [ ] **Step 2: Delete the old component**

Run: `git rm webapp/views/App/views/Analysis/Chain/FirstPhaseCategoryExtraPropSelector.js`

- [ ] **Step 3: Commit**

```bash
git add webapp/views/App/views/Analysis/Chain/Phase1JoinAttributeSelector.js
git commit -m "Replace FirstPhaseCategoryExtraPropSelector with Phase1JoinAttributeSelector

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

(Not wired into the page yet — Task 8.)

---

## Task 6: Webapp — new `Phase2JoinAttributeSelector` (replaces `FirstPhaseCommonAttributeSelector`)

**Files:**
- Create: `webapp/views/App/views/Analysis/Chain/Phase2JoinAttributeSelector.js`
- Delete: `webapp/views/App/views/Analysis/Chain/FirstPhaseCommonAttributeSelector.js`

**Interfaces:**
- Consumes: `ChainSamplingDesign.getPhase2JoinEntityUuid`, `getPhase2JoinAttribute`,
  `assocPhase2JoinAttribute` (Task 1); `chainView.phase2JoinAttribute.{label,info}` (Task 2);
  `Survey.getNodeDefDescendantAttributesInSingleEntities`, `NodeDef.{getType,nodeDefType,getUuid,getLabel,NodeDefLabelTypes}`
  (existing core APIs).
- Produces: `Phase2JoinAttributeSelector` React component, imported by Task 8.

- [ ] **Step 1: Create `Phase2JoinAttributeSelector.js`**

```js
import React, { useCallback, useMemo } from 'react'
import { useDispatch } from 'react-redux'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import * as Chain from '@common/analysis/chain'
import { ChainSamplingDesign } from '@common/analysis/chainSamplingDesign'

import { Dropdown } from '@webapp/components/form'
import { FormItem } from '@webapp/components/form/Input'
import { useSurvey } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'
import { ChainActions, useChain, useChainEditable } from '@webapp/store/ui/chain'

const allowedNodeDefTypes = [NodeDef.nodeDefType.code, NodeDef.nodeDefType.text]

const nodeDefToItem = (nodeDef) => ({
  value: NodeDef.getUuid(nodeDef),
  label: NodeDef.getLabel(nodeDef, null, NodeDef.NodeDefLabelTypes.name),
})

export const Phase2JoinAttributeSelector = () => {
  const dispatch = useDispatch()
  const i18n = useI18n()
  const survey = useSurvey()
  const chain = useChain()
  const editable = useChainEditable()
  const samplingDesign = Chain.getSamplingDesign(chain)

  const phase2JoinEntityUuid = ChainSamplingDesign.getPhase2JoinEntityUuid(samplingDesign)
  const phase2JoinEntity = phase2JoinEntityUuid ? Survey.getNodeDefByUuid(phase2JoinEntityUuid)(survey) : null

  const selectableDefs = useMemo(() => {
    if (!phase2JoinEntity) return []
    return Survey.getNodeDefDescendantAttributesInSingleEntities({
      nodeDef: phase2JoinEntity,
      includeAnalysis: true,
    })(survey).filter((descendantDef) => allowedNodeDefTypes.includes(NodeDef.getType(descendantDef)))
  }, [phase2JoinEntity, survey])

  const emptyItem = { value: null, label: i18n.t('common.notSpecified') }
  const items = [emptyItem, ...selectableDefs.map(nodeDefToItem)]

  const selectedNodeDefUuid = ChainSamplingDesign.getPhase2JoinAttribute(samplingDesign)
  const selectedDef = selectedNodeDefUuid
    ? selectableDefs.find((def) => NodeDef.getUuid(def) === selectedNodeDefUuid)
    : null
  const selectedItem = selectedDef ? nodeDefToItem(selectedDef) : emptyItem

  const onChange = useCallback(
    (item) => {
      const chainUpdated = Chain.updateSamplingDesign(ChainSamplingDesign.assocPhase2JoinAttribute(item?.value))(
        chain
      )
      dispatch(ChainActions.updateChain({ chain: chainUpdated }))
    },
    [chain, dispatch]
  )

  return (
    <FormItem label="chainView.phase2JoinAttribute.label" info="chainView.phase2JoinAttribute.info">
      <Dropdown items={items} selection={selectedItem} onChange={onChange} disabled={!editable || !phase2JoinEntity} />
    </FormItem>
  )
}
```

- [ ] **Step 2: Delete the old component**

Run: `git rm webapp/views/App/views/Analysis/Chain/FirstPhaseCommonAttributeSelector.js`

- [ ] **Step 3: Commit**

```bash
git add webapp/views/App/views/Analysis/Chain/Phase2JoinAttributeSelector.js
git commit -m "Replace FirstPhaseCommonAttributeSelector with Phase2JoinAttributeSelector

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

(Not wired into the page yet — Task 8.)

---

## Task 7: Webapp — `StratumAttributeSelector` two-phase name-intersection filter

**Files:**
- Modify: `webapp/views/App/views/Analysis/Chain/StratumAttributeSelector.js`

**Interfaces:**
- Consumes: `ChainSamplingDesign.isPhase1CategorySelectionEnabled`, `getPhase1CategoryUuid`
  (Task 1); `Category.getItemExtraDefKeys`, `Survey.getCategoryByUuid` (existing core APIs);
  `BaseUnitAttributeSelector`'s existing `nodeDefFilter` prop (unchanged, already supports
  this).

- [ ] **Step 1: Replace the file's content**

```js
import React, { useCallback, useMemo } from 'react'
import { useDispatch } from 'react-redux'

import * as Survey from '@core/survey/survey'
import * as Category from '@core/survey/category'
import * as NodeDef from '@core/survey/nodeDef'

import * as Chain from '@common/analysis/chain'
import { ChainSamplingDesign } from '@common/analysis/chainSamplingDesign'

import { ChainActions, useChain } from '@webapp/store/ui/chain'
import { useSurvey } from '@webapp/store/survey'

import { BaseUnitAttributeSelector } from './BaseUnitAttributeSelector'

export const StratumAttributeSelector = () => {
  const dispatch = useDispatch()
  const survey = useSurvey()
  const chain = useChain()
  const samplingDesign = Chain.getSamplingDesign(chain)

  /* eslint-disable react-hooks/preserve-manual-memoization -- pre-existing: React Compiler cannot preserve this callback's memoization here (unrelated to this task, reproduces on master too) */
  const onChange = useCallback(
    (stratumDefUuid) => {
      const chainUpdated = Chain.updateSamplingDesign(ChainSamplingDesign.assocStratumNodeDefUuid(stratumDefUuid))(
        chain
      )
      dispatch(ChainActions.updateChain({ chain: chainUpdated }))
    },
    [chain, dispatch]
  )
  /* eslint-enable react-hooks/preserve-manual-memoization */

  const isTwoPhase = ChainSamplingDesign.isPhase1CategorySelectionEnabled(samplingDesign)
  const label = isTwoPhase ? 'chainView.stratumAttribute2ndPhase' : 'chainView.stratumAttribute'
  const info = isTwoPhase ? 'chainView.stratumAttribute2ndPhaseInfo' : 'chainView.stratumAttributeInfo'

  const phase1CategoryUuid = ChainSamplingDesign.getPhase1CategoryUuid(samplingDesign)
  const phase1Category = phase1CategoryUuid ? Survey.getCategoryByUuid(phase1CategoryUuid)(survey) : null

  const nodeDefFilter = useMemo(() => {
    if (!isTwoPhase) return null
    const candidateNames = new Set(['code', ...(phase1Category ? Category.getItemExtraDefKeys(phase1Category) : [])])
    return (nodeDef) => candidateNames.has(NodeDef.getName(nodeDef))
  }, [isTwoPhase, phase1Category])

  return (
    <BaseUnitAttributeSelector
      allowEmptySelection={ChainSamplingDesign.isStratificationNotSpecifiedAllowed(samplingDesign)}
      info={info}
      label={label}
      nodeDefFilter={nodeDefFilter}
      selectedNodeDefUuid={ChainSamplingDesign.getStratumNodeDefUuid(samplingDesign)}
      onChange={onChange}
    />
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add webapp/views/App/views/Analysis/Chain/StratumAttributeSelector.js
git commit -m "Filter two-phase Stratum attribute to names shared with the 1st phase category

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 8: Webapp — reorder and wire up `ChainSamplingDesignProps.js`

**Files:**
- Modify: `webapp/views/App/views/Analysis/Chain/ChainSamplingDesignProps.js`

**Interfaces:**
- Consumes every component from Tasks 3–7 plus the existing `BaseUnitSelector`,
  `SamplingDesignStrategySelector`, `StratumAttributeSelector`, `ClusteringEntitySelector`,
  and `ChainSamplingDesign.isPhase1CategorySelectionEnabled`,
  `isPhase1JoinAttributeSelectionEnabled`, `isPhase2JoinAttributeSelectionEnabled`,
  `isStratificationEnabled` (Task 1).

- [ ] **Step 1: Update the imports**

In `webapp/views/App/views/Analysis/Chain/ChainSamplingDesignProps.js`, replace:

```js
import BaseUnitSelector from './BaseUnitSelector'
import { ClusteringEntitySelector } from './ClusteringEntitySelector'
import { FirstPhaseCategoryExtraPropSelector } from './FirstPhaseCategoryExtraPropSelector'
import { Phase1CategorySelector } from './Phase1CategorySelector'
import { FirstPhaseCommonAttributeSelector } from './FirstPhaseCommonAttributeSelector'
import { SamplingDesignStrategySelector } from './SamplingDesignStrategySelector'
import { StratumAttributeSelector } from './StratumAttributeSelector'
```

(Task 3 already renamed the `Phase1CategorySelector` import line — this task only replaces
the other six.)

With:

```js
import BaseUnitSelector from './BaseUnitSelector'
import { ClusteringEntitySelector } from './ClusteringEntitySelector'
import { Phase1CategorySelector } from './Phase1CategorySelector'
import { Phase1JoinAttributeSelector } from './Phase1JoinAttributeSelector'
import { Phase2AsSamplingPointDataSelector } from './Phase2AsSamplingPointDataSelector'
import { Phase2JoinAttributeSelector } from './Phase2JoinAttributeSelector'
import { Phase2JoinEntitySelector } from './Phase2JoinEntitySelector'
import { SamplingDesignStrategySelector } from './SamplingDesignStrategySelector'
import { StratumAttributeSelector } from './StratumAttributeSelector'
```

- [ ] **Step 2: Reorder Base unit / Sampling strategy and wire up the new fields**

Replace:

```jsx
      <div className="form">
        {(Chain.hasSamplingDesign(chain) || hasBaseUnit) && <BaseUnitSelector />}

        {hasBaseUnit && (
          <>
            <SamplingDesignStrategySelector chain={chain} updateChain={updateChain} />

            {ChainSamplingDesign.isFirstPhaseCategorySelectionEnabled(samplingDesign) && (
              <>
                <FirstPhaseCategorySelector />
                <FirstPhaseCategoryExtraPropSelector />
              </>
            )}

            {ChainSamplingDesign.isStratificationEnabled(samplingDesign) && <StratumAttributeSelector />}
            {/* {ChainSamplingDesign.isPostStratificationEnabled(samplingDesign) && <PostStratificationAttributeSelector />} */}

            {ChainSamplingDesign.isFirstPhaseCommonAttributeSelectionEnabled(samplingDesign) && (
              <FirstPhaseCommonAttributeSelector />
            )}

            <ClusteringEntitySelector />
          </>
        )}
      </div>
```

With:

```jsx
      <div className="form">
        {hasBaseUnit && <SamplingDesignStrategySelector chain={chain} updateChain={updateChain} />}

        {(Chain.hasSamplingDesign(chain) || hasBaseUnit) && <BaseUnitSelector />}

        {hasBaseUnit && (
          <>
            {ChainSamplingDesign.isPhase1CategorySelectionEnabled(samplingDesign) && (
              <>
                <Phase1CategorySelector />
                <Phase2JoinEntitySelector />
                <Phase2AsSamplingPointDataSelector />
                {ChainSamplingDesign.isPhase1JoinAttributeSelectionEnabled(samplingDesign) && (
                  <Phase1JoinAttributeSelector />
                )}
                {ChainSamplingDesign.isPhase2JoinAttributeSelectionEnabled(samplingDesign) && (
                  <Phase2JoinAttributeSelector />
                )}
              </>
            )}

            {ChainSamplingDesign.isStratificationEnabled(samplingDesign) && <StratumAttributeSelector />}
            {/* {ChainSamplingDesign.isPostStratificationEnabled(samplingDesign) && <PostStratificationAttributeSelector />} */}

            <ClusteringEntitySelector />
          </>
        )}
      </div>
```

- [ ] **Step 3: Verify no stale references remain**

Run: `grep -rn "FirstPhaseCategorySelector\|FirstPhaseCategoryExtraPropSelector\|FirstPhaseCommonAttributeSelector\|isFirstPhaseCategorySelectionEnabled\|isFirstPhaseCommonAttributeSelectionEnabled\|isFirstPhaseCategoryExtraPropSelectionEnabled" webapp`
Expected: no output.

- [ ] **Step 4: Manual verification in the browser**

Run: `yarn watch`, open a survey with an existing chain (or create one), go to Analysis >
[chain] > Sampling design. Confirm:
- "Sampling strategy" now renders above "Base unit".
- Selecting "Two-Phase Sampling" (after picking a base unit and a 1st phase category)
  shows, in order: 1st phase category, Join entity (2nd phase), the linkage checkbox,
  then (checkbox unchecked) Join attribute (1st phase) and Join attribute (2nd phase).
- Checking the linkage checkbox hides both join attribute fields.
- "Join entity (2nd phase)" only lists the base unit entity and entities on its path to
  root.
- "Join attribute (2nd phase)" only lists code/text attributes belonging directly to
  whatever entity is selected as the join entity, and is empty/disabled until one is
  chosen.
- "Stratum attribute" only lists Base Unit code/computed attributes whose name matches
  an extra column (or "code") of the 1st phase category, when two-phase is selected.
- Selecting any other sampling strategy hides all of the above except Stratum attribute,
  which reverts to listing every Base Unit ancestor code attribute.

- [ ] **Step 5: Commit**

```bash
git add webapp/views/App/views/Analysis/Chain/ChainSamplingDesignProps.js
git commit -m "Reorder sampling strategy/base unit and wire up phase 2 join props UI

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 9: Server — `chainSummaryGenerator.js` R-facing summary updates

**Files:**
- Modify: `server/modules/analysis/service/chainSummaryGenerator.js`

**Interfaces:**
- Consumes: `ChainSamplingDesign.getPhase1CategoryUuid`, `getPhase2JoinEntityUuid`,
  `getPhase2JoinAttribute`, `isPhase2AsSamplingPointData`, `getPhase1JoinAttribute`,
  `isPhase1CategorySelectionEnabled`, `isPhase2JoinEntitySelectionEnabled`,
  `isPhase2AsSamplingPointDataSelectionEnabled`, `isPhase1JoinAttributeSelectionEnabled`,
  `isPhase2JoinAttributeSelectionEnabled` (Task 1).
- Produces: R-facing summary JSON keys `phase1Category`, `phase2JoinEntity`,
  `phase2AsSamplingPointData`, `phase1JoinAttribute`, `phase2JoinAttribute` /
  `phase2JoinAttributeCategory` / `phase2JoinAttributeCategoryLevel`. `phase1StratumAttribute`
  and `commonAttribute*` are removed.

- [ ] **Step 1: Rename the local variables sourcing the old props**

Replace:

```js
  const stratumAttributeDef = getNodeDefByUuid(ChainSamplingDesign.getStratumNodeDefUuid(chainSamplingDesign))
  // const postStratificationAttributeDef = getNodeDefByUuid(
  //   ChainSamplingDesign.getPostStratificationAttributeDefUuid(chainSamplingDesign)
  // )
  const firstPhaseCommonAttributeDef = getNodeDefByUuid(
    ChainSamplingDesign.getFirstPhaseCommonAttributeUuid(chainSamplingDesign)
  )
  const clusteringEntityDef = getNodeDefByUuid(ChainSamplingDesign.getClusteringNodeDefUuid(chainSamplingDesign))
```

With:

```js
  const stratumAttributeDef = getNodeDefByUuid(ChainSamplingDesign.getStratumNodeDefUuid(chainSamplingDesign))
  // const postStratificationAttributeDef = getNodeDefByUuid(
  //   ChainSamplingDesign.getPostStratificationAttributeDefUuid(chainSamplingDesign)
  // )
  const phase2JoinEntityDef = getNodeDefByUuid(ChainSamplingDesign.getPhase2JoinEntityUuid(chainSamplingDesign))
  const phase2JoinAttributeDef = getNodeDefByUuid(ChainSamplingDesign.getPhase2JoinAttribute(chainSamplingDesign))
  const clusteringEntityDef = getNodeDefByUuid(ChainSamplingDesign.getClusteringNodeDefUuid(chainSamplingDesign))
```

- [ ] **Step 2: Replace the `phase1Category`/`phase1StratumAttribute`/`commonAttribute` output block**

Replace:

```js
    ...(ChainSamplingDesign.isFirstPhaseCategorySelectionEnabled(chainSamplingDesign)
      ? {
          phase1Category: getCategoryNameByUuid({
            survey,
            categoryUuid: ChainSamplingDesign.getFirstPhaseCategoryUuid(chainSamplingDesign),
          }),
          phase1StratumAttribute: ChainSamplingDesign.getFirstPhaseCategoryExtraProp(chainSamplingDesign) ?? '',
        }
      : {}),
    ...(ChainSamplingDesign.isStratificationEnabled(chainSamplingDesign)
      ? getCodeAttributeSummary('stratumAttribute', stratumAttributeDef)
      : {}),
    ...(ChainSamplingDesign.isFirstPhaseCommonAttributeSelectionEnabled(chainSamplingDesign)
      ? getCodeAttributeSummary('commonAttribute', firstPhaseCommonAttributeDef)
      : {}),
```

With:

```js
    ...(ChainSamplingDesign.isPhase1CategorySelectionEnabled(chainSamplingDesign)
      ? {
          phase1Category: getCategoryNameByUuid({
            survey,
            categoryUuid: ChainSamplingDesign.getPhase1CategoryUuid(chainSamplingDesign),
          }),
        }
      : {}),
    ...(ChainSamplingDesign.isPhase2JoinEntitySelectionEnabled(chainSamplingDesign)
      ? { phase2JoinEntity: NodeDef.getName(phase2JoinEntityDef) }
      : {}),
    ...(ChainSamplingDesign.isPhase2AsSamplingPointDataSelectionEnabled(chainSamplingDesign)
      ? { phase2AsSamplingPointData: ChainSamplingDesign.isPhase2AsSamplingPointData(chainSamplingDesign) }
      : {}),
    ...(ChainSamplingDesign.isPhase1JoinAttributeSelectionEnabled(chainSamplingDesign)
      ? { phase1JoinAttribute: ChainSamplingDesign.getPhase1JoinAttribute(chainSamplingDesign) ?? '' }
      : {}),
    ...(ChainSamplingDesign.isStratificationEnabled(chainSamplingDesign)
      ? getCodeAttributeSummary('stratumAttribute', stratumAttributeDef)
      : {}),
    ...(ChainSamplingDesign.isPhase2JoinAttributeSelectionEnabled(chainSamplingDesign)
      ? getCodeAttributeSummary('phase2JoinAttribute', phase2JoinAttributeDef)
      : {}),
```

- [ ] **Step 3: Verify no stale references remain**

Run: `grep -n "FirstPhase\|firstPhase\|commonAttribute" server/modules/analysis/service/chainSummaryGenerator.js`
Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add server/modules/analysis/service/chainSummaryGenerator.js
git commit -m "Rename chain summary JSON keys for phase 1/2 join props

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

(No automated test exists for this generator today — verify by triggering "Download
Summary (JSON)" from the chain view in the browser for a two-phase chain, with and without
the linkage checkbox, and confirming the keys above appear/disappear as expected.)

---

## Task 10: Server — chain clone-from-survey remap updates

**Files:**
- Modify: `server/modules/analysis/manager/chain/index.js`
- Modify: `test/integration/tests/017chainCloneFromSurveyMissingEntityTest.js`

**Interfaces:**
- Consumes: `ChainSamplingDesign.keysProps.{phase1CategoryUuid, phase1JoinAttribute,
  phase2JoinEntityUuid, phase2JoinAttribute}`, `getPhase2JoinEntityUuid`,
  `getPhase2JoinAttribute` (Task 1).

- [ ] **Step 1: Update `_sanitizeChainPropsForClone`**

In `server/modules/analysis/manager/chain/index.js`, replace:

```js
      [ChainSamplingDesign.keysProps.firstPhaseCommonAttributeUuid]: remap(
        ChainSamplingDesign.getFirstPhaseCommonAttributeUuid(sourceSamplingDesign)
      ),
      // Category UUIDs are survey-specific and cannot be remapped; clear them
      [ChainSamplingDesign.keysProps.firstPhaseCategoryUuid]: undefined,
      [ChainSamplingDesign.keysProps.firstPhaseCategoryExtraProp]: undefined,
```

With:

```js
      [ChainSamplingDesign.keysProps.phase2JoinEntityUuid]: remap(
        ChainSamplingDesign.getPhase2JoinEntityUuid(sourceSamplingDesign)
      ),
      [ChainSamplingDesign.keysProps.phase2JoinAttribute]: remap(
        ChainSamplingDesign.getPhase2JoinAttribute(sourceSamplingDesign)
      ),
      // Category UUIDs are survey-specific and cannot be remapped; clear them, and the join
      // attribute that only makes sense in the context of that category
      [ChainSamplingDesign.keysProps.phase1CategoryUuid]: undefined,
      [ChainSamplingDesign.keysProps.phase1JoinAttribute]: undefined,
```

- [ ] **Step 2: Add a clone-remap test for the new/renamed keys**

In `test/integration/tests/017chainCloneFromSurveyMissingEntityTest.js`, add a new `test(...)`
block right after the existing `'Cloning with skipMissingEntityAttributes remaps chain-level
nodeDef references...'` test (i.e. as a fourth test before the "every entity is missing"
one), reusing the same `plotSrcEntity`/`sourceSurveyId`/`targetSurveyId` from that test's
scope — since it isn't shared across tests today, duplicate the same setup:

```js
  test('Cloning with skipMissingEntityAttributes remaps the phase 2 join entity/attribute and drops the phase 1 category/join attribute', async () => {
    const user = getContextUser()
    const sourceSurveyId = Survey.getId(sourceSurvey)
    const targetSurveyId = Survey.getId(targetSurvey)

    const clusterSrcEntity = Survey.findNodeDefByName('cluster_src')(sourceSurvey)
    const volumeAnalysisAttr = Survey.findNodeDefByName('volume_analysis_src')(sourceSurvey)
    const phase2ChainUuid = uuidv4()

    await ChainRepository.insertChain({
      surveyId: sourceSurveyId,
      chain: {
        uuid: phase2ChainUuid,
        props: {
          name: 'chain_phase2_join_props_src',
          [Chain.keysProps.samplingDesign]: {
            [ChainSamplingDesign.keysProps.samplingStrategy]: ChainSamplingDesign.samplingStrategies.twoPhase,
            [ChainSamplingDesign.keysProps.phase1CategoryUuid]: 'category-uuid',
            [ChainSamplingDesign.keysProps.phase1JoinAttribute]: 'design_psu',
            [ChainSamplingDesign.keysProps.phase2JoinEntityUuid]: NodeDef.getUuid(clusterSrcEntity),
            [ChainSamplingDesign.keysProps.phase2JoinAttribute]: NodeDef.getUuid(volumeAnalysisAttr),
          },
        },
      },
    })

    const clonedChain = await AnalysisManager.cloneChainFromSurvey({
      user,
      surveyId: targetSurveyId,
      sourceSurveyId,
      sourceChainUuid: phase2ChainUuid,
      skipMissingEntityAttributes: true,
    })

    const clonedSamplingDesign = Chain.getSamplingDesign(clonedChain)
    expect(ChainSamplingDesign.getPhase1CategoryUuid(clonedSamplingDesign)).toBeUndefined()
    expect(ChainSamplingDesign.getPhase1JoinAttribute(clonedSamplingDesign)).toBeUndefined()
    // "cluster_src" and its analysis attribute both exist in the target survey by name, so they remap
    const targetClusterSrcEntity = Survey.findNodeDefByName('cluster_src')(targetSurvey)
    expect(ChainSamplingDesign.getPhase2JoinEntityUuid(clonedSamplingDesign)).toBe(NodeDef.getUuid(targetClusterSrcEntity))
    const targetVolumeAnalysisAttr = Survey.findNodeDefByName('volume_analysis_src')(targetSurvey)
    expect(ChainSamplingDesign.getPhase2JoinAttribute(clonedSamplingDesign)).toBe(NodeDef.getUuid(targetVolumeAnalysisAttr))
  })
```

Note: `volume_analysis_src` is an analysis attribute cloned by the earlier test in this same
file onto the target survey's `cluster_src` (see the second `test(...)` block) — since Jest
runs tests in file order within a `describe`, by the time this new test runs the target
survey already has that attribute, so `remap` can resolve it by name. Place this new test
after the existing "Cloning with skipMissingEntityAttributes clones only attributes..." test
and before/after the base-unit remap test — order relative to the base-unit test doesn't
matter, but it must come after the attribute-cloning test.

- [ ] **Step 3: Run the integration test**

This requires a configured Postgres database (see `test/integration` setup in the repo's
CI/dev docs) — skip if none is available locally and rely on CI.

Run: `yarn build:test:integration && jest dist/__tests__/bundle.integration.js -t "chain-level nodeDef references|phase 2 join entity"`
Expected: PASS for both the pre-existing base-unit remap test and the new phase-2 test.

- [ ] **Step 4: Commit**

```bash
git add server/modules/analysis/manager/chain/index.js test/integration/tests/017chainCloneFromSurveyMissingEntityTest.js
git commit -m "Update chain clone remap for renamed/new sampling design phase props

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 11: Server — startup migration for existing chains

**Files:**
- Modify: `server/modules/analysis/manager/chain/index.js`
- Modify: `server/modules/analysis/manager/index.js`
- Modify: `server/modules/survey/service/dataMigration/surveyDataMigrationSteps.js`
- Create: `test/integration/tests/046chainSamplingDesignMigrationTest.js`

**Interfaces:**
- Consumes: `ChainRepository.{fetchChains,updateChain}`, `Chain.{getSamplingDesign,getUuid,keysProps}`,
  `ChainSamplingDesign.keysProps.{phase1CategoryUuid,phase1JoinAttribute,phase2JoinAttribute,phase2JoinEntityUuid,phase2AsSamplingPointData}`
  (Task 1), `TableChain.columnSet.props`, `SurveyManager.fetchSurveyAndNodeDefsBySurveyId`,
  `Survey.{getNodeDefByUuid,getNodeDefParent}`, `NodeDef.getUuid`.
- Produces: `migrateSamplingDesignPhaseProps({ surveyId }, client)`, exported from both
  `server/modules/analysis/manager/chain/index.js` and the `server/modules/analysis/manager`
  barrel, called from the new `surveyDataMigrationSteps.js` entry.

- [ ] **Step 1: Add the migration function to the chain manager**

In `server/modules/analysis/manager/chain/index.js`, add this block right after the
`updateChainStatusExec` export (before `persistChain`):

```js
// ====== MIGRATION

const oldSamplingDesignPhasePropKeys = {
  firstPhaseCategoryUuid: 'firstPhaseCategoryUuid',
  firstPhaseCategoryExtraProp: 'firstPhaseCategoryExtraProp',
  firstPhaseCommonAttributeUuid: 'firstPhaseCommonAttributeUuid',
}

const _migrateSamplingDesignPhaseProps = ({ samplingDesign, survey }) => {
  const migrated = { ...samplingDesign }

  if (oldSamplingDesignPhasePropKeys.firstPhaseCategoryUuid in migrated) {
    migrated[ChainSamplingDesign.keysProps.phase1CategoryUuid] =
      migrated[oldSamplingDesignPhasePropKeys.firstPhaseCategoryUuid]
    delete migrated[oldSamplingDesignPhasePropKeys.firstPhaseCategoryUuid]
  }
  if (oldSamplingDesignPhasePropKeys.firstPhaseCategoryExtraProp in migrated) {
    migrated[ChainSamplingDesign.keysProps.phase1JoinAttribute] =
      migrated[oldSamplingDesignPhasePropKeys.firstPhaseCategoryExtraProp]
    delete migrated[oldSamplingDesignPhasePropKeys.firstPhaseCategoryExtraProp]
  }
  if (oldSamplingDesignPhasePropKeys.firstPhaseCommonAttributeUuid in migrated) {
    const attributeUuid = migrated[oldSamplingDesignPhasePropKeys.firstPhaseCommonAttributeUuid]
    migrated[ChainSamplingDesign.keysProps.phase2JoinAttribute] = attributeUuid
    delete migrated[oldSamplingDesignPhasePropKeys.firstPhaseCommonAttributeUuid]

    const attributeNodeDef = Survey.getNodeDefByUuid(attributeUuid)(survey)
    const parentEntity = attributeNodeDef ? Survey.getNodeDefParent(attributeNodeDef)(survey) : null
    if (parentEntity) {
      migrated[ChainSamplingDesign.keysProps.phase2JoinEntityUuid] = NodeDef.getUuid(parentEntity)
    }
    migrated[ChainSamplingDesign.keysProps.phase2AsSamplingPointData] = false
  }

  return migrated
}

/**
 * Migrates every chain in the given survey from the old sampling design phase prop names
 * (firstPhaseCategoryUuid, firstPhaseCategoryExtraProp, firstPhaseCommonAttributeUuid) to the
 * current ones (phase1CategoryUuid, phase1JoinAttribute, phase2JoinAttribute), backfilling
 * phase2JoinEntityUuid from the previously selected common attribute's parent entity.
 * Chains without any of the old keys are left untouched.
 *
 * @param {object} params - Parameters.
 * @param {number} params.surveyId - The survey id.
 * @param {pgPromise.IDatabase} [client=db] - The database client.
 * @returns {Promise<void>} Resolves when every chain needing migration has been updated.
 */
export const migrateSamplingDesignPhaseProps = async ({ surveyId }, client = DB.client) => {
  const chains = await ChainRepository.fetchChains({ surveyId }, client)

  const chainsToMigrate = chains.filter((chain) => {
    const samplingDesign = Chain.getSamplingDesign(chain)
    return Object.values(oldSamplingDesignPhasePropKeys).some((oldKey) => oldKey in samplingDesign)
  })
  if (chainsToMigrate.length === 0) return

  const survey = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId(
    { surveyId, draft: true, advanced: true, includeAnalysis: true },
    client
  )

  for (const chain of chainsToMigrate) {
    const samplingDesign = Chain.getSamplingDesign(chain)
    const migratedSamplingDesign = _migrateSamplingDesignPhaseProps({ samplingDesign, survey })
    await ChainRepository.updateChain(
      {
        surveyId,
        chainUuid: Chain.getUuid(chain),
        fields: { [TableChain.columnSet.props]: { [Chain.keysProps.samplingDesign]: migratedSamplingDesign } },
      },
      client
    )
  }
}
```

This uses `Survey`, `NodeDef`, `DB`, `TableChain`, `Chain`, `ChainSamplingDesign`,
`SurveyManager`, and `ChainRepository`, all of which are already imported at the top of this
file — no new imports needed.

- [ ] **Step 2: Export it from the manager barrel**

In `server/modules/analysis/manager/index.js`, replace:

```js
// ====== Chain
export {
  create,
  countChains,
  fetchChains,
  fetchChain,
  updateChain,
  updateChainStatusExec,
  deleteChain,
  cloneChainFromSurvey,
  fetchChainsForCloneFromSurvey,
  fetchChainSourceEntityNames,
} from './chain'
```

With:

```js
// ====== Chain
export {
  create,
  countChains,
  fetchChains,
  fetchChain,
  updateChain,
  updateChainStatusExec,
  deleteChain,
  cloneChainFromSurvey,
  fetchChainsForCloneFromSurvey,
  fetchChainSourceEntityNames,
  migrateSamplingDesignPhaseProps,
} from './chain'
```

- [ ] **Step 3: Wire the migration step**

In `server/modules/survey/service/dataMigration/surveyDataMigrationSteps.js`, add the import:

```js
import * as ChainManager from '@server/modules/analysis/manager'
```

right after the existing `import * as CategoryManager from '@server/modules/category/manager/categoryManager'`
line, and append a new entry to `surveyDataMigrationSteps` (replace the trailing comment
line):

```js
  {
    version: '2.8.3',
    migrate: async ({ surveyId, client }) => {
      await ChainManager.migrateSamplingDesignPhaseProps({ surveyId }, client)
    },
  },
  // future per-survey migration steps are appended here, each with its own version threshold
]
```

(i.e. insert this object before the closing `]` and its trailing comment, right after the
existing `2.7.2` step.)

- [ ] **Step 4: Write the integration test**

Create `test/integration/tests/046chainSamplingDesignMigrationTest.js`:

```js
import { uuidv4 } from '@core/uuid'
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Chain from '@common/analysis/chain'
import { ChainSamplingDesign } from '@common/analysis/chainSamplingDesign'

import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as ChainRepository from '@server/modules/analysis/repository/chain'
import * as AnalysisManager from '@server/modules/analysis/manager'

import * as SB from '../../utils/surveyBuilder'

import { getContextUser } from '../config/context'

const { nodeDefType } = NodeDef

describe('Chain sampling design phase props migration', () => {
  let survey
  let chainWithOldPropsUuid
  let chainWithCategoryOnlyUuid
  let chainWithoutOldPropsUuid
  let commonAttributeUuid
  let plotEntityUuid

  beforeAll(async () => {
    const user = getContextUser()

    survey = await SB.survey(
      user,
      SB.entity(
        'cluster',
        SB.attribute('cluster_id', nodeDefType.integer).key(),
        SB.entity(
          'plot',
          SB.attribute('plot_id', nodeDefType.integer).key(),
          SB.attribute('plot_code', nodeDefType.code)
        ).multiple()
      )
    ).buildAndStore()

    const plotCodeDef = Survey.findNodeDefByName('plot_code')(survey)
    commonAttributeUuid = NodeDef.getUuid(plotCodeDef)
    plotEntityUuid = NodeDef.getUuid(Survey.findNodeDefByName('plot')(survey))

    const surveyId = Survey.getId(survey)

    chainWithOldPropsUuid = uuidv4()
    await ChainRepository.insertChain({
      surveyId,
      chain: {
        uuid: chainWithOldPropsUuid,
        props: {
          name: 'chain_with_old_props',
          [Chain.keysProps.samplingDesign]: {
            samplingStrategy: ChainSamplingDesign.samplingStrategies.twoPhase,
            firstPhaseCategoryUuid: 'category-uuid-1',
            firstPhaseCategoryExtraProp: 'design_psu',
            firstPhaseCommonAttributeUuid: commonAttributeUuid,
          },
        },
      },
    })

    chainWithCategoryOnlyUuid = uuidv4()
    await ChainRepository.insertChain({
      surveyId,
      chain: {
        uuid: chainWithCategoryOnlyUuid,
        props: {
          name: 'chain_with_category_only',
          [Chain.keysProps.samplingDesign]: {
            samplingStrategy: ChainSamplingDesign.samplingStrategies.twoPhase,
            firstPhaseCategoryUuid: 'category-uuid-2',
            firstPhaseCategoryExtraProp: 'design_psu_2',
          },
        },
      },
    })

    chainWithoutOldPropsUuid = uuidv4()
    await ChainRepository.insertChain({
      surveyId,
      chain: {
        uuid: chainWithoutOldPropsUuid,
        props: {
          name: 'chain_without_old_props',
          [Chain.keysProps.samplingDesign]: {
            samplingStrategy: ChainSamplingDesign.samplingStrategies.simpleRandom,
          },
        },
      },
    })

    await AnalysisManager.migrateSamplingDesignPhaseProps({ surveyId })
  })

  afterAll(async () => {
    if (survey) await SurveyManager.deleteSurvey(Survey.getId(survey))
  })

  test('migrates a chain with all three old props, backfilling the join entity from the common attribute parent', async () => {
    const migratedChain = await ChainRepository.fetchChain({
      surveyId: Survey.getId(survey),
      chainUuid: chainWithOldPropsUuid,
    })
    const samplingDesign = Chain.getSamplingDesign(migratedChain)

    expect(ChainSamplingDesign.getPhase1CategoryUuid(samplingDesign)).toBe('category-uuid-1')
    expect(ChainSamplingDesign.getPhase1JoinAttribute(samplingDesign)).toBe('design_psu')
    expect(ChainSamplingDesign.getPhase2JoinAttribute(samplingDesign)).toBe(commonAttributeUuid)
    expect(ChainSamplingDesign.getPhase2JoinEntityUuid(samplingDesign)).toBe(plotEntityUuid)
    expect(ChainSamplingDesign.isPhase2AsSamplingPointData(samplingDesign)).toBe(false)
    expect(samplingDesign.firstPhaseCategoryUuid).toBeUndefined()
    expect(samplingDesign.firstPhaseCategoryExtraProp).toBeUndefined()
    expect(samplingDesign.firstPhaseCommonAttributeUuid).toBeUndefined()
  })

  test('migrates a chain with only the category props set, leaving the join entity unset', async () => {
    const migratedChain = await ChainRepository.fetchChain({
      surveyId: Survey.getId(survey),
      chainUuid: chainWithCategoryOnlyUuid,
    })
    const samplingDesign = Chain.getSamplingDesign(migratedChain)

    expect(ChainSamplingDesign.getPhase1CategoryUuid(samplingDesign)).toBe('category-uuid-2')
    expect(ChainSamplingDesign.getPhase1JoinAttribute(samplingDesign)).toBe('design_psu_2')
    expect(ChainSamplingDesign.getPhase2JoinEntityUuid(samplingDesign)).toBeUndefined()
  })

  test('leaves a chain without any old props untouched', async () => {
    const migratedChain = await ChainRepository.fetchChain({
      surveyId: Survey.getId(survey),
      chainUuid: chainWithoutOldPropsUuid,
    })
    const samplingDesign = Chain.getSamplingDesign(migratedChain)

    expect(samplingDesign).toEqual({ samplingStrategy: ChainSamplingDesign.samplingStrategies.simpleRandom })
  })
})
```

- [ ] **Step 5: Run the integration test**

Requires a configured Postgres database — skip if none is available locally and rely on CI.

Run: `yarn build:test:integration && jest dist/__tests__/bundle.integration.js -t "Chain sampling design phase props migration"`
Expected: PASS (all three tests).

Note: adding a third entry to `surveyDataMigrationSteps` breaks two pre-existing unit tests
that hard-code the step count/latest version —
`test/unit/tests/039surveyDataMigrationSteps.test.js` (`toHaveLength(2)`, `'2.7.2'`) and
`test/unit/tests/040surveyDataMigrationJob.test.js` (`toHaveLength(2)`, the version list).
Update both to reflect 3 steps and versions `['2.3.20', '2.7.2', '2.8.3']` /
`latestSurveyDataMigrationVersion === '2.8.3'` as part of this step.

Also note: the test fixture's `plot_code` code-type attribute needs `.category('plot_code_cat')`
(plus a `.categories(SB.category('plot_code_cat').levels('level1').items(...))` builder call on
the survey) — a code-type node def can't be published in this codebase without an assigned
category (see `core/survey/_surveyValidator/nodeDefValidator.js`), and the same pattern is
already used in `test/integration/tests/011chainCloneFromSurveyCategoryTest.js`.

- [ ] **Step 6: Commit**

```bash
git add server/modules/analysis/manager/chain/index.js server/modules/analysis/manager/index.js server/modules/survey/service/dataMigration/surveyDataMigrationSteps.js test/integration/tests/046chainSamplingDesignMigrationTest.js test/unit/tests/039surveyDataMigrationSteps.test.js test/unit/tests/040surveyDataMigrationJob.test.js
git commit -m "Add startup migration for chain sampling design phase props

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Final check (after Task 11)

- [ ] Run `grep -rn "firstPhaseCategoryUuid\|firstPhaseCategoryExtraProp\|firstPhaseCommonAttributeUuid\|FirstPhaseCategorySelector\|FirstPhaseCategoryExtraPropSelector\|FirstPhaseCommonAttributeSelector" common core server webapp test --include=*.js`
  Expected: no output outside of the new migration function's own `oldSamplingDesignPhasePropKeys`
  literal strings and the new integration test's literal old-key usage in
  `046chainSamplingDesignMigrationTest.js` (both are intentional — they describe the shape of
  *old*, pre-migration data).
- [ ] Run the full unit suite: `yarn build:test:unit && jest dist/__tests__/bundle.unit.js`
- [ ] Run lint on every touched file: `npx eslint --cache --fix <touched files>`
