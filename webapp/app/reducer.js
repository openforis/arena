import { assocActionProps, exportReducer } from '@webapp/utils/reduxUtils'

import { SurveyActions } from '@webapp/store/survey'
import * as AppState from './appState'

import { appPropsChange, appUserLogout, appSavingUpdate, systemErrorThrow } from './actions'

const actionHandlers = {
  [systemErrorThrow]: (state, { error }) => AppState.assocSystemError(error)(state),

  [appPropsChange]: (state, { survey: _survey, ...props }) => assocActionProps(state, props),

  // ====== user

  [appUserLogout]: (state) => AppState.logoutUser(state),

  [SurveyActions.surveyCreate]: (state, { survey }) => AppState.assocUserPropsOnSurveyCreate(survey)(state),

  [SurveyActions.surveyUpdate]: (state, { survey }) => AppState.assocUserPropsOnSurveyUpdate(survey)(state),

  [SurveyActions.surveyDelete]: (state, { surveyInfo }) => AppState.dissocUserPropsOnSurveyDelete(surveyInfo)(state),

  // ====== saving
  [appSavingUpdate]: (state, { saving }) => AppState.assocSaving(saving)(state),
}

export default exportReducer(actionHandlers)
