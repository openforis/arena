import { exportReducer } from '@webapp/utils/reduxUtils'

import { appUserLogout } from '@webapp/app/actions'

import * as SurveyActions from '../actions'
import { NodeDefsActions } from '../nodeDefs'

const actionHandlers = {
  // Reset state
  [appUserLogout]: () => ({}),
  [SurveyActions.surveyCreate]: () => ({}),
  [SurveyActions.surveyUpdate]: () => ({}),
  [SurveyActions.surveyDelete]: () => ({}),

  [SurveyActions.surveyDefsReset]: () => ({}),

  // NodeDefsValidation load
  [SurveyActions.surveyDefsLoad]: (_state, { nodeDefsValidation }) => nodeDefsValidation,
  [NodeDefsActions.nodeDefsValidationUpdate]: (_state, { nodeDefsValidation }) => nodeDefsValidation,
}

export default exportReducer(actionHandlers)
