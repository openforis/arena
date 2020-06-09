import { exportReducer } from '@webapp/utils/reduxUtils'

import { appPropsChange, appUserLogout } from '@webapp/app/actions'
// import { SurveyActions } from '@webapp/store/survey'

// import * as UserState from './state'

const actionHandlers = {
  [appPropsChange]: (state, { user }) => user || state,
  [appUserLogout]: () => ({}),

  /*[SurveyActions.surveyCreate]: (state, { survey }) => UserState.assocUserPropsOnSurveyCreate(survey)(state),

  [SurveyActions.surveyUpdate]: (state, { survey }) => UserState.assocUserPropsOnSurveyUpdate(survey)(state),

  [SurveyActions.surveyDelete]: (state, { surveyInfo }) => UserState.dissocUserPropsOnSurveyDelete(surveyInfo)(state),*/
}

export default exportReducer(actionHandlers)
