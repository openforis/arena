import * as A from '@core/arena'

const keysProps = {
  areaWeightingMethod: 'areaWeightingMethod',
  baseUnitNodeDefUuid: 'baseUnitNodeDefUuid',
  clusteringNodeDefUuid: 'clusteringNodeDefUuid',
  postStratificationAttributeDefUuid: 'postStratificationAttributeDefUuid',
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

const isPropTrue = (prop) => (obj) => A.prop(prop)(obj) === true

const isAreaWeightingMethod = isPropTrue(keysProps.areaWeightingMethod)
const getBaseUnitNodeDefUuid = A.prop(keysProps.baseUnitNodeDefUuid)
const getClusteringNodeDefUuid = A.prop(keysProps.clusteringNodeDefUuid)
const getPostStratificationAttributeDefUuid = A.prop(keysProps.postStratificationAttributeDefUuid)
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
  return samplingDesignUpdated
}

export const ChainSamplingDesign = {
  keysProps,
  samplingStrategies,

  // READ
  getBaseUnitNodeDefUuid,
  isAreaWeightingMethod,
  getClusteringNodeDefUuid,
  isPostStratificationEnabled,
  isStratificationEnabled,
  isStratificationNotSpecifiedAllowed,
  getPostStratificationAttributeDefUuid,
  getSamplingStrategy,
  getStratumNodeDefUuid,

  // UPDATE
  assocAreaWeightingMethod,
  assocBaseUnitNodeDefUuid,
  assocClusteringNodeDefUuid,
  assocPostStratificationAttributeDefUuid,
  assocSamplingStrategy,
  assocStratumNodeDefUuid,
}
