import { combineReducers } from 'redux'

import { SystemInfoReducer, SystemInfoState } from './info'
import { SystemErrorReducer, SystemErrorState } from './systemError'
import { SystemStatusReducer, SystemStatusState } from './status'
import { ServiceErrorReducer, ServiceErrorState } from './serviceError'

export default combineReducers({
  [SystemInfoState.stateKey]: SystemInfoReducer,
  [SystemErrorState.stateKey]: SystemErrorReducer,
  [SystemStatusState.stateKey]: SystemStatusReducer,
  [ServiceErrorState.stateKey]: ServiceErrorReducer,
})
