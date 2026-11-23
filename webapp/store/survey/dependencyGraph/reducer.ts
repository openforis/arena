import { exportReducer } from '@webapp/utils/reduxUtils'

import { SystemActionTypes } from '@webapp/store/system/actionTypes'

import * as SurveyActions from '../actions'
import { NodeDefsActions } from '../nodeDefs'

const actionHandlers = {
  // Reset state
  [SystemActionTypes.SYSTEM_RESET]: () => ({}),

  [SurveyActions.surveyCreate]: () => ({}),
  [SurveyActions.surveyUpdate]: () => ({}),
  [SurveyActions.surveyDelete]: () => ({}),

  [SurveyActions.surveyDefsReset]: () => ({}),

  // NodeDefs load
  [SurveyActions.surveyDefsLoad]: (_state, { dependencyGraph }) => dependencyGraph ?? {},
  [NodeDefsActions.dependencyGraphUpdate]: (_state, { dependencyGraph }) => dependencyGraph ?? {},
}

export default exportReducer(actionHandlers)
