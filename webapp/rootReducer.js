import { combineReducers } from 'redux'

import app from './app/reducer'
import login from './login/reducer'

export default combineReducers({
  app,
  login
})
