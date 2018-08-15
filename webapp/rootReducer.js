import { combineReducers } from 'redux'

import app from './app/reducer'
import login from './login/reducer'
import record from './record/reducer'
import survey from './survey/reducer'

export default combineReducers({
  app,
  login,
  record,
  survey,
})
