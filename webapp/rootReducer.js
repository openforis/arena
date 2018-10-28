import { combineReducers } from 'redux'

// import survey from './survey/reducer'
// == survey reducer
import info from './survey/surveyInfo/reducer'
import form from './survey/form/reducer'
import nodeDefs from './survey/nodeDef/reducer'

const survey = combineReducers({
  info,
  nodeDefs,
  form,
})

// == app reducer
import app from './app/reducer'
import login from './login/reducer'

export default combineReducers({
  app,
  login,
  survey,
})