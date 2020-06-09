import { exportReducer } from '@webapp/utils/reduxUtils'

import { SystemActions } from '@webapp/store/system'

import * as SurveyActions from '../actions'
import { NodeDefsActions } from '../nodeDefs'

const actionHandlers = {
  // Reset state
  [SystemActions.SYSTEM_RESET]: () => ({}),
  [SurveyActions.surveyCreate]: () => ({}),
  [SurveyActions.surveyUpdate]: () => ({}),
  [SurveyActions.surveyDelete]: () => ({}),

  [SurveyActions.surveyDefsReset]: () => ({}),

  // NodeDefsValidation load
  [SurveyActions.surveyDefsLoad]: (_state, { nodeDefsValidation }) => nodeDefsValidation,
  [NodeDefsActions.nodeDefsValidationUpdate]: (_state, { nodeDefsValidation }) => nodeDefsValidation,
}

export default exportReducer(actionHandlers)
