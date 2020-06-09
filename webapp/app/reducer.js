import { assocActionProps, exportReducer } from '@webapp/utils/reduxUtils'

import { SurveyActions } from '@webapp/store/survey'
import * as AppState from './appState'

import { appPropsChange } from './actions'

const actionHandlers = {
  [appPropsChange]: (state, { survey: _survey, ...props }) => assocActionProps(state, props),

  // ====== user

  [SurveyActions.surveyCreate]: (state, { survey }) => AppState.assocUserPropsOnSurveyCreate(survey)(state),

  [SurveyActions.surveyUpdate]: (state, { survey }) => AppState.assocUserPropsOnSurveyUpdate(survey)(state),

  [SurveyActions.surveyDelete]: (state, { surveyInfo }) => AppState.dissocUserPropsOnSurveyDelete(surveyInfo)(state),
}

export default exportReducer(actionHandlers)
