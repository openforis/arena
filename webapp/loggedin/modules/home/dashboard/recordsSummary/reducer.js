import {exportReducer} from '@webapp/utils/reduxUtils'

import {appUserLogout} from '@webapp/app/actions'
import {surveyCreate, surveyDelete, surveyUpdate} from '@webapp/survey/actions'
import * as RecordsSummaryState from './recordsSummaryState'
import {recordsSummaryUpdate} from './actions'

const actionHandlers = {
  // Reset state
  [appUserLogout]: () => ({}),
  [surveyCreate]: () => ({}),
  [surveyUpdate]: () => ({}),
  [surveyDelete]: () => ({}),

  // Records summary
  [recordsSummaryUpdate]: (state, {timeRange, from, to, counts}) => RecordsSummaryState.assocSummary(timeRange, from, to, counts)(state)

}

export default exportReducer(actionHandlers)
