import * as Validation from '@core/validation/validation'

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

  // NodeDefsValidation load
  [SurveyActions.surveyDefsLoad]: (_state, { nodeDefsValidation = {} }) => nodeDefsValidation,
  [NodeDefsActions.nodeDefsValidationUpdate]: (state, { nodeDefsValidation }) =>
    Validation.mergeValidation(nodeDefsValidation)(state),
}

export default exportReducer(actionHandlers)
