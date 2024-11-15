import * as R from 'ramda'

import { Dates } from '@openforis/arena-core'

import * as ObjectUtils from '@core/objectUtils'
import * as Validation from '@core/validation/validation'

import { ChainSamplingDesign } from './chainSamplingDesign'
import { ChainStatisticalAnalysis } from './chainStatisticalAnalysis'

export const keys = {
  dateCreated: ObjectUtils.keys.dateCreated,
  dateExecuted: 'dateExecuted',
  dateModified: ObjectUtils.keys.dateModified,
  props: ObjectUtils.keys.props,
  statusExec: 'statusExec',
  uuid: ObjectUtils.keys.uuid,
  temporary: ObjectUtils.keys.temporary,
  validation: Validation.keys.validation,
  scriptCommon: 'scriptCommon',
  scriptEnd: 'scriptEnd',
}

export const keysProps = {
  labels: ObjectUtils.keysProps.labels,
  descriptions: ObjectUtils.keysProps.descriptions,
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

export const updateSamplingDesign = (updateFn) => (chain) => {
  const samplingDesign = getSamplingDesign(chain)
  const samplingDesignUpdated = updateFn(samplingDesign)
  let chainUpdated = assocSamplingDesign(samplingDesignUpdated)(chain)
  if (
    !ChainSamplingDesign.getSamplingStrategy(samplingDesignUpdated) &&
    ChainStatisticalAnalysis.getPValue(getStatisticalAnalysis(chainUpdated))
  ) {
    chainUpdated = updateStatisticalAnalysis(ChainStatisticalAnalysis.resetPValue)(chainUpdated)
  }
  if (
    !ChainSamplingDesign.getClusteringNodeDefUuid(samplingDesign) &&
    ChainStatisticalAnalysis.isClusteringOnlyVariances(getStatisticalAnalysis(chainUpdated))
  ) {
    chainUpdated = updateStatisticalAnalysis(ChainStatisticalAnalysis.assocClusteringOnlyVariances(false))(chainUpdated)
  }
  return chainUpdated
}

const assocStatisticalAnalysis = (value) => ObjectUtils.setProp(keysProps.statisticalAnalysis, value)

export const updateStatisticalAnalysis = (updateFn) => (chain) => {
  const statisticalAnalysis = getStatisticalAnalysis(chain)
  const getStatisticalAnalysisUpdated = updateFn(statisticalAnalysis)
  return assocStatisticalAnalysis(getStatisticalAnalysisUpdated)(chain)
}

// ====== CHECK
export const isDraft = R.ifElse(R.pipe(getDateExecuted, R.isNil), R.always(true), (chain) =>
  Dates.isAfter(getDateModified(chain), getDateExecuted(chain))
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

// ====== VALIDATION
// The validation object contains the validation of chain index by uuids
export const { getValidation, hasValidation, assocValidation, dissocValidation } = Validation

export const getItemValidationByUuid = (uuid) => R.pipe(getValidation, Validation.getFieldValidation(uuid))
export const assocItemValidation = (uuid, validation) => (chain) =>
  R.pipe(getValidation, Validation.assocFieldValidation(uuid, validation), (validationUpdated) =>
    Validation.assocValidation(validationUpdated)(chain)
  )(chain)
