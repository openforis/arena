import { combineReducers } from 'redux'

import { ServiceErrorReducer, ServiceErrorState } from './serviceError'
import { SystemStatusReducer, SystemStatusState } from './status'
import { SystemErrorReducer, SystemErrorState } from './systemError'

export default combineReducers({
  [SystemErrorState.stateKey]: SystemErrorReducer,
  [SystemStatusState.stateKey]: SystemStatusReducer,
  [ServiceErrorState.stateKey]: ServiceErrorReducer,
})
