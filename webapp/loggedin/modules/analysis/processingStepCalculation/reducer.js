import { exportReducer } from '@webapp/utils/reduxUtils'

import * as ProcessingStepCalculationState from './processingStepCalculationState'
import { processingStepCalculationForEditUpdate, processingStepCalculationCreate } from '../processingStep/actions'
import { processingStepCalculationUpdate } from './actions'

const actionHandlers = {
  [processingStepCalculationForEditUpdate]: (state, { calculation }) =>
    ProcessingStepCalculationState.assocCalculationForEdit(calculation)(state),

  [processingStepCalculationCreate]: (state, { calculation }) =>
    ProcessingStepCalculationState.assocCalculationForEdit(calculation)(state),

  [processingStepCalculationUpdate]: (state, { calculation }) =>
    ProcessingStepCalculationState.assocCalculation(calculation)(state),
}

export default exportReducer(actionHandlers)
