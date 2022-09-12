import * as A from '@core/arena'
import { Objects } from '@openforis/arena-core'

const keysProps = {
  areaWeightingMethod: 'areaWeightingMethod',
  baseUnitNodeDefUuid: 'baseUnitNodeDefUuid',
  clusteringNodeDefUuid: 'clusteringNodeDefUuid',
  clusteringOnlyVariances: 'clusteringOnlyVariances',
  nonResponseBiasCorrection: 'nonResponseBiasCorrection',
  postStratificationAttributeDefUuid: 'postStratificationAttributeDefUuid',
  pValue: 'pValue',
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
  // doublePhase: 'doublePhase'
}

const pValues = [0.99, 0.98, 0.95, 0.9, 0.8]
const pValueDefault = 0.95

const isPropTrue = (prop) => (obj) => A.prop(prop)(obj) === true

const isAreaWeightingMethod = isPropTrue(keysProps.areaWeightingMethod)
const getBaseUnitNodeDefUuid = A.prop(keysProps.baseUnitNodeDefUuid)
const getClusteringNodeDefUuid = A.prop(keysProps.clusteringNodeDefUuid)
const isClusteringOnlyVariances = isPropTrue(keysProps.clusteringOnlyVariances)
const isNonResponseBiasCorrection = isPropTrue(keysProps.nonResponseBiasCorrection)
const getPostStratificationAttributeDefUuid = A.prop(keysProps.postStratificationAttributeDefUuid)
const getPValue = A.propOr(pValueDefault, keysProps.pValue)
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

// UPDATE

const assocBaseUnitNodeDefUuid = (baseUnitNodeDefUuid) => A.assoc(keysProps.baseUnitNodeDefUuid, baseUnitNodeDefUuid)

const assocAreaWeightingMethod = (areaWeightingMethod) => A.assoc(keysProps.areaWeightingMethod, areaWeightingMethod)

const assocClusteringNodeDefUuid = (clusteringNodeDefUuid) =>
  A.assoc(keysProps.clusteringNodeDefUuid, clusteringNodeDefUuid)

const assocClusteringOnlyVariances = (clusteringOnlyVariances) =>
  A.assoc(keysProps.clusteringOnlyVariances, clusteringOnlyVariances)

const assocPostStratificationAttributeDefUuid = (postStratificationAttributeDefUuid) =>
  A.assoc(keysProps.postStratificationAttributeDefUuid, postStratificationAttributeDefUuid)

const resetPostStratificationAttributeDefUuid = assocPostStratificationAttributeDefUuid(null)

const assocStratumNodeDefUuid = (stratumNodeDefUuid) => (samplingDesign) => {
  let samplingDesignUpdated = A.assoc(keysProps.stratumNodeDefUuid, stratumNodeDefUuid)(samplingDesign)
  if (getPostStratificationAttributeDefUuid(samplingDesignUpdated) === stratumNodeDefUuid) {
    samplingDesignUpdated = assocPostStratificationAttributeDefUuid(null)(samplingDesignUpdated)
  }
  return samplingDesignUpdated
}
const resetStratumNodeDefUuid = assocStratumNodeDefUuid(null)

const assocNonResponseBiasCorrection = (nonResponseBiasCorrection) =>
  A.assoc(keysProps.nonResponseBiasCorrection, nonResponseBiasCorrection)

const assocPValue = (pValue) => A.assoc(keysProps.pValue, pValue)
const resetPValue = assocPValue(null)

const assocSamplingStrategy = (samplingStrategy) => (samplingDesign) => {
  let samplingDesignUpdated = A.assoc(keysProps.samplingStrategy, samplingStrategy)(samplingDesign)
  if (!isStratificationEnabled(samplingDesignUpdated) && getStratumNodeDefUuid(samplingDesignUpdated)) {
    samplingDesignUpdated = resetStratumNodeDefUuid(samplingDesignUpdated)
  }
  if (
    !isPostStratificationEnabled(samplingDesignUpdated) &&
    getPostStratificationAttributeDefUuid(samplingDesignUpdated)
  ) {
    samplingDesignUpdated = resetPostStratificationAttributeDefUuid(samplingDesignUpdated)
  }
  if (!samplingStrategy) {
    samplingDesignUpdated = resetPValue(samplingDesignUpdated)
  }
  return samplingDesignUpdated
}

const dissocReportingDataAttributeDefsByLevelUuid = A.dissoc(keysProps.reportingDataAttributeDefsByLevelUuid)
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
  pValues,
  samplingStrategies,

  // READ
  getBaseUnitNodeDefUuid,
  isAreaWeightingMethod,
  getClusteringNodeDefUuid,
  isClusteringOnlyVariances,
  isNonResponseBiasCorrection,
  isPostStratificationEnabled,
  isStratificationEnabled,
  isStratificationNotSpecifiedAllowed,
  getPostStratificationAttributeDefUuid,
  getPValue,
  getReportingDataAttributeDefUuid,
  getReportingDataCategoryUuid,
  getSamplingStrategy,
  getStratumNodeDefUuid,

  // UPDATE
  assocAreaWeightingMethod,
  assocBaseUnitNodeDefUuid,
  assocClusteringNodeDefUuid,
  assocClusteringOnlyVariances,
  assocNonResponseBiasCorrection,
  assocPValue,
  assocPostStratificationAttributeDefUuid,
  assocReportingDataCategoryUuid,
  assocReportingDataAttributeDefUuid,
  assocSamplingStrategy,
  assocStratumNodeDefUuid,
}
