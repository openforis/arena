import { exportReducer } from '@webapp/utils/reduxUtils'

import * as RecordsSummaryState from './recordsSummaryState'

import { appUserLogout } from '@webapp/app/actions'
import { surveyCreate, surveyDelete, surveyUpdate } from '@webapp/survey/actions'
import { recordsSummaryUpdate } from './actions'

const actionHandlers = {
  // reset state
  [appUserLogout]: () => ({}),
  [surveyCreate]: () => ({}),
  [surveyUpdate]: () => ({}),
  [surveyDelete]: () => ({}),

  // records summary
  [recordsSummaryUpdate]: (state, { timeRange, from, to, counts }) => RecordsSummaryState.assocSummary(timeRange, from, to, counts)(state)

}

export default exportReducer(actionHandlers)
