import { exportReducer } from '@webapp/utils/reduxUtils'

import { UserActions } from '@webapp/store/user'
import * as SurveyActions from '../actions'

import * as SurveyStatusState from './state'

const actionHandlers = {
  // Reset state
  [UserActions.USER_LOGOUT]: () => ({}),

  [SurveyActions.surveyCreate]: () => ({}),
  [SurveyActions.surveyUpdate]: () => ({}),
  [SurveyActions.surveyDelete]: () => ({}),

  [SurveyActions.surveyDefsReset]: SurveyStatusState.resetDefsFetched,

  [SurveyActions.surveyDefsLoad]: (state, { draft }) => SurveyStatusState.assocDefsFetched(draft)(state),
}

export default exportReducer(actionHandlers)
