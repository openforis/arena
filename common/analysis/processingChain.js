import * as R from 'ramda'

import * as ObjectUtils from '@core/objectUtils'
import * as DateUtils from '@core/dateUtils'
import { uuidv4 } from '@core/uuid'
import * as Validation from '@core/validation/validation'

import * as Step from './processingStep'
import * as Calculation from './processingStepCalculation'

export const keys = {
  dateCreated: ObjectUtils.keys.dateCreated,
  dateExecuted: 'dateExecuted',
  dateModified: ObjectUtils.keys.dateModified,
  props: ObjectUtils.keys.props,
  statusExec: 'statusExec',
  uuid: ObjectUtils.keys.uuid,
  temporary: ObjectUtils.keys.temporary,
  validation: ObjectUtils.keys.validation,
  scriptCommon: 'scriptCommon',
  processingSteps: 'processingSteps',
}

export const keysProps = {
  labels: ObjectUtils.keysProps.labels,
  descriptions: ObjectUtils.keysProps.descriptions,
  cycles: ObjectUtils.keysProps.cycles,
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

// ===== READ - Steps
export const getProcessingSteps = R.propOr([], keys.processingSteps)
export const getStepByIdx = (stepIdx) =>
  R.ifElse(R.always(stepIdx >= 0), R.pipe(getProcessingSteps, R.propOr(null, stepIdx)), R.always(null))
export const getStepPrev = (step) => getStepByIdx(Step.getIndex(step) - 1)
export const getStepNext = (step) => getStepByIdx(Step.getIndex(step) + 1)

// ====== CREATE

export const newProcessingChain = (props = {}) => ({
  [keys.uuid]: uuidv4(),
  [keys.props]: props,
  [Calculation.keys.temporary]: true,
})

export const newProcessingStep = (processingChain, props = {}) => ({
  [Step.keys.uuid]: uuidv4(),
  [Step.keys.processingChainUuid]: getUuid(processingChain),
  [Step.keys.index]: getProcessingSteps(processingChain).length,
  [Step.keys.props]: props,
  [Calculation.keys.temporary]: true,
})

export const newProcessingStepCalculation = (processingStep, nodeDefUuid = null, props = {}) => ({
  [Calculation.keys.uuid]: uuidv4(),
  [Calculation.keys.processingStepUuid]: Step.getUuid(processingStep),
  [Calculation.keys.index]: Step.getCalculations(processingStep).length,
  [Calculation.keys.nodeDefUuid]: nodeDefUuid,
  [Calculation.keys.props]: props,
  [Calculation.keys.temporary]: true,
})

// ====== CHECK

export const isDraft = R.ifElse(R.pipe(getDateExecuted, R.isNil), R.always(true), (chain) =>
  DateUtils.isAfter(getDateModified(chain), getDateExecuted(chain))
)

// ====== UPDATE
export const assocProp = ObjectUtils.setProp

export const { dissocTemporary } = ObjectUtils

export const dissocProcessingSteps = R.dissoc(keys.processingSteps)

export const assocProcessingSteps = R.assoc(keys.processingSteps)

export const assocProcessingStep = (step) => R.assocPath([keys.processingSteps, Step.getIndex(step)], step)

export const dissocProcessingStepTemporary = (chain) => ({
  ...chain,
  [keys.processingSteps]: (chain[keys.processingSteps] || []).filter(
    (processingStep) => !Step.isTemporary(processingStep)
  ),
})

export const dissocProcessingStep = (step) => (chain) => ({
  ...chain,
  [keys.processingSteps]: (chain[keys.processingSteps] || []).filter(
    (processingStep) => !Step.isEqual(processingStep)(step)
  ),
})

// ====== VALIDATION
// The validation object contains the validation of chain, steps, calculations, index by uuids
export const { getValidation } = Validation
export const { hasValidation } = Validation
export const { assocValidation } = Validation
export const { dissocValidation } = Validation

export const getItemValidationByUuid = (uuid) => R.pipe(getValidation, Validation.getFieldValidation(uuid))
export const assocItemValidation = (uuid, validation) => (chain) =>
  R.pipe(getValidation, Validation.assocFieldValidation(uuid, validation), (validationUpdated) =>
    Validation.assocValidation(validationUpdated)(chain)
  )(chain)
