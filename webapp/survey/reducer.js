import { combineReducers } from 'redux'

import info from './surveyInfo/reducer'
import nodeDefs from './nodeDefs/reducer'
import categories from './categories/reducer'
import taxonomies from './taxonomies/reducer'
import status from './status/reducer'

export default combineReducers({
  info,
  nodeDefs,
  categories,
  taxonomies,
  status,
})