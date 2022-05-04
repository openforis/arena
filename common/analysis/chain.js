import * as R from 'ramda'

import * as ObjectUtils from '@core/objectUtils'
import * as DateUtils from '@core/dateUtils'
import * as Validation from '@core/validation/validation'

export const keys = {
  dateCreated: ObjectUtils.keys.dateCreated,
  dateExecuted: 'dateExecuted',
  dateModified: ObjectUtils.keys.dateModified,
  props: ObjectUtils.keys.props,
  statusExec: 'status_exec',
  uuid: ObjectUtils.keys.uuid,
  temporary: ObjectUtils.keys.temporary,
  validation: Validation.keys.validation,
  scriptCommon: 'script_common',
}

export const keysProps = {
  labels: ObjectUtils.keysProps.labels,
  descriptions: ObjectUtils.keysProps.descriptions,
  cycles: ObjectUtils.keysProps.cycles,
  samplingDesign: 'samplingDesign',
  analysisNodeDefs: 'analysisNodeDefs',
  stratumNodeDefUuid: 'stratumNodeDefUuid',
  areaWeightingMethod: 'areaWeightingMethod',
  clusteringNodeDefUuid: 'clusteringNodeDefUuid',
  clusteringOnlyVariances: 'clusteringOnlyVariances',
  reportingDataCategoryUuid: 'reportingDataCategoryUuid',
  reportingDataAttributeDefsByLevelUuid: 'reportingDataAttributeDefsByLevelUuid',
  samplingStrategy: 'samplingStrategy',
  postStratificationAttributeDefUuid: 'postStratificationAttributeDefUuid',
}

export const statusExec = {
  error: 'error',
  success: 'success',
  running: 'running',
}

export const samplingStrategies = {
  simpleRandom: 'simpleRandom',
  systematic: 'systematic',
  stratifiedRandom: 'stratifiedRandom',
  stratifiedSystematic: 'stratifiedSystematic',
  // doublePhase: 'doublePhase'
}

// ====== READ

export const {
  getUuid,
  getProps,
  getPropsDiff,
  getCycles,
  getDateCreated,
  getDateModified,
  getDescriptions,
  getDescription,
  getLabels,
  getLabel,
  isTemporary,
} = ObjectUtils
export const getDateExecuted = ObjectUtils.getDate(keys.dateExecuted)
export const getStatusExec = R.propOr(null, keys.statusExec)
export const getScriptCommon = R.propOr(null, keys.scriptCommon)
export const isSamplingDesign = ObjectUtils.isPropTrue(keysProps.samplingDesign)
export const getStratumNodeDefUuid = ObjectUtils.getProp(keysProps.stratumNodeDefUuid)
export const isAreaWeightingMethod = ObjectUtils.isPropTrue(keysProps.areaWeightingMethod)
export const getClusteringNodeDefUuid = ObjectUtils.getProp(keysProps.clusteringNodeDefUuid)
export const isClusteringOnlyVariances = ObjectUtils.isPropTrue(keysProps.clusteringOnlyVariances)
export const getSamplingStrategy = ObjectUtils.getProp(keysProps.samplingStrategy)
export const getPostStratificationAttributeDefUuid = ObjectUtils.getProp(keysProps.postStratificationAttributeDefUuid)
// ====== READ (reporting data)
export const getReportingDataCategoryUuid = ObjectUtils.getProp(keysProps.reportingDataCategoryUuid)
export const getReportingDataAttributeDefUuid = ({ categoryLevelUuid }) =>
  R.pathOr(null, [keys.props, keysProps.reportingDataAttributeDefsByLevelUuid, categoryLevelUuid])

// ====== UPDATE
export const assocSamplingDesign = (samplingDesign) => ObjectUtils.setProp(keysProps.samplingDesign, samplingDesign)
export const assocStratumNodeDefUuid = (stratumNodeDefUuid) =>
  ObjectUtils.setProp(keysProps.stratumNodeDefUuid, stratumNodeDefUuid)
