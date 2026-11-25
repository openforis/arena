import { combineReducers } from 'redux'

import { SystemInfoReducer, SystemInfoState } from './info'
import { ServiceErrorReducer, ServiceErrorState } from './serviceError'
import { SystemStatusReducer, SystemStatusState } from './status'
import { SystemErrorReducer, SystemErrorState } from './systemError'

export default combineReducers({
  [SystemInfoState.stateKey]: SystemInfoReducer,
  [SystemErrorState.stateKey]: SystemErrorReducer,
  [SystemStatusState.stateKey]: SystemStatusReducer,
  [ServiceErrorState.stateKey]: ServiceErrorReducer,
})
