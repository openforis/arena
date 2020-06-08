import { combineReducers } from 'redux'

import { NotificationReducer, NotificationState } from './notification'

export default combineReducers({
  [NotificationState.stateKey]: NotificationReducer,
})
