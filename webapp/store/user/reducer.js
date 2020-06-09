import { exportReducer } from '@webapp/utils/reduxUtils'

import * as SurveyActions from '@webapp/store/survey/actions'

import { SystemActions } from '@webapp/store/system'
import * as UserState from './state'
import * as UserActions from './actions'

const actionHandlers = {
  [SystemActions.SYSTEM_INIT]: (state, { user }) => user || state,
  [SystemActions.SYSTEM_RESET]: () => ({}),

  [UserActions.USER_UPDATE]: (state, { user }) => ({ ...state, ...user}),

  [SurveyActions.surveyCreate]: (state, { survey }) => UserState.assocUserPropsOnSurveyCreate(survey)(state),

  [SurveyActions.surveyUpdate]: (state, { survey }) => UserState.assocUserPropsOnSurveyUpdate(survey)(state),

  [SurveyActions.surveyDelete]: (state, { surveyInfo }) => UserState.dissocUserPropsOnSurveyDelete(surveyInfo)(state),
}

export default exportReducer(actionHandlers)
