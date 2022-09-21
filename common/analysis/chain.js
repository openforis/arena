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
  hasSamplingDesign: 'hasSamplingDesign',
  samplingDesign: 'samplingDesign',
  analysisNodeDefs: 'analysisNodeDefs',
  submitOnlyAnalysisStepDataIntoR: 'submitOnlyAnalysisStepDataIntoR',
  statisticalAnalysis: 'statisticalAnalysis',
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
export const hasSamplingDesign = ObjectUtils.isPropTrue(keysProps.hasSamplingDesign)
export const isSubmitOnlyAnalysisStepDataIntoR = ObjectUtils.isPropTrue(keysProps.submitOnlyAnalysisStepDataIntoR)
export const getSamplingDesign = ObjectUtils.getProp(keysProps.samplingDesign, {})
export const getStatisticalAnalysis = ObjectUtils.getProp(keysProps.statisticalAnalysis, {})

// ====== UPDATE
export const assocHasSamplingDesign = (value) => ObjectUtils.setProp(keysProps.hasSamplingDesign, value)

export const assocSubmitOnlyAnalysisStepDataIntoR = (value) =>
  ObjectUtils.setProp(keysProps.submitOnlyAnalysisStepDataIntoR, value)

const assocSamplingDesign = (value) => ObjectUtils.setProp(keysProps.samplingDesign, value)

export const updateSamplingDesign = (updateFn) => (chain) => {
  const samplingDesign = getSamplingDesign(chain)
  const samplingDesignUpdated = updateFn(samplingDesign)
  return assocSamplingDesign(samplingDesignUpdated)(chain)
}

const assocStatisticalAnalysis = (value) => ObjectUtils.setProp(keysProps.statisticalAnalysis, value)

export const updateStatisticalAnalysis = (updateFn) => (chain) => {
  const statisticalAnalysis = getStatisticalAnalysis(chain)
  const getStatisticalAnalysisUpdated = updateFn(statisticalAnalysis)
  return assocStatisticalAnalysis(getStatisticalAnalysisUpdated)(chain)
}

// ====== CHECK
export const isDraft = R.ifElse(R.pipe(getDateExecuted, R.isNil), R.always(true), (chain) =>
  DateUtils.isAfter(getDateModified(chain), getDateExecuted(chain))
)

// ====== VALIDATION
// The validation object contains the validation of chain index by uuids
export const { getValidation, hasValidation, assocValidation, dissocValidation } = Validation

export const getItemValidationByUuid = (uuid) => R.pipe(getValidation, Validation.getFieldValidation(uuid))
export const assocItemValidation = (uuid, validation) => (chain) =>
  R.pipe(getValidation, Validation.assocFieldValidation(uuid, validation), (validationUpdated) =>
    Validation.assocValidation(validationUpdated)(chain)
  )(chain)
