const R = require('ramda')

const ObjectUtils = require('@core/objectUtils')
const DateUtils = require('@core/dateUtils')
const { uuidv4 } = require('@core/uuid')

const ProcessingStep = require('./processingStep')
const ProcessingStepCalculation = require('./processingStepCalculation')

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

const keysProps = {
  labels: ObjectUtils.keysProps.labels,
  descriptions: ObjectUtils.keysProps.descriptions,
}

const statusExec = {
  error: 'error',
  success: 'success',
  running: 'running',
}

// ====== CREATE

const newProcessingChain = (cycle, props = {}) => ({
  [keys.uuid]: uuidv4(),
  [keys.cycle]: cycle,
  [keys.props]: props,
})

const newProcessingStep = (processingChain, props = {}) => ({
  [ProcessingStep.keys.uuid]: uuidv4(),
  [ProcessingStep.keys.processingChainUuid]: getUuid(processingChain),
  [ProcessingStep.keys.index]: getProcessingSteps(processingChain).length,
  [ProcessingStep.keys.props]: props,
})

const newProcessingStepCalculation = (processingStep, nodeDefUuid, props = {}) => ({
  [ProcessingStepCalculation.keys.uuid]: uuidv4(),
  [ProcessingStepCalculation.keys.processingStepUuid]: ProcessingStep.getUuid(processingStep),
  [ProcessingStepCalculation.keys.index]: ProcessingStep.getCalculationSteps(processingStep).length,
  [ProcessingStepCalculation.keys.nodeDefUuid]: nodeDefUuid,
  [ProcessingStepCalculation.keys.props]: props,
})

// ====== READ

const getUuid = ObjectUtils.getUuid
const getCycle = ObjectUtils.getCycle
const getDateCreated = ObjectUtils.getDateCreated
const getDateExecuted = ObjectUtils.getDate(keys.dateExecuted)
const getDateModified = ObjectUtils.getDateModified
const getProcessingSteps = R.propOr([], keys.processingSteps)
const getStatusExec = R.propOr(null, keys.statusExec)

// ====== CHECK

const isDraft = R.ifElse(
  R.pipe(getDateExecuted, R.isNil),
  R.always(true),
  chain => DateUtils.isAfter(getDateModified(chain), getDateExecuted(chain))
)

// ====== UPDATE

const assocProcessingSteps = R.assoc(keys.processingSteps)

const assocProcessingStep = step => chain => R.pipe(
  getProcessingSteps,
  R.append(step),
  steps => R.assoc(keys.processingSteps, steps, chain)
)(chain)

module.exports = {
  statusExec,
  keysProps,

  //CREATE
  newProcessingChain,
  newProcessingStep,
  newProcessingStepCalculation,

  //READ
  getCycle,
  getDateCreated,
  getDateExecuted,
  getDateModified,
  getDescriptions: ObjectUtils.getDescriptions,
  getDescription: ObjectUtils.getDescription,
  getLabels: ObjectUtils.getLabels,
  getLabel: ObjectUtils.getLabel,
  getProcessingSteps,
  getStatusExec,
  getUuid,

  //CHECK
  isDraft,

  //UPDATE
  assocProp: ObjectUtils.setProp,
  assocProcessingSteps,
  assocProcessingStep,
}