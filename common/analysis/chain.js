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
  nonResponseBiasCorrection: 'nonResponseBiasCorrection',
  pValue: 'pValue',
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

export const pValues = [0.99, 0.98, 0.95, 0.9, 0.8]
export const pValueDefault = 0.95

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
export const isNonResponseBiasCorrection = ObjectUtils.isPropTrue(keysProps.nonResponseBiasCorrection)
export const getPValue = ObjectUtils.getProp(keysProps.pValue, pValueDefault)

// ====== READ (reporting data)
export const getReportingDataCategoryUuid = ObjectUtils.getProp(keysProps.reportingDataCategoryUuid)
export const getReportingDataAttributeDefUuid = ({ categoryLevelUuid }) =>
  R.pathOr(null, [keys.props, keysProps.reportingDataAttributeDefsByLevelUuid, categoryLevelUuid])

// ====== UPDATE
export const assocSamplingDesign = (samplingDesign) => ObjectUtils.setProp(keysProps.samplingDesign, samplingDesign)

export const assocAreaWeightingMethod = (areaWeightingMethod) =>
  ObjectUtils.setProp(keysProps.areaWeightingMethod, areaWeightingMethod)

export const assocClusteringNodeDefUuid = (clusteringNodeDefUuid) =>
  ObjectUtils.setProp(keysProps.clusteringNodeDefUuid, clusteringNodeDefUuid)

export const assocClusteringOnlyVariances = (clusteringOnlyVariances) =>
  ObjectUtils.setProp(keysProps.clusteringOnlyVariances, clusteringOnlyVariances)

export const assocPostStratificationAttributeDefUuid = (postStratificationAttributeDefUuid) =>
  ObjectUtils.setProp(keysProps.postStratificationAttributeDefUuid, postStratificationAttributeDefUuid)
const resetPostStratificationAttributeDefUuid = assocPostStratificationAttributeDefUuid(null)

export const assocStratumNodeDefUuid = (stratumNodeDefUuid) => (chain) => {
  let chainUpdated = ObjectUtils.setProp(keysProps.stratumNodeDefUuid, stratumNodeDefUuid)(chain)
  if (getPostStratificationAttributeDefUuid(chainUpdated) === stratumNodeDefUuid) {
    chainUpdated = assocPostStratificationAttributeDefUuid(null)(chainUpdated)
  }
  return chainUpdated
}
const resetStratumNodeDefUuid = assocStratumNodeDefUuid(null)

export const assocNonResponseBiasCorrection = (nonResponseBiasCorrection) =>
  ObjectUtils.setProp(keysProps.nonResponseBiasCorrection, nonResponseBiasCorrection)

export const assocPValue = (pValue) => ObjectUtils.setProp(keysProps.pValue, pValue)
const resetPValue = assocPValue(null)

export const assocSamplingStrategy = (samplingStrategy) => (chain) => {
  let chainUpdated = ObjectUtils.setProp(keysProps.samplingStrategy, samplingStrategy)(chain)
  if (!isStratificationEnabled(chainUpdated) && getStratumNodeDefUuid(chainUpdated)) {
    chainUpdated = resetStratumNodeDefUuid(chainUpdated)
  }
  if (!isPostStratificationEnabled(chainUpdated) && getPostStratificationAttributeDefUuid(chainUpdated)) {
    chainUpdated = resetPostStratificationAttributeDefUuid(chainUpdated)
  }
  if (!samplingStrategy) {
    chainUpdated = resetPValue(chainUpdated)
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
export const { getValidation, hasValidation, assocValidation, dissocValidation } = Validation

export const getItemValidationByUuid = (uuid) => R.pipe(getValidation, Validation.getFieldValidation(uuid))
export const assocItemValidation = (uuid, validation) => (chain) =>
  R.pipe(getValidation, Validation.assocFieldValidation(uuid, validation), (validationUpdated) =>
    Validation.assocValidation(validationUpdated)(chain)
  )(chain)
