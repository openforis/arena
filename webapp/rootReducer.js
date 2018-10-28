import { combineReducers } from 'redux'

import app from './app/reducer'
import login from './login/reducer'
// import survey from './survey/reducer'
import info from './survey/surveyInfo/reducer'

const survey = combineReducers({
  info,
})

export default combineReducers({
  app,
  login,
  survey,
})