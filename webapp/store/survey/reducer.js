import { combineReducers } from 'redux'

import { SurveyInfoReducer, SurveyInfoState } from './surveyInfo'
import nodeDefs from './nodeDefs/reducer'
import nodeDefsValidation from './nodeDefsValidation/reducer'
import categories from './categories/reducer'
import taxonomies from './taxonomies/reducer'
import { SurveyStatusState, SurveyStatusReducer } from './status'

export default combineReducers({
  [SurveyInfoState.stateKey]: SurveyInfoReducer,
  nodeDefs,
  nodeDefsValidation,
  categories,
  taxonomies,
  [SurveyStatusState.stateKey]: SurveyStatusReducer,
})
