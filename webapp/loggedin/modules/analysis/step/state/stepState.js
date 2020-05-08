import * as R from 'ramda'

import * as Chain from '@common/analysis/processingChain'
import * as Step from '@common/analysis/processingStep'
import * as Calculation from '@common/analysis/processingStepCalculation'

import * as AnalysisState from '@webapp/loggedin/modules/analysis/analysisState'
import * as ChainState from '@webapp/loggedin/modules/analysis/chain/state'

export const stateKey = 'processingStep'

const keys = {
  dirty: 'dirty',
  orig: 'orig',
  stepPrevAttributeUuids: 'stepPrevAttributeUuids',
}

// ====== READ

const getState = R.pipe(AnalysisState.getState, R.prop(stateKey))

const _getStep = (stepKey) => R.pipe(getState, R.propOr({}, stepKey))

export const getProcessingStep = _getStep(keys.dirty)

export const getProcessingStepPrev = (state) => {
  const chain = ChainState.getProcessingChain(state)
  const step = getProcessingStep(state)
  return Chain.getStepPrev(step)(chain)
}

export const getProcessingStepNext = (state) => {
  const chain = ChainState.getProcessingChain(state)
  const step = getProcessingStep(state)
  return Chain.getStepNext(step)(chain)
}

export const getStepPrevCalculationAttributeUuids = R.pipe(getState, R.propOr([], keys.stepPrevAttributeUuids))

// ====== UPDATE

// Step
export const assocProcessingStep = (processingStep) =>
  R.pipe(R.assoc(keys.dirty, processingStep), R.assoc(keys.orig, processingStep))

const _updateStep = (key, fn) => (state) => R.pipe(R.prop(key), fn, (step) => R.assoc(key, step, state))(state)
const _updateStepDirty = (fn) => _updateStep(keys.dirty, fn)
const _updateStepOrig = (fn) => _updateStep(keys.orig, fn)

export const mergeProcessingStepProps = (props) => _updateStepDirty(Step.mergeProps(props))

export const saveDirty = (step, calculation) => (state) =>
  R.pipe(R.when(R.always(Boolean(calculation)), Step.assocCalculation(calculation)), (stepUpdate) =>
    assocProcessingStep(stepUpdate)(state)
  )(step)

// Calculations

const _assocCalculations = (calculations) =>
  R.pipe(_updateStepDirty(Step.assocCalculations(calculations)), _updateStepOrig(Step.assocCalculations(calculations)))

const _assocStepPrevCalculationAttributeUuids = R.assoc(keys.stepPrevAttributeUuids)

export const assocStepData = (calculations, stepPrevAttributeUuids) =>
  R.pipe(_assocCalculations(calculations), _assocStepPrevCalculationAttributeUuids(stepPrevAttributeUuids))

export const assocCalculation = (calculation) => _updateStepDirty(Step.assocCalculation(calculation))

export const updateCalculationIndex = (indexFrom, indexTo) => (processingStepState) =>
  R.pipe(R.prop(keys.dirty), Step.getCalculations, R.move(indexFrom, indexTo), (calculations) => {
    const calculationsUpdate = calculations.map((calculation, idx) => Calculation.assocIndex(idx)(calculation))
    return _updateStepDirty(Step.assocCalculations(calculationsUpdate))(processingStepState)
  })(processingStepState)

export const updateEntityUuid = (entityDefUuid) => _updateStepDirty(Step.assocEntityUuid(entityDefUuid))

export const dissocTemporaryCalculation = _updateStepDirty(Step.dissocTemporaryCalculation)

export const dissocCalculation = (calculation) => (state) =>
  R.pipe(R.prop(keys.dirty), Step.dissocCalculation(calculation), (processingStep) =>
    R.assoc(keys.dirty, processingStep)(state)
  )(state)

// ====== UTILS

export const isDirty = (state) => {
  const stepDirty = getProcessingStep(state)
  return Step.isTemporary(stepDirty) || !R.equals(stepDirty, _getStep(keys.orig)(state))
}

export const isEditingStep = R.pipe(getProcessingStep, R.isEmpty, R.not)
