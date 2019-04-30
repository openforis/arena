import { combineReducers } from 'redux'

import categoryEdit from './categoryEdit/reducer'
import record from './record/reducer'
import surveyForm from './surveyForm/reducer'
import taxonomyEdit from './taxonomyEdit/reducer'

export default combineReducers({
  categoryEdit,
  record,
  surveyForm,
  taxonomyEdit,
})