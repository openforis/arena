import { combineReducers } from 'redux'

// == survey reducer
import info from './survey/surveyInfo/reducer'
import form from './survey/form/reducer'
import nodeDefs from './survey/nodeDefs/reducer'
import codeLists from './survey/codeLists/reducer'
import codeListEdit from './appModules/designer/codeListEdit/reducer'
import taxonomies from './survey/taxonomies/reducer'
import taxonomyEdit from './appModules/designer/taxonomyEdit/reducer'
import record from './survey/record/reducer'

const survey = combineReducers({
  info,
  form, //TODO refactor form to nodeDef
  nodeDefs,
  codeLists,
  codeListEdit,
  taxonomies,
  taxonomyEdit,
  record,
})

// == app reducer
import app from './app/reducer'
import login from './login/reducer'

import home from './appModules/home/reducer'

export default combineReducers({
  app,
  login,
  // survey reducer
  survey,
  // appModules reducers
  home,
})