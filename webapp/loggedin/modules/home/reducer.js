import { combineReducers } from 'redux'

import recordsSummary from './dashboard/recordsSummary/reducer'

import * as RecordsSummaryState from './dashboard/recordsSummary/recordsSummaryState'

export default combineReducers({
  [RecordsSummaryState.stateKey]: recordsSummary,
})
