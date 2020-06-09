import { exportReducer } from '@webapp/utils/reduxUtils'

import * as ChainState from '@webapp/loggedin/modules/analysis/chain/state'

import { UserActions } from '@webapp/store/user'
import { SurveyActions } from '@webapp/store/survey'
import {
  chainReset,
  chainUpdate,
  chainPropUpdate,
  chainSave,
  chainValidationUpdate,
} from '@webapp/loggedin/modules/analysis/chain/actions'

import { stepCreate, stepReset, stepDelete } from '@webapp/loggedin/modules/analysis/step/actions'

const actionHandlers = {
  // Reset state
  [UserActions.USER_LOGOUT]: () => ({}),
  [SurveyActions.surveyCreate]: () => ({}),
  [SurveyActions.surveyUpdate]: () => ({}),
  [SurveyActions.surveyDelete]: () => ({}),

  // Chain
  [chainReset]: () => ({}),

  [chainUpdate]: (state, { chain, attributeUuidsOtherChains }) =>
    ChainState.initProcessingChain(chain, attributeUuidsOtherChains)(state),

  [chainPropUpdate]: (state, { key, value }) => ChainState.assocPropDirty(key, value)(state),

  [chainSave]: (state, { chain, step }) => ChainState.saveDirty(chain, step)(state),

  [chainValidationUpdate]: (state, { validation }) => ChainState.assocProcessingChainValidation(validation)(state),

  // Steps
  [stepCreate]: (state, { processingStep }) => ChainState.appendProcessingStep(processingStep)(state),

  [stepReset]: (state) => ChainState.dissocStepTemporary(state),

  [stepDelete]: (state) => ChainState.dissocStepLast(state),
}

export default exportReducer(actionHandlers)
