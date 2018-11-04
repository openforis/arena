import { combineReducers } from 'redux'

// == app reducer
import app from './app/reducer'
import login from './login/reducer'
import survey from './survey/reducer'

import home from './appModules/home/reducer'
import surveyForm from './appModules/surveyForm/reducer'

import record from './appModules/surveyForm/record/reducer'

export default combineReducers({
  app,
  login,
  // survey reducer
  survey,
  // appModules reducers
  home,
  surveyForm,
})