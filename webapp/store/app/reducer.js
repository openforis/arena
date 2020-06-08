import { combineReducers } from 'redux'

import { ErrorReducer as error } from './error'

export default combineReducers({
  error,
})
