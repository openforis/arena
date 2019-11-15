import { exportReducer } from '@webapp/utils/reduxUtils'

import * as ProcessingStepState from '@webapp/loggedin/modules/analysis/processingStep/processingStepState'

import { appUserLogout } from '@webapp/app/actions'
import { surveyCreate, surveyDelete, surveyUpdate } from '@webapp/survey/actions'
import {
  processingStepCalculationCreate,
  processingStepCalculationIndexForEditUpdate,
  processingStepPropsUpdate,
  processingStepUpdate,
} from '@webapp/loggedin/modules/analysis/processingStep/actions'

const actionHandlers = {
  // reset state
  [appUserLogout]: () => ({}),
  [surveyCreate]: () => ({}),
  [surveyUpdate]: () => ({}),
  [surveyDelete]: () => ({}),

  [processingStepUpdate]: (state, { processingStep, processingStepPrev, processingStepNext }) => ProcessingStepState.assocProcessingStep(processingStep, processingStepPrev, processingStepNext)(state),
  [processingStepPropsUpdate]: (state, { props }) => ProcessingStepState.mergeProcessingStepProps(props)(state),

  [processingStepCalculationCreate]: (state, { calculation }) => ProcessingStepState.assocCalculation(calculation)(state),
  [processingStepCalculationIndexForEditUpdate]: (state, { index }) => ProcessingStepState.assocCalculationIndexForEdit(index)(state),
}

export default exportReducer(actionHandlers)