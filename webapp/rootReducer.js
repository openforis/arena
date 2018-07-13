import { combineReducers } from 'redux'

import app from './app/reducer'
import login from './login/reducer'
import appModules from './appModules/reducer'

export default combineReducers({
  app,
  login,
  appModules
})
