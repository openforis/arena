import { combineReducers } from 'redux'

import { SurveyInfoReducer, SurveyInfoState } from './surveyInfo'
import nodeDefs from './nodeDefs/reducer'
import nodeDefsValidation from './nodeDefsValidation/reducer'
import { CategoryReducer, CategoriesState } from './categories'
import { TaxonomiesReducer, TaxonomiesState } from './taxonomies'
import { SurveyStatusReducer, SurveyStatusState } from './status'

export default combineReducers({
  [SurveyInfoState.stateKey]: SurveyInfoReducer,
  nodeDefs,
  nodeDefsValidation,
  [CategoriesState.stateKey]: CategoryReducer,
  [TaxonomiesState.stateKey]: TaxonomiesReducer,
  [SurveyStatusState.stateKey]: SurveyStatusReducer,
})
