import { SystemActions } from '@webapp/store/system'
import { exportReducer } from '@webapp/utils/reduxUtils'

import * as SurveyActions from '../actions'

import * as SurveyStatusState from './state'

const actionHandlers = {
  // Reset state
  [SystemActions.SYSTEM_RESET]: () => ({}),

  [SurveyActions.surveyCreate]: () => ({}),
  [SurveyActions.surveyUpdate]: () => ({}),
  [SurveyActions.surveyDelete]: () => ({}),

  [SurveyActions.surveyDefsReset]: SurveyStatusState.resetDefsFetched,

  [SurveyActions.surveyDefsLoad]: (state, { draft, includeAnalysis, validate }) =>
    SurveyStatusState.assocDefsFetched({ draft, includeAnalysis, validate })(state),
}

export default exportReducer(actionHandlers)
