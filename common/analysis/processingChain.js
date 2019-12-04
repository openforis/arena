import * as R from 'ramda'

import * as ObjectUtils from '@core/objectUtils'
import * as DateUtils from '@core/dateUtils'
import { uuidv4 } from '@core/uuid'

import * as ProcessingStep from './processingStep'
import * as ProcessingStepCalculation from './processingStepCalculation'

const keys = {
  cycle: ObjectUtils.keys.cycle,
  dateCreated: ObjectUtils.keys.dateCreated,
  dateExecuted: 'dateExecuted',
  dateModified: ObjectUtils.keys.dateModified,
  processingSteps: 'processingSteps',
  props: ObjectUtils.keys.props,
  statusExec: 'statusExec',
  uuid: ObjectUtils.keys.uuid,
}

export const keysProps = {
  labels: ObjectUtils.keysProps.labels,
  descriptions: ObjectUtils.keysProps.descriptions,
}

export const statusExec = {
  error: 'error',
  success: 'success',
  running: 'running',
}

// ====== CREATE

export const newProcessingChain = (cycle, props = {}) => ({
  [keys.uuid]: uuidv4(),
  [keys.cycle]: cycle,
  [keys.props]: props,
})

export const newProcessingStep = (processingChain, props = {}) => ({
  [ProcessingStep.keys.uuid]: uuidv4(),
  [ProcessingStep.keys.processingChainUuid]: getUuid(processingChain),
  [ProcessingStep.keys.index]: getProcessingSteps(processingChain).length,
  [ProcessingStep.keys.props]: props,
})

export const newProcessingStepCalculation = (processingStep, nodeDefUuid, props = {}) => ({
  [ProcessingStepCalculation.keys.uuid]: uuidv4(),
  [ProcessingStepCalculation.keys.processingStepUuid]: ProcessingStep.getUuid(processingStep),
  [ProcessingStepCalculation.keys.index]: ProcessingStep.getCalculationSteps(processingStep).length,
  [ProcessingStepCalculation.keys.nodeDefUuid]: nodeDefUuid,
  [ProcessingStepCalculation.keys.props]: props,
})

// ====== READ

export const getUuid = ObjectUtils.getUuid
export const getCycle = ObjectUtils.getCycle
export const getDateCreated = ObjectUtils.getDateCreated
export const getDateExecuted = ObjectUtils.getDate(keys.dateExecuted)
export const getDateModified = ObjectUtils.getDateModified
export const getProcessingSteps = R.propOr([], keys.processingSteps)
export const getStatusExec = R.propOr(null, keys.statusExec)

export const getDescriptions = ObjectUtils.getDescriptions
export const getDescription = ObjectUtils.getDescription
export const getLabels = ObjectUtils.getLabels
export const getLabel = ObjectUtils.getLabel

// ====== CHECK

export const isDraft = R.ifElse(R.pipe(getDateExecuted, R.isNil), R.always(true), chain =>
  DateUtils.isAfter(getDateModified(chain), getDateExecuted(chain)),
)

// ====== UPDATE

export const assocProcessingSteps = R.assoc(keys.processingSteps)

export const assocProcessingStep = step => chain =>
  R.pipe(getProcessingSteps, R.append(step), steps => R.assoc(keys.processingSteps, steps, chain))(chain)

export const assocProp = ObjectUtils.setProp
