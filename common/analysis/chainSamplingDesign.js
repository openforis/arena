import { Objects } from '@openforis/arena-core'

import * as A from '@core/arena'
import * as Category from '@core/survey/category'
import * as NodeDef from '@core/survey/nodeDef'
import * as Survey from '@core/survey/survey'

const keysProps = {
  areaWeightingMethod: 'areaWeightingMethod',
  baseUnitNodeDefUuid: 'baseUnitNodeDefUuid',
  clusteringNodeDefUuid: 'clusteringNodeDefUuid',
  firstPhaseCategoryExtraProp: 'firstPhaseCategoryExtraProp',
  firstPhaseCategoryUuid: 'firstPhaseCategoryUuid',
  firstPhaseCommonAttributeUuid: 'firstPhaseCommonAttributeUuid',
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
const getFirstPhaseCategoryExtraProp = A.prop(keysProps.firstPhaseCategoryExtraProp)
const getFirstPhaseCategoryUuid = A.prop(keysProps.firstPhaseCategoryUuid)
const getFirstPhaseCommonAttributeUuid = A.prop(keysProps.firstPhaseCommonAttributeUuid)
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

const isFirstPhaseCategorySelectionEnabled = (samplingDesign) =>
  getSamplingStrategy(samplingDesign) === samplingStrategies.twoPhase

const isFirstPhaseCategoryExtraPropSelectionEnabled = isFirstPhaseCategorySelectionEnabled

const isFirstPhaseCommonAttributeSelectionEnabled = isFirstPhaseCategorySelectionEnabled

// Detects whether the base unit's own key attribute is a code attribute drawn from the
// sampling_point_data category - in that case the base unit's key IS the sampling-point-data
// item, so the join between the base unit and Phase-1 tables is inherently given by that key
// and no explicit join attribute is needed or shown (per the user's explicit design choice:
// this check is intentionally limited to the base unit's key, not the Phase-1 category).
const isFirstPhaseSamplingPointDataJoinMethod = ({ survey, baseUnitNodeDef }) => {
  if (!baseUnitNodeDef) return false
  return Survey.getNodeDefKeys(baseUnitNodeDef)(survey).some(
    (keyAttrDef) =>
      NodeDef.isCode(keyAttrDef) &&
      Category.isSamplingPointDataCategory(Survey.getCategoryByUuid(NodeDef.getCategoryUuid(keyAttrDef))(survey))
  )
}

// Whether the "Common attribute" selector should be shown AND is required: true only for
// two-phase sampling with a base unit selected, where the automatic sampling-point-data
// method does NOT apply. Requires baseUnitNodeDef so that clearing the base unit (which hides
// the selector in the UI) can never leave the chain in an unsatisfiable invalid state.
const isFirstPhaseCommonAttributeRequired = ({ samplingDesign, survey, baseUnitNodeDef }) =>
  isFirstPhaseCategorySelectionEnabled(samplingDesign) &&
  Boolean(baseUnitNodeDef) &&
  !isFirstPhaseSamplingPointDataJoinMethod({ survey, baseUnitNodeDef })

// UPDATE

const dissocFirstPhaseCategoryExtraProp = A.dissoc(keysProps.firstPhaseCategoryExtraProp)
const dissocFirstPhaseCategoryUuid = A.dissoc(keysProps.firstPhaseCategoryUuid)
const dissocFirstPhaseCommonAttributeUuid = A.dissoc(keysProps.firstPhaseCommonAttributeUuid)
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
  if (!isFirstPhaseCategorySelectionEnabled(samplingDesignUpdated)) {
    samplingDesignUpdated = dissocFirstPhaseCategoryUuid(samplingDesignUpdated)
  }
  if (!isFirstPhaseCategoryExtraPropSelectionEnabled(samplingDesignUpdated)) {
    samplingDesignUpdated = dissocFirstPhaseCategoryExtraProp(samplingDesignUpdated)
  }
  if (!isFirstPhaseCommonAttributeSelectionEnabled(samplingDesignUpdated)) {
    samplingDesignUpdated = dissocFirstPhaseCommonAttributeUuid(samplingDesignUpdated)
  }
  return samplingDesignUpdated
}

const assocBaseUnitNodeDefUuid = (baseUnitNodeDefUuid) => A.assoc(keysProps.baseUnitNodeDefUuid, baseUnitNodeDefUuid)

const assocAreaWeightingMethod = (areaWeightingMethod) => A.assoc(keysProps.areaWeightingMethod, areaWeightingMethod)

const assocClusteringNodeDefUuid = (clusteringNodeDefUuid) =>
  A.assoc(keysProps.clusteringNodeDefUuid, clusteringNodeDefUuid)

const assocFirstPhaseCategoryUuid = (firstPhaseCategoryUuid) =>
  A.pipe(
    dissocFirstPhaseCommonAttributeUuid,
    dissocFirstPhaseCategoryExtraProp,
    A.assoc(keysProps.firstPhaseCategoryUuid, firstPhaseCategoryUuid)
  )

const assocFirstPhaseCategoryExtraProp = (firstPhaseCategoryExtraProp) =>
  A.assoc(keysProps.firstPhaseCategoryExtraProp, firstPhaseCategoryExtraProp)

const assocFirstPhaseCommonAttributeUuid = (firstPhaseCommonAttributeUuid) =>
  A.assoc(keysProps.firstPhaseCommonAttributeUuid, firstPhaseCommonAttributeUuid)

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
  getFirstPhaseCategoryExtraProp,
  getFirstPhaseCategoryUuid,
  getFirstPhaseCommonAttributeUuid,
  isPostStratificationEnabled,
  getReportingDataAttributeDefUuid,
  getReportingDataCategoryUuid,
  isFirstPhaseCategoryExtraPropSelectionEnabled,
  isFirstPhaseCategorySelectionEnabled,
  isFirstPhaseCommonAttributeRequired,
  isFirstPhaseSamplingPointDataJoinMethod,
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
}
