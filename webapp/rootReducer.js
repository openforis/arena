import { combineReducers } from 'redux'

import app from './app/reducer'
import login from './login/reducer'
import survey from './survey/reducer'

export default combineReducers({
  app,
  login,
  survey,
})
