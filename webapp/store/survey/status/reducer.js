import { exportReducer } from '@webapp/utils/reduxUtils'

import * as AppActions from '@webapp/app/actions'

import * as SurveyActions from '../actions'

import * as SurveyStatusState from './state'

const actionHandlers = {
  // Reset state
  [AppActions.appUserLogout]: () => ({}),

  [SurveyActions.surveyCreate]: () => ({}),
  [SurveyActions.surveyUpdate]: () => ({}),
  [SurveyActions.surveyDelete]: () => ({}),

  [SurveyActions.surveyDefsReset]: SurveyStatusState.resetDefsFetched,

  [SurveyActions.surveyDefsLoad]: (state, { draft }) => SurveyStatusState.assocDefsFetched(draft)(state),
}

export default exportReducer(actionHandlers)
