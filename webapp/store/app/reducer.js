import { combineReducers } from 'redux'

import { JobReducer, JobState } from './job'

export default combineReducers({
  [JobState.stateKey]: JobReducer,
})
