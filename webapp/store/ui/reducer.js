import { combineReducers } from 'redux'

import { NotificationReducer, NotificationState } from './notification'
import { LoaderReducer, LoaderState } from './loader'
import { DialogConfirmReducer, DialogConfirmState } from './dialogConfirm'

export default combineReducers({
  [NotificationState.stateKey]: NotificationReducer,
  [LoaderState.stateKey]: LoaderReducer,
  [DialogConfirmState.stateKey]: DialogConfirmReducer,
})
