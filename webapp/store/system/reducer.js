import { combineReducers } from 'redux'

import { SystemErrorReducer, SystemErrorState } from './error'
import { I18nReducer, I18nState } from './i18n'
import { SystemStatusReducer, SystemStatusState } from './status'

export default combineReducers({
  [SystemErrorState.stateKey]: SystemErrorReducer,
  [I18nState.stateKey]: I18nReducer,
  [SystemStatusState.stateKey]: SystemStatusReducer,
})
