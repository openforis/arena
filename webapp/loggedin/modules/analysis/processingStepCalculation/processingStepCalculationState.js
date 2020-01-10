import * as R from 'ramda'

import * as ProcessingStepCalculation from '@common/analysis/processingStepCalculation'

import * as AnalysisState from '@webapp/loggedin/modules/analysis/analysisState'

export const stateKey = 'processingStepCalculation'

const keys = {
  calculationDirty: 'calculationDirty', // Calculation currently being edited
  calculationOrig: 'calculationOrig', // Calculation as it was when editing started (used when canceling edits)
}

const getState = R.pipe(AnalysisState.getState, R.prop(stateKey))
const getStateProp = (prop, defaultValue) => R.pipe(getState, R.propOr(defaultValue, prop))

// ===== READ

export const getCalculationOrig = getStateProp(keys.calculationOrig)
export const getCalculationDirty = getStateProp(keys.calculationDirty)

// ===== UPDATE

export const assocCalculationDirty = R.assoc(keys.calculationDirty)
export const assocCalculationOrig = R.assoc(keys.calculationOrig)

export const assocCalculationForEdit = calculation =>
  R.pipe(assocCalculationDirty(calculation), assocCalculationOrig(calculation))

export const assocCalculationDirtyNodeDefUuid = nodeDefUuid => state =>
  R.pipe(
    R.prop(keys.calculationDirty),
    ProcessingStepCalculation.assocNodeDefUuid(nodeDefUuid),
    R.assoc(keys.calculationDirty),
  )(state)

// ===== UTILS
/**
 * Returns true if processingStepCalculation and processingStepCalculation are not equals
 */
export const isDirty = state => {
  const calculationDirty = getCalculationDirty(state)
  return (
    calculationDirty &&
    (ProcessingStepCalculation.isTemporary(calculationDirty) || !R.equals(calculationDirty, getCalculationOrig(state)))
  )
}
