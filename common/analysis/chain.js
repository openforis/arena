import * as R from 'ramda'

import * as ObjectUtils from '@core/objectUtils'
import * as DateUtils from '@core/dateUtils'
import * as Validation from '@core/validation/validation'

import { ChainSamplingDesign } from './chainSamplingDesign'
import { ChainStatisticalAnalysis } from './chainStatisticalAnalysis'

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
  scriptEnd: 'script_end',
}

export const keysProps = {
  labels: ObjectUtils.keysProps.labels,
  descriptions: ObjectUtils.keysProps.descriptions,
  cycles: ObjectUtils.keysProps.cycles,
  hasSamplingDesign: 'hasSamplingDesign',
  samplingDesign: 'samplingDesign',
  analysisNodeDefs: 'analysisNodeDefs',
  submitOnlyAnalysisStepDataIntoR: 'submitOnlyAnalysisStepDataIntoR',
  statisticalAnalysis: 'statisticalAnalysis',
  resultsBackFromRStudio: 'resultsBackFromRStudio',
  includeEntitiesWithoutData: 'includeEntitiesWithoutData',
}

export const statusExec = {
  error: 'error',
  success: 'success',
  running: 'running',
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
export const getScriptEnd = R.propOr(null, keys.scriptEnd)
export const hasSamplingDesign = ObjectUtils.isPropTrue(keysProps.hasSamplingDesign)
export const isSubmitOnlyAnalysisStepDataIntoR = ObjectUtils.isPropTrue(keysProps.submitOnlyAnalysisStepDataIntoR)
export const getSamplingDesign = ObjectUtils.getProp(keysProps.samplingDesign, {})
export const getStatisticalAnalysis = ObjectUtils.getProp(keysProps.statisticalAnalysis, {})
export const isResultsBackFromRStudio = ObjectUtils.getProp(keysProps.resultsBackFromRStudio, true)
export const isIncludeEntitiesWithoutData = ObjectUtils.getProp(keysProps.includeEntitiesWithoutData, false)

// ====== UPDATE
export const assocHasSamplingDesign = (value) => ObjectUtils.setProp(keysProps.hasSamplingDesign, value)

export const assocSubmitOnlyAnalysisStepDataIntoR = (value) =>
  ObjectUtils.setProp(keysProps.submitOnlyAnalysisStepDataIntoR, value)

export const assocResultsBackFromRStudio = (value) => ObjectUtils.setProp(keysProps.resultsBackFromRStudio, value)

export const assocIncludeEntitiesWithoutData = (value) =>
  ObjectUtils.setProp(keysProps.includeEntitiesWithoutData, value)

const assocSamplingDesign = (value) => ObjectUtils.setProp(keysProps.samplingDesign, value)

const _updateSamplingDesign = (updateFn) => (chain) => {
  const samplingDesign = getSamplingDesign(chain)
  const samplingDesignUpdated = updateFn(samplingDesign)
  return assocSamplingDesign(samplingDesignUpdated)(chain)
}

const assocStatisticalAnalysis = (value) => ObjectUtils.setProp(keysProps.statisticalAnalysis, value)

const _updateStatisticalAnalysis = (updateFn) => (chain) => {
  const statisticalAnalysis = getStatisticalAnalysis(chain)
  const statisticalAnalysisUpdated = updateFn(statisticalAnalysis)
  return assocStatisticalAnalysis(statisticalAnalysisUpdated)(chain)
}

const _cleanupChain = (chain) => {
  let chainUpdated = chain
  // reset invalid pValue
  if (
    !ChainSamplingDesign.getSamplingStrategy(getSamplingDesign(chainUpdated)) &&
    ChainStatisticalAnalysis.getPValue(getStatisticalAnalysis(chainUpdated))
  ) {
    chainUpdated = _updateStatisticalAnalysis(ChainStatisticalAnalysis.resetPValue)(chainUpdated)
  }
  // reset invalid clustering only variance
  if (
    !ChainSamplingDesign.getClusteringNodeDefUuid(getSamplingDesign(chainUpdated)) &&
    ChainStatisticalAnalysis.isClusteringOnlyVariances(getStatisticalAnalysis(chainUpdated))
  ) {
    chainUpdated = _updateStatisticalAnalysis(ChainStatisticalAnalysis.assocClusteringOnlyVariances(false))(
      chainUpdated
    )
  }
  // reset invalid stratum aggregation
  if (
    !isStratumAggregationAvailable(chainUpdated) &&
    ChainStatisticalAnalysis.isStratumAggregation(getStatisticalAnalysis(chainUpdated))
  ) {
    chainUpdated = _updateStatisticalAnalysis(ChainStatisticalAnalysis.assocStratumAggregation(false))(chainUpdated)
  }
  return chainUpdated
}

const _updateChain = (updateFn) => (chain) => {
  const chainUpdated = updateFn(chain)
  return _cleanupChain(chainUpdated)
}

export const updateSamplingDesign = (updateFn) => _updateChain(_updateSamplingDesign(updateFn))

export const updateStatisticalAnalysis = (updateFn) => _updateChain(_updateStatisticalAnalysis(updateFn))

// ====== CHECK
export const isDraft = R.ifElse(R.pipe(getDateExecuted, R.isNil), R.always(true), (chain) =>
  DateUtils.isAfter(getDateModified(chain), getDateExecuted(chain))
)

export const checkChangeRequiresSurveyPublish = ({ chainPrev, chainNext }) => {
  const samplingDesignPrev = getSamplingDesign(chainPrev)
  const samplingDesignNext = getSamplingDesign(chainNext)
  if (
    ChainSamplingDesign.getBaseUnitNodeDefUuid(samplingDesignPrev) !==
    ChainSamplingDesign.getBaseUnitNodeDefUuid(samplingDesignNext)
  ) {
    return true
  }
  return false
}

// utils
export const isStratumAggregationAvailable = (chain) => {
  const statisticalAnalysis = getStatisticalAnalysis(chain)
  const samplingDesign = getSamplingDesign(chain)
  const reportingMethod = ChainStatisticalAnalysis.getReportingMethod(statisticalAnalysis)
  return (
    reportingMethod === ChainStatisticalAnalysis.reportingMethods.dimensionsSeparate &&
    [
      ChainSamplingDesign.samplingStrategies.stratifiedRandom,
      ChainSamplingDesign.samplingStrategies.stratifiedSystematic,
    ].includes(ChainSamplingDesign.getSamplingStrategy(samplingDesign))
  )
}

// ====== VALIDATION
// The validation object contains the validation of chain index by uuids
export const { getValidation, hasValidation, assocValidation, dissocValidation } = Validation

export const getItemValidationByUuid = (uuid) => R.pipe(getValidation, Validation.getFieldValidation(uuid))
export const assocItemValidation = (uuid, validation) => (chain) =>
  R.pipe(getValidation, Validation.assocFieldValidation(uuid, validation), (validationUpdated) =>
    Validation.assocValidation(validationUpdated)(chain)
  )(chain)
