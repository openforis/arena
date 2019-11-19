import * as R from 'ramda'

import * as ProcessingStep from '@common/analysis/processingStep'
import * as ProcessingStepCalculation from '@common/analysis/processingStepCalculation'

import * as AnalysisState from '@webapp/loggedin/modules/analysis/analysisState'

export const stateKey = 'processingStep'

const keys = {
  step: 'step',
  stepPrev: 'stepPrev',
  stepNext: 'stepNext',
  calculationIndexForEdit: 'calculationIndexForEdit',
}

// ====== READ

const getState = R.pipe(
  AnalysisState.getState,
  R.prop(stateKey)
)

const _getStep = (stepKey, defaultTo = null) => R.pipe(
  getState,
  R.propOr(defaultTo, stepKey)
)

export const getProcessingStep = _getStep(keys.step, {})

export const getProcessingStepPrev = _getStep(keys.stepPrev)

export const getProcessingStepNext = _getStep(keys.stepNext)

export const getProcessingStepCalculationForEdit = state => R.pipe(
  getState,
  R.propOr(null, keys.calculationIndexForEdit),
  R.unless(
    R.isNil,
    idx => R.pipe(
      getProcessingStep,
      ProcessingStep.getCalculationSteps,
      R.prop(idx)
    )(state)
  )
)(state)

// ====== UPDATE

export const assocProcessingStep = (processingStep, processingStepPrev, processingStepNext) => R.pipe(
  R.assoc(keys.step, processingStep),
  R.assoc(keys.stepPrev, processingStepPrev),
  R.assoc(keys.stepNext, processingStepNext),
)

const _updateProcessingStep = updateFn => processingStepState => R.pipe(
  R.prop(keys.step),
  updateFn,
  processingStepUpdate => R.assoc(keys.step, processingStepUpdate, processingStepState)
)(processingStepState)

export const mergeProcessingStepProps = props => _updateProcessingStep(
  ProcessingStep.mergeProps(props),
)

export const assocCalculationIndexForEdit = R.assoc(keys.calculationIndexForEdit)

export const assocCalculation = calculation => R.pipe(
  _updateProcessingStep(ProcessingStep.assocCalculation(calculation)),
  assocCalculationIndexForEdit(ProcessingStepCalculation.getIndex(calculation))
)
