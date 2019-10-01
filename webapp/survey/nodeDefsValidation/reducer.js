import { exportReducer } from '../../utils/reduxUtils'

import { appUserLogout } from '../../app/actions'

import {
  surveyCreate,
  surveyDefsLoad,
  surveyDefsReset,
  surveyNodeDefsLoad,
  surveyDelete,
  surveyUpdate
} from '../actions'

import { nodeDefsValidationUpdate } from '../nodeDefs/actions'

const actionHandlers = {
  // reset state
  [appUserLogout]: () => ({}),
  [surveyCreate]: () => ({}),
  [surveyUpdate]: () => ({}),
  [surveyDelete]: () => ({}),

  [surveyDefsReset]: () => ({}),

  // nodeDefsValidation load
  [surveyDefsLoad]: (state = {}, { nodeDefsValidation }) => nodeDefsValidation,
  [surveyNodeDefsLoad]: (state = {}, { nodeDefsValidation }) => nodeDefsValidation,
  [nodeDefsValidationUpdate]: (state = {}, { nodeDefsValidation }) => nodeDefsValidation,
}

export default exportReducer(actionHandlers)