import * as R from 'ramda'

import * as ProcessingStepCalculation from '@common/analysis/processingStepCalculation'

import * as AnalysisState from '@webapp/loggedin/modules/analysis/analysisState'

const keys = {
  calculationTemp: 'calculationTemp', // Calculation currently being edited
  calculation: 'calculation', // Calculation as it was when editing started (used when canceling edits)
  validation: 'validation', // Validation of calculation currently being edited
}

export const stateKey = 'processingStepCalculation'

const getState = R.pipe(AnalysisState.getState, R.prop(stateKey))
const getStateProp = (prop, defaultValue) => R.pipe(getState, R.propOr(defaultValue, prop))

// ===== READ

export const getCalculation = getStateProp(keys.calculation)
export const getCalculationTemp = getStateProp(keys.calculationTemp)
export const getValidation = getStateProp(keys.validation)

// ===== UPDATE

// ===== UTILS
/**
 * Returns true if processingStepCalculation and processingStepCalculation are not equals
 */
export const isDirty = state => {
  const calculationTemp = getCalculationTemp(state)
  return (
    calculationTemp &&
    (ProcessingStepCalculation.isTemporary(calculationTemp) || !R.equals(calculationTemp, getCalculation(state)))
  )
}

// ===== UPDATE

export const assocCalculationTemp = (calculation, validation) =>
  R.pipe(R.assoc(keys.calculationTemp, calculation), R.assoc(keys.validation, validation))

export const assocCalculationForEdit = calculation =>
  R.pipe(assocCalculationTemp(calculation), R.assoc(keys.calculation, calculation), R.dissoc(keys.validation))
