import { exportReducer } from '@webapp/utils/reduxUtils'

import * as SystemActions from '@webapp/store/system/actions'
import * as SurveyActions from '@webapp/store/survey/actions'

import * as UserState from './state'
import * as UserActions from './actions'

const actionHandlers = {
  [SystemActions.SYSTEM_INIT]: (state, { user }) => user || state,
  [UserActions.USER_INIT]: (state, { user }) => user || state,
  [UserActions.USER_UPDATE]: (state, { user }) => ({ ...state, ...user}),
  [UserActions.USER_LOGOUT]: () => ({}),

  [SurveyActions.surveyCreate]: (state, { survey }) => UserState.assocUserPropsOnSurveyCreate(survey)(state),

  [SurveyActions.surveyUpdate]: (state, { survey }) => UserState.assocUserPropsOnSurveyUpdate(survey)(state),

  [SurveyActions.surveyDelete]: (state, { surveyInfo }) => UserState.dissocUserPropsOnSurveyDelete(surveyInfo)(state),
}

export default exportReducer(actionHandlers)
