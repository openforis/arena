import { exportReducer } from '@webapp/utils/reduxUtils'

import { SurveyActions } from '@webapp/store/survey'
import * as RecordsSummaryState from './recordsSummaryState'
import { recordsSummaryUpdate } from './actions'
import { SystemActions } from '@webapp/store/system'

const actionHandlers = {
  // Reset state
  [SystemActions.SYSTEM_RESET]: () => ({}),
  [SurveyActions.surveyCreate]: () => ({}),
  [SurveyActions.surveyUpdate]: () => ({}),
  [SurveyActions.surveyDelete]: () => ({}),

  // Records summary
  [recordsSummaryUpdate]: (state, { timeRange, from, to, counts }) =>
    RecordsSummaryState.assocSummary(timeRange, from, to, counts)(state),
}

export default exportReducer(actionHandlers)
