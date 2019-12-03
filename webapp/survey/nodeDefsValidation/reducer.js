import { exportReducer } from '@webapp/utils/reduxUtils'

import { appUserLogout } from '@webapp/app/actions'

import {
  surveyCreate,
  surveyDefsLoad,
  surveyDefsReset,
  surveyDelete,
  surveyUpdate,
} from '../actions'

import { nodeDefsValidationUpdate } from '../nodeDefs/actions'

const actionHandlers = {
  // Reset state
  [appUserLogout]: () => ({}),
  [surveyCreate]: () => ({}),
  [surveyUpdate]: () => ({}),
  [surveyDelete]: () => ({}),

  [surveyDefsReset]: () => ({}),

  // NodeDefsValidation load
  [surveyDefsLoad]: (_state, { nodeDefsValidation }) => nodeDefsValidation,
  [nodeDefsValidationUpdate]: (_state, { nodeDefsValidation }) =>
    nodeDefsValidation,
}

export default exportReducer(actionHandlers)
