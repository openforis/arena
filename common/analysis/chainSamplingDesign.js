import { Objects } from '@openforis/arena-core'

import * as A from '@core/arena'

const keysProps = {
  areaWeightingMethod: 'areaWeightingMethod',
  baseUnitNodeDefUuid: 'baseUnitNodeDefUuid',
  clusteringNodeDefUuid: 'clusteringNodeDefUuid',
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

const isFirstPhaseCommonAttributeSelectionEnabled = isFirstPhaseCategorySelectionEnabled

// UPDATE

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
  A.pipe(dissocFirstPhaseCommonAttributeUuid, A.assoc(keysProps.firstPhaseCategoryUuid, firstPhaseCategoryUuid))

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
  getFirstPhaseCategoryUuid,
  getFirstPhaseCommonAttributeUuid,
  isPostStratificationEnabled,
  getReportingDataAttributeDefUuid,
  getReportingDataCategoryUuid,
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
  assocFirstPhaseCategoryUuid,
  assocFirstPhaseCommonAttributeUuid,
  assocPostStratificationAttributeDefUuid,
  assocReportingDataCategoryUuid,
  assocReportingDataAttributeDefUuid,
  assocSamplingStrategy,
  assocStratumNodeDefUuid,
}
