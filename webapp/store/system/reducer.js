import { combineReducers } from 'redux'

import { SystemErrorReducer, SystemErrorState } from './error'

export default combineReducers({
  [SystemErrorState.stateKey]: SystemErrorReducer,
})
