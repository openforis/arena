import { combineReducers } from 'redux'

import { SurveyInfoReducer, SurveyInfoState } from './surveyInfo'
import { NodeDefsReducer, NodeDefsState } from './nodeDefs'
import { NodeDefsIndexReducer, NodeDefsIndexState } from './nodeDefsIndex'
import { NodeDefsValidationReducer, NodeDefsValidationState } from './nodeDefsValidation'
import { SurveyStatusReducer, SurveyStatusState } from './status'

export default combineReducers({
  [SurveyInfoState.stateKey]: SurveyInfoReducer,
  [NodeDefsState.stateKey]: NodeDefsReducer,
  [NodeDefsIndexState.stateKey]: NodeDefsIndexReducer,
  [NodeDefsValidationState.stateKey]: NodeDefsValidationReducer,
  [SurveyStatusState.stateKey]: SurveyStatusReducer,
})
