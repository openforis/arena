import { combineReducers } from 'redux'

import { SystemErrorReducer, SystemErrorState } from './error'
import { I18nReducer, I18nState } from './i18n'
import { StatusReducer, StatusState } from './status'

export default combineReducers({
  [SystemErrorState.stateKey]: SystemErrorReducer,
  [I18nState.stateKey]: I18nReducer,
  [StatusState.stateKey]: StatusReducer,
})
