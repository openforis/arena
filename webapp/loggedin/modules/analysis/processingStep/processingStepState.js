import * as R from 'ramda'

import * as ProcessingChain from '@common/analysis/processingChain'
import * as ProcessingStep from '@common/analysis/processingStep'
import * as ProcessingStepCalculation from '@common/analysis/processingStepCalculation'

import * as AnalysisState from '@webapp/loggedin/modules/analysis/analysisState'
import * as ProcessingChainState from '@webapp/loggedin/modules/analysis/processingChain/processingChainState'

export const stateKey = 'processingStep'

const keys = {
  dirty: 'dirty',
  orig: 'orig',
  calculationUuidForEdit: 'calculationIndexForEdit',
}

// ====== READ

const getState = R.pipe(AnalysisState.getState, R.prop(stateKey))

const _getStep = (stepKey, defaultTo = null) => R.pipe(getState, R.propOr(defaultTo, stepKey))

export const getProcessingStep = _getStep(keys.dirty, {})

export const getProcessingStepPrev = state => {
  const chain = ProcessingChainState.getProcessingChain(state)
  const step = getProcessingStep(state)
  return ProcessingChain.getStepPrev(step)(chain)
}

export const getProcessingStepNext = state => {
  const chain = ProcessingChainState.getProcessingChain(state)
  const step = getProcessingStep(state)
  return ProcessingChain.getStepNext(step)(chain)
}

export const getProcessingStepCalculationForEdit = state =>
  R.pipe(
    getState,
    R.propOr(null, keys.calculationUuidForEdit),
    R.unless(R.isNil, uuid =>
      R.pipe(
        getProcessingStep,
        ProcessingStep.getCalculationSteps,
        R.find(R.propEq(ProcessingStepCalculation.keys.uuid, uuid)),
      )(state),
    ),
  )(state)

// ====== UPDATE

// Step
export const assocProcessingStep = processingStep =>
  R.pipe(R.assoc(keys.dirty, processingStep), R.assoc(keys.orig, processingStep))

const _updateStepDirty = fn => state => R.pipe(R.prop(keys.dirty), fn, step => R.assoc(keys.dirty, step, state))(state)

export const mergeProcessingStepProps = props => _updateStepDirty(ProcessingStep.mergeProps(props))

export const saveDirty = step => assocProcessingStep(step)

// Calculations
export const assocCalculationUuidForEdit = R.assoc(keys.calculationUuidForEdit)

export const assocCalculation = calculation =>
  R.pipe(
    _updateStepDirty(ProcessingStep.assocCalculation(calculation)),
    assocCalculationUuidForEdit(ProcessingStepCalculation.getUuid(calculation)),
  )

export const updateCalculationIndex = (indexFrom, indexTo) => processingStepState =>
  R.pipe(R.prop(keys.dirty), ProcessingStep.getCalculationSteps, R.move(indexFrom, indexTo), calculations => {
    const calculationsUpdate = calculations.map((calculation, idx) =>
      ProcessingStepCalculation.assocIndex(idx)(calculation),
    )
    return _updateStepDirty(ProcessingStep.assocCalculations(calculationsUpdate))(processingStepState)
  })(processingStepState)

export const dissocTemporaryCalculation = state =>
  R.pipe(R.prop(keys.dirty), ProcessingStep.dissocTemporaryCalculation, processingStep =>
    R.assoc(keys.dirty, processingStep)(state),
  )(state)

export const dissocCalculation = calculation => state =>
  R.pipe(R.prop(keys.dirty), ProcessingStep.dissocCalculation(calculation), processingStep =>
    R.assoc(keys.dirty, processingStep)(state),
  )(state)

// ====== UTILS

export const isDirty = state => {
  const stepDirty = getProcessingStep(state)
  return ProcessingStep.isTemporary(stepDirty) || !R.equals(stepDirty, _getStep(keys.orig)(state))
}

export const isEditingStep = R.pipe(getProcessingStep, R.isEmpty, R.not)
