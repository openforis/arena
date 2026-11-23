import { exportReducer } from '@webapp/utils/reduxUtils'

import { SystemActionTypes } from '@webapp/store/system/actionTypes'
import * as SurveyActions from '@webapp/store/survey/actions'

import * as UserState from './state'
import * as UserActions from './actions'

const actionHandlers = {
  [SystemActionTypes.SYSTEM_INIT]: (state, { user }) => user || state,
  [SystemActionTypes.SYSTEM_RESET]: () => ({}),

  [UserActions.USER_UPDATE]: (state, { user }) => ({ ...state, ...user }),

  [SurveyActions.surveyCreate]: (state, { survey }) => UserState.assocUserPropsOnSurveyCreate(survey)(state),

  [SurveyActions.surveyUpdate]: (state, { survey }) => UserState.assocUserPropsOnSurveyUpdate(survey)(state),

  [SurveyActions.surveyDelete]: (state, { surveyInfo }) => UserState.dissocUserPropsOnSurveyDelete(surveyInfo)(state),
}

export default exportReducer(actionHandlers)
