import * as Validation from '@core/validation/validation'

import { SystemActions } from '@webapp/store/system'
import { exportReducer } from '@webapp/utils/reduxUtils'

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
  [SurveyActions.surveyDefsLoad]: (_state, { nodeDefsValidation = {} }) => nodeDefsValidation,
  [NodeDefsActions.nodeDefsValidationUpdate]: (state, { nodeDefsValidation }) =>
    Validation.mergeValidation(nodeDefsValidation)(state),
}

export default exportReducer(actionHandlers)
