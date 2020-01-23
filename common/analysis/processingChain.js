import * as R from 'ramda'

import * as ObjectUtils from '@core/objectUtils'
import * as DateUtils from '@core/dateUtils'
import { uuidv4 } from '@core/uuid'
import * as Validation from '@core/validation/validation'

import * as ProcessingStep from './processingStep'
import * as ProcessingStepCalculation from './processingStepCalculation'

const keys = {
  dateCreated: ObjectUtils.keys.dateCreated,
  dateExecuted: 'dateExecuted',
  dateModified: ObjectUtils.keys.dateModified,
  props: ObjectUtils.keys.props,
  statusExec: 'statusExec',
  uuid: ObjectUtils.keys.uuid,
  temporary: ObjectUtils.keys.temporary,

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

// ====== READ

export const getUuid = ObjectUtils.getUuid
export const getProps = ObjectUtils.getProps
export const getPropsDiff = ObjectUtils.getPropsDiff
export const getCycles = ObjectUtils.getCycles
export const getDateCreated = ObjectUtils.getDateCreated
export const getDateExecuted = ObjectUtils.getDate(keys.dateExecuted)
export const getDateModified = ObjectUtils.getDateModified
export const getStatusExec = R.propOr(null, keys.statusExec)

export const getDescriptions = ObjectUtils.getDescriptions
export const getDescription = ObjectUtils.getDescription
export const getLabels = ObjectUtils.getLabels
export const getLabel = ObjectUtils.getLabel

export const isTemporary = ObjectUtils.isTemporary

// ===== READ - Steps
export const getProcessingSteps = R.propOr([], keys.processingSteps)
const _getStepByIdx = stepIdx => R.pipe(getProcessingSteps, R.propOr(null, stepIdx))
export const getStepPrev = step => _getStepByIdx(ProcessingStep.getIndex(step) - 1)
export const getStepNext = step => _getStepByIdx(ProcessingStep.getIndex(step) + 1)

// ===== READ - Calculation attribute uudis
export const getCalculationAttributeUuids = R.propOr({}, keys.calculationAttributeUuids)
export const getCalculationAttributeUuidByCalculationUuid = calculationUuid =>
  R.path([keys.calculationAttributeUuids, calculationUuid])

// ====== CHECK

export const isDraft = R.ifElse(R.pipe(getDateExecuted, R.isNil), R.always(true), chain =>
  DateUtils.isAfter(getDateModified(chain), getDateExecuted(chain)),
)

// ====== UPDATE
export const assocProp = ObjectUtils.setProp

export const dissocTemporary = ObjectUtils.dissocTemporary

export const dissocProcessingSteps = R.dissoc(keys.processingSteps)

export const assocProcessingSteps = R.assoc(keys.processingSteps)

export const assocProcessingStep = step => R.assocPath([keys.processingSteps, ProcessingStep.getIndex(step)], step)

const _updateSteps = fn => chain => R.pipe(getProcessingSteps, fn, steps => assocProcessingSteps(steps)(chain))(chain)

export const dissocProcessingStepLast = processingChain =>
  R.pipe(
    // Get last processing step calculation uuids
    getProcessingSteps,
    R.last,
    ProcessingStep.getCalculations,
    R.pluck(ProcessingStepCalculation.keys.uuid),
    // Dissoc each calculation uuid from calculationAttributeUuids
    R.reduce(
      (accChain, calculationUuid) => dissocCalculationAttributeDefUuid(calculationUuid)(accChain),
      processingChain,
    ),
    // Remove last step from chain
    _updateSteps(R.dropLast(1)),
  )(processingChain)

export const dissocProcessingStepTemporary = R.when(
  R.pipe(getProcessingSteps, R.last, ProcessingStep.isTemporary),
  dissocProcessingStepLast,
)

export const assocCalculationAttributeDefUuids = R.assoc(keys.calculationAttributeUuids)

export const assocCalculationAttributeDefUuid = (calculationUuid, attributeDefUuid) =>
  R.assocPath([keys.calculationAttributeUuids, calculationUuid], attributeDefUuid)

export const dissocCalculationAttributeDefUuid = calculationUuid =>
  R.dissocPath([keys.calculationAttributeUuids, calculationUuid])

// ====== VALIDATION
export const getValidation = Validation.getValidation
export const hasValidation = Validation.hasValidation
export const assocValidation = Validation.assocValidation
export const dissocValidation = Validation.dissocValidation
