import { combineReducers } from 'redux'

import { CategoriesReducer, CategoriesState } from './categories'
import { NodeDefsReducer, NodeDefsState } from './nodeDefs'
import { NodeDefsIndexReducer, NodeDefsIndexState } from './nodeDefsIndex'
import { NodeDefsValidationReducer, NodeDefsValidationState } from './nodeDefsValidation'
import { SurveyStatusReducer, SurveyStatusState } from './status'
import { SurveyInfoReducer, SurveyInfoState } from './surveyInfo'
import { TaxonomiesReducer, TaxonomiesState } from './taxonomies'

export default combineReducers({
  [SurveyInfoState.stateKey]: SurveyInfoReducer,
  [CategoriesState.stateKey]: CategoriesReducer,
  [NodeDefsState.stateKey]: NodeDefsReducer,
  [NodeDefsIndexState.stateKey]: NodeDefsIndexReducer,
  [NodeDefsValidationState.stateKey]: NodeDefsValidationReducer,
  [SurveyStatusState.stateKey]: SurveyStatusReducer,
  [TaxonomiesState.stateKey]: TaxonomiesReducer,
})
