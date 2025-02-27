import { combineReducers } from 'redux'

import { CategoriesReducer, CategoriesState } from './categories'
import { DependencyGraphReducer } from './dependencyGraph'
import { NodeDefsReducer, NodeDefsState } from './nodeDefs'
import { NodeDefsIndexReducer, NodeDefsIndexState } from './nodeDefsIndex'
import { NodeDefsValidationReducer, NodeDefsValidationState } from './nodeDefsValidation'
import { SurveyRefDataReducer } from './refData'
import { SurveyStatusReducer, SurveyStatusState } from './status'
import { SurveyInfoReducer, SurveyInfoState } from './surveyInfo'
import { TaxonomiesReducer, TaxonomiesState } from './taxonomies'

export default combineReducers({
  [SurveyInfoState.stateKey]: SurveyInfoReducer,
  [CategoriesState.stateKey]: CategoriesReducer,
  dependencyGraph: DependencyGraphReducer,
  [NodeDefsState.stateKey]: NodeDefsReducer,
  [NodeDefsIndexState.stateKey]: NodeDefsIndexReducer,
  [NodeDefsValidationState.stateKey]: NodeDefsValidationReducer,
  refData: SurveyRefDataReducer,
  [SurveyStatusState.stateKey]: SurveyStatusReducer,
  [TaxonomiesState.stateKey]: TaxonomiesReducer,
})
