import * as R from 'ramda'

import * as ObjectUtils from '@core/objectUtils'
import * as DateUtils from '@core/dateUtils'
import { uuidv4 } from '@core/uuid'
import * as Validation from '@core/validation/validation'

import * as ProcessingStep from './processingStep'
import * as ProcessingStepCalculation from './processingStepCalculation'

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
  calculationAttributeUuids: 'calculationAttributeUuids',
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
const _getStepByIdx = (stepIdx) =>
  R.ifElse(R.always(stepIdx >= 0), R.pipe(getProcessingSteps, R.propOr(null, stepIdx)), R.always(null))
export const getStepPrev = (step) => _getStepByIdx(ProcessingStep.getIndex(step) - 1)
export const getStepNext = (step) => _getStepByIdx(ProcessingStep.getIndex(step) + 1)

// ===== READ - Calculation attribute uudis
export const getCalculationAttributeUuids = R.propOr({}, keys.calculationAttributeUuids)
export const getCalculationAttributeUuidByCalculationUuid = (calculationUuid) =>
  R.path([keys.calculationAttributeUuids, calculationUuid])

// ====== CREATE

export const newProcessingChain = (props = {}) => ({
  [keys.uuid]: uuidv4(),
  [keys.props]: props,
  [ProcessingStepCalculation.keys.temporary]: true,
})

export const newProcessingStep = (processingChain, props = {}) => ({
  [ProcessingStep.keys.uuid]: uuidv4(),
  [ProcessingStep.keys.processingChainUuid]: getUuid(processingChain),
  [ProcessingStep.keys.index]: getProcessingSteps(processingChain).length,
  [ProcessingStep.keys.props]: props,
  [ProcessingStepCalculation.keys.temporary]: true,
})

export const newProcessingStepCalculation = (processingStep, nodeDefUuid = null, props = {}) => ({
  [ProcessingStepCalculation.keys.uuid]: uuidv4(),
  [ProcessingStepCalculation.keys.processingStepUuid]: ProcessingStep.getUuid(processingStep),
  [ProcessingStepCalculation.keys.index]: ProcessingStep.getCalculations(processingStep).length,
  [ProcessingStepCalculation.keys.nodeDefUuid]: nodeDefUuid,
  [ProcessingStepCalculation.keys.props]: props,
  [ProcessingStepCalculation.keys.temporary]: true,
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

export const assocProcessingStep = (step) => R.assocPath([keys.processingSteps, ProcessingStep.getIndex(step)], step)

const _updateSteps = (fn) => (chain) =>
  R.pipe(getProcessingSteps, fn, (steps) => assocProcessingSteps(steps)(chain))(chain)

export const assocCalculationAttributeDefUuids = R.assoc(keys.calculationAttributeUuids)

export const assocCalculationAttributeDefUuid = (calculationUuid, attributeDefUuid) =>
  R.assocPath([keys.calculationAttributeUuids, calculationUuid], attributeDefUuid)

export const dissocCalculationAttributeDefUuid = (calculationUuid) =>
  R.dissocPath([keys.calculationAttributeUuids, calculationUuid])

export const dissocProcessingStepLast = (processingChain) =>
  R.pipe(
    // Get last processing step calculation uuids
    getProcessingSteps,
    R.last,
    ProcessingStep.getCalculations,
    R.pluck(ProcessingStepCalculation.keys.uuid),
    // Dissoc each calculation uuid from calculationAttributeUuids
    R.reduce(
      (accChain, calculationUuid) => dissocCalculationAttributeDefUuid(calculationUuid)(accChain),
      processingChain
    ),
    // Remove last step from chain
    _updateSteps(R.dropLast(1))
  )(processingChain)

export const dissocProcessingStepTemporary = R.when(
  R.pipe(getProcessingSteps, R.last, ProcessingStep.isTemporary),
  dissocProcessingStepLast
)

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
