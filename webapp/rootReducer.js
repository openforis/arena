import { combineReducers } from 'redux'

import app from './app/reducer'
import login from './login/reducer'
import surveyDashboard from './surveyDashboard/reducer'

export default combineReducers({
  app,
  login,
  surveyDashboard
})
