import { exportReducer } from '@webapp/utils/reduxUtils'

import { UserActions } from '@webapp/store/user'
import { SurveyActions } from '@webapp/store/survey'
import * as RecordsSummaryState from './recordsSummaryState'
import { recordsSummaryUpdate } from './actions'

const actionHandlers = {
  // Reset state
  [UserActions.USER_LOGOUT]: () => ({}),
  [SurveyActions.surveyCreate]: () => ({}),
  [SurveyActions.surveyUpdate]: () => ({}),
  [SurveyActions.surveyDelete]: () => ({}),

  // Records summary
  [recordsSummaryUpdate]: (state, { timeRange, from, to, counts }) =>
    RecordsSummaryState.assocSummary(timeRange, from, to, counts)(state),
}

export default exportReducer(actionHandlers)
