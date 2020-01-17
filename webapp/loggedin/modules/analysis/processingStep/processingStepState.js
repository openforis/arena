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

const _getStep = stepKey => R.pipe(getState, R.propOr({}, stepKey))

export const getProcessingStep = _getStep(keys.dirty)

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

// ====== UPDATE

// Step
export const assocProcessingStep = processingStep =>
  R.pipe(R.assoc(keys.dirty, processingStep), R.assoc(keys.orig, processingStep))

const _updateStep = (key, fn) => state => R.pipe(R.prop(key), fn, step => R.assoc(key, step, state))(state)
const _updateStepDirty = fn => _updateStep(keys.dirty, fn)
const _updateStepOrig = fn => _updateStep(keys.orig, fn)

export const mergeProcessingStepProps = props => _updateStepDirty(ProcessingStep.mergeProps(props))

export const saveDirty = (step, calculation) => state =>
  R.pipe(R.when(R.always(Boolean(calculation)), ProcessingStep.assocCalculation(calculation)), stepUpdate =>
    assocProcessingStep(stepUpdate)(state),
  )(step)

// Calculations

export const assocCalculations = calculations =>
  R.pipe(
    _updateStepDirty(ProcessingStep.assocCalculations(calculations)),
    _updateStepOrig(ProcessingStep.assocCalculations(calculations)),
  )

export const assocCalculation = calculation => _updateStepDirty(ProcessingStep.assocCalculation(calculation))

export const updateCalculationIndex = (indexFrom, indexTo) => processingStepState =>
  R.pipe(R.prop(keys.dirty), ProcessingStep.getCalculations, R.move(indexFrom, indexTo), calculations => {
    const calculationsUpdate = calculations.map((calculation, idx) =>
      ProcessingStepCalculation.assocIndex(idx)(calculation),
    )
    return _updateStepDirty(ProcessingStep.assocCalculations(calculationsUpdate))(processingStepState)
  })(processingStepState)

export const updateEntityUuid = entityDefUuid => _updateStepDirty(ProcessingStep.assocEntityUuid(entityDefUuid))

export const dissocTemporaryCalculation = _updateStepDirty(ProcessingStep.dissocTemporaryCalculation)

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
