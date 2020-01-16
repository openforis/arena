import { exportReducer } from '@webapp/utils/reduxUtils'

import * as R from 'ramda'

import * as ProcessingStepState from '@webapp/loggedin/modules/analysis/processingStep/processingStepState'

import { appUserLogout } from '@webapp/app/actions'
import { surveyCreate, surveyDelete, surveyUpdate } from '@webapp/survey/actions'

import { processingChainReset, processingChainSave } from '@webapp/loggedin/modules/analysis/processingChain/actions'
import {
  processingStepReset,
  processingStepCreate,
  processingStepUpdate,
  processingStepPropsUpdate,
  processingStepCalculationsLoad,
  processingStepCalculationCreate,
  processingStepCalculationIndexUpdate,
} from '@webapp/loggedin/modules/analysis/processingStep/actions'

import {
  processingStepCalculationDelete,
  processingStepCalculationReset,
} from '@webapp/loggedin/modules/analysis/processingStepCalculation/actions'

const actionHandlers = {
  // Reset state
  [appUserLogout]: () => ({}),
  [surveyCreate]: () => ({}),
  [surveyUpdate]: () => ({}),
  [surveyDelete]: () => ({}),

  // Chain
  [processingChainReset]: () => ({}),

  [processingChainSave]: (state, { step, calculation }) => ProcessingStepState.saveDirty(step, calculation)(state),

  // Step
  [processingStepReset]: () => ({}),

  [processingStepCreate]: (state, { processingStep }) => ProcessingStepState.assocProcessingStep(processingStep)(state),

  [processingStepUpdate]: (state, { processingStep }) => ProcessingStepState.assocProcessingStep(processingStep)(state),

  [processingStepPropsUpdate]: (state, { props }) => ProcessingStepState.mergeProcessingStepProps(props)(state),

  // Calculations
  [processingStepCalculationsLoad]: (state, { calculations }) =>
    ProcessingStepState.assocCalculations(calculations)(state),

  [processingStepCalculationCreate]: (state, { calculation }) =>
    ProcessingStepState.assocCalculation(calculation)(state),

  [processingStepCalculationIndexUpdate]: (state, { indexFrom, indexTo }) =>
    ProcessingStepState.updateCalculationIndex(indexFrom, indexTo)(state),

  [processingStepCalculationDelete]: (state, { calculation }) =>
    ProcessingStepState.dissocCalculation(calculation)(state),

  [processingStepCalculationReset]: state => ProcessingStepState.dissocTemporaryCalculation(state),
}

export default exportReducer(actionHandlers)
