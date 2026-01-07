import { exportReducer } from '@webapp/utils/reduxUtils'

import { SystemActionTypes } from '@webapp/store/system/actionTypes'

import * as SurveyActions from '../actions'

const actionHandlers = {
  // Reset state
  [SystemActionTypes.SYSTEM_RESET]: () => ({}),

  [SurveyActions.surveyCreate]: () => ({}),
  [SurveyActions.surveyUpdate]: () => ({}),
  [SurveyActions.surveyDelete]: () => ({}),

  [SurveyActions.surveyDefsReset]: () => ({}),

  // Survey load
  [SurveyActions.surveyDefsLoad]: (_state, { refData }) => refData,
}

export default exportReducer(actionHandlers)
