import { combineReducers } from 'redux'

// import survey from './survey/reducer'
// == survey reducer
import info from './survey/surveyInfo/reducer'
import form from './survey/form/reducer'
import nodeDefs from './survey/nodeDefs/reducer'
import codeLists from './survey/codeLists/reducer'

const survey = combineReducers({
  info,
  form,
  nodeDefs,
  codeLists,
})

// == app reducer
import app from './app/reducer'
import login from './login/reducer'

export default combineReducers({
  app,
  login,
  survey,
})