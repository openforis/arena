import { combineReducers } from 'redux'

import surveys from './surveyList/reducer'
import surveyCreate from './surveyCreate/reducer'

export default combineReducers({
  surveys,
  surveyCreate,
})