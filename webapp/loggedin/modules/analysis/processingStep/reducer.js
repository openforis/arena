import { exportReducer } from '@webapp/utils/reduxUtils'

import * as ProcessingStepState from '@webapp/loggedin/modules/analysis/processingStep/processingStepState'

import { appUserLogout } from '@webapp/app/actions'
import { surveyCreate, surveyDelete, surveyUpdate } from '@webapp/survey/actions'
import {
  processingStepPropsUpdate,
  processingStepUpdate,
} from '@webapp/loggedin/modules/analysis/processingStep/actions'

const actionHandlers = {
  // reset state
  [appUserLogout]: () => ({}),
  [surveyCreate]: () => ({}),
  [surveyUpdate]: () => ({}),
  [surveyDelete]: () => ({}),

  [processingStepUpdate]: (state, { processingStep }) => processingStep,
  [processingStepPropsUpdate]: (state, { props }) => ProcessingStepState.mergeProcessingStepProps(props)(state),
}

export default exportReducer(actionHandlers)