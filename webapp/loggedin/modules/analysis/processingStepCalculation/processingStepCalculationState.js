import * as R from 'ramda'

import * as ProcessingStepCalculation from '@common/analysis/processingStepCalculation'

import * as AnalysisState from '@webapp/loggedin/modules/analysis/analysisState'

const keys = {
  calculation: 'calculation', // Calculation currently being edited
  calculationOriginal: 'calculationOriginal', // Calculation as it is when editing started (used when canceling edits)
  propsUpdated: 'propsUpdated', // Updated props
}

export const stateKey = 'processingStepCalculation'

const getState = R.pipe(AnalysisState.getState, R.prop(stateKey))
const getStateProp = (prop, defaultValue) => R.pipe(getState, R.propOr(defaultValue, prop))

// ===== READ

export const getCalculation = getStateProp(keys.calculation)
export const getCalculationOriginal = getStateProp(keys.calculationOriginal)

// ===== UPDATE

// ===== UTILS
/**
 * Returns true if processingStepCalculation and processingStepCalculation are not equals
 */
export const isDirty = state => {
  const calculation = getCalculation(state)
  return (
    calculation &&
    (ProcessingStepCalculation.isTemporary(calculation) || !R.equals(calculation, getCalculationOriginal(state)))
  )
}

// ===== UPDATE

export const assocCalculation = R.assoc(keys.calculation)

export const assocCalculationForEdit = calculation =>
  R.pipe(assocCalculation(calculation), R.assoc(keys.calculationOriginal, calculation))
