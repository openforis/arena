import { exportReducer } from '@webapp/utils/reduxUtils'

import { appUserLogout } from '@webapp/app/actions'
import { SurveyActions } from '@webapp/store/survey'
import * as RecordsSummaryState from './recordsSummaryState'
import { recordsSummaryUpdate } from './actions'

const actionHandlers = {
  // Reset state
  [appUserLogout]: () => ({}),
  [SurveyActions.surveyCreate]: () => ({}),
  [SurveyActions.surveyUpdate]: () => ({}),
  [SurveyActions.surveyDelete]: () => ({}),

  // Records summary
  [recordsSummaryUpdate]: (state, { timeRange, from, to, counts }) =>
    RecordsSummaryState.assocSummary(timeRange, from, to, counts)(state),
}

export default exportReducer(actionHandlers)
