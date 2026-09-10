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
  if (!isPhase1CategorySelectionEnabled(samplingDesignUpdated) && getPhase1CategoryUuid(samplingDesignUpdated)) {
    samplingDesignUpdated = dissocPhase1CategoryUuid(samplingDesignUpdated)
  }
  if (!isPhase2JoinEntitySelectionEnabled(samplingDesignUpdated) && getPhase2JoinEntityUuid(samplingDesignUpdated)) {
    samplingDesignUpdated = dissocPhase2JoinEntityUuid(samplingDesignUpdated)
  }
  if (
    getSamplingStrategy(samplingDesignUpdated) &&
    !isPhase2AsSamplingPointDataSelectionEnabled(samplingDesignUpdated) &&
    isPhase2AsSamplingPointData(samplingDesignUpdated)
  ) {
    samplingDesignUpdated = dissocPhase2AsSamplingPointData(samplingDesignUpdated)
  }
  if (!isPhase1JoinAttributeSelectionEnabled(samplingDesignUpdated) && getPhase1JoinAttribute(samplingDesignUpdated)) {
    samplingDesignUpdated = dissocPhase1JoinAttribute(samplingDesignUpdated)
  }
  if (!isPhase2JoinAttributeSelectionEnabled(samplingDesignUpdated) && getPhase2JoinAttribute(samplingDesignUpdated)) {
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
