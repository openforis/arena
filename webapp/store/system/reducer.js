import { combineReducers } from 'redux'

import { SystemErrorReducer, SystemErrorState } from './systemError'
import { SystemStatusReducer, SystemStatusState } from './status'
import { ServiceErrorReducer, ServiceErrorState } from './serviceError'

export default combineReducers({
  [SystemErrorState.stateKey]: SystemErrorReducer,
  [SystemStatusState.stateKey]: SystemStatusReducer,
  [ServiceErrorState.stateKey]: ServiceErrorReducer,
})