export const dissocStratumNodeDefUuid = ObjectUtils.dissocProp(keysProps.stratumNodeDefUuid)
export const assocAreaWeightingMethod = (areaWeightingMethod) =>
  ObjectUtils.setProp(keysProps.areaWeightingMethod, areaWeightingMethod)
export const assocClusteringNodeDefUuid = (clusteringNodeDefUuid) =>
  ObjectUtils.setProp(keysProps.clusteringNodeDefUuid, clusteringNodeDefUuid)
export const assocClusteringOnlyVariances = (clusteringOnlyVariances) =>
  ObjectUtils.setProp(keysProps.clusteringOnlyVariances, clusteringOnlyVariances)
export const assocPostStratificationAttributeDefUuid = (postStratificationAttributeDefUuid) =>
  ObjectUtils.setProp(keysProps.postStratificationAttributeDefUuid, postStratificationAttributeDefUuid)
export const dissocPostStratificationAttributeDefUuid = ObjectUtils.dissocProp(
  keysProps.postStratificationAttributeDefUuid
)
export const assocSamplingStrategy = (samplingStrategy) => (chain) => {
  let chainUpdated = ObjectUtils.setProp(keysProps.samplingStrategy, samplingStrategy)(chain)
  if (!isStratificationEnabled(chainUpdated)) {
    chainUpdated = dissocStratumNodeDefUuid(chainUpdated)
  }
  if (!isPostStratificationEnabled(chainUpdated)) {
    chainUpdated = dissocPostStratificationAttributeDefUuid(chainUpdated)
  }
  return chainUpdated
}

// ====== UPDATE (reporting data)
const dissocReportingDataAttributeDefsByLevelUuid = R.dissocPath([
  keys.props,
  keysProps.reportingDataAttributeDefsByLevelUuid,
])
export const assocReportingDataCategoryUuid = (reportingDataCategoryUuid) =>
  R.pipe(
    dissocReportingDataAttributeDefsByLevelUuid,
    ObjectUtils.setProp(keysProps.reportingDataCategoryUuid, reportingDataCategoryUuid)
  )
export const assocReportingDataAttributeDefUuid = ({ categoryLevelUuid, nodeDefUuid }) =>
  R.assocPath([keys.props, keysProps.reportingDataAttributeDefsByLevelUuid, categoryLevelUuid], nodeDefUuid)

// ====== CHECK

export const isDraft = R.ifElse(R.pipe(getDateExecuted, R.isNil), R.always(true), (chain) =>
  DateUtils.isAfter(getDateModified(chain), getDateExecuted(chain))
)
export const isStratificationEnabled = (chain) => {
  const samplingStrategy = getSamplingStrategy(chain)
  return (
    samplingStrategy && ![samplingStrategies.simpleRandom, samplingStrategies.systematic].includes(samplingStrategy)
  )
}
export const isPostStratificationEnabled = (chain) => {
  const samplingStrategy = getSamplingStrategy(chain)
  return (
    samplingStrategy &&
    [samplingStrategies.simpleRandom, samplingStrategies.stratifiedSystematic].includes(samplingStrategy)
  )
}
export const isStratificationNotSpecifiedAllowed = () => {
  return false
  // TODO return true if samplingStrategy is double phase
  // return getSamplingStrategy(chain) === samplingStrategies.doublePhase
}

// ====== VALIDATION
// The validation object contains the validation of chain index by uuids
export const { getValidation } = Validation
export const { hasValidation } = Validation
export const { assocValidation } = Validation
export const { dissocValidation } = Validation

export const getItemValidationByUuid = (uuid) => R.pipe(getValidation, Validation.getFieldValidation(uuid))
export const assocItemValidation = (uuid, validation) => (chain) =>
  R.pipe(getValidation, Validation.assocFieldValidation(uuid, validation), (validationUpdated) =>
    Validation.assocValidation(validationUpdated)(chain)
  )(chain)
