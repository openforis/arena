import { exportReducer } from '@webapp/utils/reduxUtils'

import * as ProcessingStepCalculationState from './processingStepCalculationState'
import {
  processingStepCalculationForEditUpdate,
  processingStepCalculationCreate,
  processingStepCalculationEditCancel,
} from '../processingStep/actions'
import { processingStepCalculationTempUpdate } from './actions'

const actionHandlers = {
  [processingStepCalculationForEditUpdate]: (state, { calculation }) =>
    ProcessingStepCalculationState.assocCalculationForEdit(calculation)(state),

  [processingStepCalculationCreate]: (state, { calculation }) =>
    ProcessingStepCalculationState.assocCalculationForEdit(calculation)(state),

  [processingStepCalculationTempUpdate]: (state, { calculation }) =>
    ProcessingStepCalculationState.assocCalculationTemp(calculation)(state),

  [processingStepCalculationEditCancel]: () => ({}),
}

export default exportReducer(actionHandlers)
