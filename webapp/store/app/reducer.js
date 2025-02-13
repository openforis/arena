import { combineReducers } from 'redux'

import { JobReducer, JobState } from './job'
import { JobsQueueReducer, JobsQueueState } from './jobsQueue'
import { AppSavingReducer, AppSavingState } from './saving'

export default combineReducers({
  [JobState.stateKey]: JobReducer,
  [JobsQueueState.stateKey]: JobsQueueReducer,
  [AppSavingState.stateKey]: AppSavingReducer,
})
