import * as R from 'ramda'

import * as ProcessingStepCalculation from '@common/analysis/processingStepCalculation'

import * as AnalysisState from '@webapp/loggedin/modules/analysis/analysisState'

export const stateKey = 'processingStepCalculation'

const keys = {
  dirty: 'dirty', // Calculation currently being edited
  orig: 'orig', // Calculation as it was when editing started (used when canceling edits)
}

const getState = R.pipe(AnalysisState.getState, R.prop(stateKey))
const getStateProp = (prop, defaultValue) => R.pipe(getState, R.propOr(defaultValue, prop))

// ===== READ

const getCalculationOrig = getStateProp(keys.orig, {})
export const getCalculation = getStateProp(keys.dirty, {})

// ===== UPDATE

export const assocCalculationDirty = R.assoc(keys.dirty)
export const assocCalculationOrig = R.assoc(keys.orig)

export const assocCalculation = calculation =>
  R.pipe(assocCalculationDirty(calculation), assocCalculationOrig(calculation))

export const assocCalculationDirtyNodeDefUuid = nodeDefUuid => state =>
  R.pipe(R.prop(keys.dirty), ProcessingStepCalculation.assocNodeDefUuid(nodeDefUuid), calculation =>
    R.assoc(keys.dirty, calculation)(state),
  )(state)

export const saveDirty = assocCalculation

// ===== UTILS
/**
 * Returns true if processingStepCalculation and processingStepCalculation are not equals
 */
export const isDirty = state => {
  const calculationDirty = getCalculation(state)
  return (
    ProcessingStepCalculation.isTemporary(calculationDirty) || !R.equals(calculationDirty, getCalculationOrig(state))
  )
}

export const isEditingCalculation = R.pipe(getCalculation, R.isEmpty, R.not)
