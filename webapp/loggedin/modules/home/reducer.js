import { combineReducers } from 'redux'

import recordsSummary from './dashboard/recordsSummary/reducer'
import activityLog from './dashboard/activityLog/reducer'

import * as RecordsSummaryState from './dashboard/recordsSummary/recordsSummaryState'
import * as ActivityLogState from './dashboard/activityLog/activityLogState'

export default combineReducers({
  [RecordsSummaryState.stateKey]: recordsSummary,
  [ActivityLogState.stateKey]: activityLog,
})
