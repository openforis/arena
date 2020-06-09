import { combineReducers } from 'redux'

import { JobReducer, JobState } from './job'
import { AppSavingReducer, AppSavingState } from './saving'

export default combineReducers({
  [JobState.stateKey]: JobReducer,
  [AppSavingState.stateKey]: AppSavingReducer,
})
