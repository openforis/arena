import * as R from 'ramda';
import ObjectUtils from '../../core/objectUtils';
import DateUtils from '../../core/dateUtils';
import { uuidv4 } from '../../core/uuid';
import ProcessingStep from './processingStep';
import { IProcessingStepCalculation, IProcessingStep, IProcessingChainProps, IProcessingChain, IProcessingStepProps } from './common';

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
const newProcessingChain: (cycle: string, props?: IProcessingChainProps) => IProcessingChain
= (cycle, props = {}) => ({
  uuid: uuidv4(),
  cycle,
  props,
})

const newProcessingStep: (processingChain: IProcessingChain, props?: IProcessingStepProps) => IProcessingStep
= (processingChain, props = {}) => ({
  uuid: uuidv4(),
  processingChainUuid: getUuid(processingChain),
  index: getProcessingSteps(processingChain).length,
  props: props,
})

const newProcessingStepCalculation: (processingStep: IProcessingStep, nodeDefUuid: string, props?: IProcessingStepProps) => IProcessingStepCalculation
= (processingStep, nodeDefUuid, props = {}) => ({
  uuid: uuidv4(),
  processingStepUuid: ProcessingStep.getUuid(processingStep),
  index: ProcessingStep.getCalculationSteps(processingStep).length,
  nodeDefUuid,
  props,
})

// ====== READ

const getUuid = ObjectUtils.getUuid
const getCycle = ObjectUtils.getCycle
const getDateCreated = ObjectUtils.getDateCreated
const getDateExecuted = ObjectUtils.getDate(keys.dateExecuted)
const getDateModified = ObjectUtils.getDateModified
const getProcessingSteps: <O>(obj: O) => unknown[] = R.propOr([], keys.processingSteps)
const getStatusExec: (x: any) => string | null = R.propOr(null, keys.statusExec)

// ====== CHECK

const isDraft = R.ifElse(
  R.pipe(getDateExecuted, R.isNil),
  R.always(true),
  chain => DateUtils.isAfter(getDateModified(chain), getDateExecuted(chain))
)

// ====== UPDATE

const assocProcessingStep = step => chain => R.pipe(
  getProcessingSteps,
  R.append(step),
  steps => R.assoc(keys.processingSteps, steps, chain)
)(chain)

const getDescriptions = ObjectUtils.getDescriptions
const getDescription = ObjectUtils.getDescription
const getLabels = ObjectUtils.getLabels
const getLabel = ObjectUtils.getLabel
const assocProp = ObjectUtils.setProp

export default {
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
  getDescriptions,
  getDescription,
  getLabels,
  getLabel,
  getProcessingSteps,
  getStatusExec,
  getUuid,

  //CHECK
  isDraft,

  //UPDATE
  assocProp,
  assocProcessingStep,
};
