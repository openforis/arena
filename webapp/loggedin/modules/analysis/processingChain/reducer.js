import { exportReducer } from '@webapp/utils/reduxUtils'

import * as ProcessingChainState from '@webapp/loggedin/modules/analysis/processingChain/processingChainState'

import { appUserLogout } from '@webapp/app/actions'
import { surveyCreate, surveyDelete, surveyUpdate } from '@webapp/survey/actions'
import {
  processingChainReset,
  processingChainUpdate,
  processingChainPropUpdate,
  processingChainStepsLoad,
  processingChainSave,
} from '@webapp/loggedin/modules/analysis/processingChain/actions'
import { processingStepCreate, processingStepReset } from '@webapp/loggedin/modules/analysis/processingStep/actions'

const actionHandlers = {
  // Reset state
  [appUserLogout]: () => ({}),
  [surveyCreate]: () => ({}),
  [surveyUpdate]: () => ({}),
  [surveyDelete]: () => ({}),

  // Chain
  [processingChainReset]: () => ({}),

  [processingChainUpdate]: (state, { processingChain }) =>
    ProcessingChainState.assocProcessingChain(processingChain)(state),

  [processingChainPropUpdate]: (state, { key, value }) => ProcessingChainState.assocPropDirty(key, value)(state),

  [processingChainSave]: (state, { chain, step }) => ProcessingChainState.saveDirty(chain, step)(state),

  // Steps
  [processingChainStepsLoad]: (state, { processingSteps }) =>
    ProcessingChainState.assocProcessingSteps(processingSteps)(state),

  [processingStepCreate]: (state, { processingStep }) =>
    ProcessingChainState.appendProcessingStep(processingStep)(state),

  [processingStepReset]: state => ProcessingChainState.dissocStepTemporary(state),
}

export default exportReducer(actionHandlers)
