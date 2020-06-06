import { combineReducers } from 'redux'

import { SurveyInfoReducer, SurveyInfoState } from './surveyInfo'
import { NodeDefsReducer, NodeDefsState } from './nodeDefs'
import { NodeDefsValidationReducer, NodeDefsValidationState } from './nodeDefsValidation'
import { CategoryReducer, CategoriesState } from './categories'
import { TaxonomiesReducer, TaxonomiesState } from './taxonomies'
import { SurveyStatusReducer, SurveyStatusState } from './status'

export default combineReducers({
  [SurveyInfoState.stateKey]: SurveyInfoReducer,
  [NodeDefsState.stateKey]: NodeDefsReducer,
  [NodeDefsValidationState.stateKey]: NodeDefsValidationReducer,
  [CategoriesState.stateKey]: CategoryReducer,
  [TaxonomiesState.stateKey]: TaxonomiesReducer,
  [SurveyStatusState.stateKey]: SurveyStatusReducer,
})
