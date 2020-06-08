import { combineReducers } from 'redux'

import { NotificationReducer, NotificationState } from './notification'
import { LoaderReducer, LoaderState } from './loader'

export default combineReducers({
  [NotificationState.stateKey]: NotificationReducer,
  [LoaderState.stateKey]: LoaderReducer,
})
