import * as R from 'ramda'

import * as ProcessingStep from '@common/analysis/processingStep'

import * as AnalysisState from '@webapp/loggedin/modules/analysis/analysisState'

export const stateKey = 'processingStep'

const keys = {
  step: 'step',
  stepPrev: 'stepPrev',
  stepNext: 'stepNext',
}

// ====== READ

const _getStep = (stepKey, defaultTo = null) => R.pipe(
  AnalysisState.getState,
  R.pathOr(defaultTo, [stateKey, stepKey])
)

export const getProcessingStep = _getStep(keys.step, {})

export const getProcessingStepPrev = _getStep(keys.stepPrev)

export const getProcessingStepNext = _getStep(keys.stepNext)

// ====== UPDATE

export const assocProcessingStep = (processingStep, processingStepPrev, processingStepNext) => R.pipe(
  R.assoc(keys.step, processingStep),
  R.assoc(keys.stepPrev, processingStepPrev),
  R.assoc(keys.stepNext, processingStepNext),
)

export const mergeProcessingStepProps = props => processingStepState => R.pipe(
  R.prop(keys.step),
  ProcessingStep.mergeProps(props),
  processingStepUpdate => R.assoc(keys.step, processingStepUpdate, processingStepState)
)(processingStepState)