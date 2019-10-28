import { exportReducer } from '@webapp/utils/reduxUtils'

import * as ProcessingChain from '@common/analysis/processingChain'

import {
  processingChainUpdate,
  processingChainPropUpdate,
  processingChainStepsLoad,
} from './actions'

import { appUserLogout } from '@webapp/app/actions'

import { surveyCreate, surveyDelete, surveyUpdate } from '@webapp/survey/actions'

const actionHandlers = {
  // reset state
  [appUserLogout]: () => ({}),
  [surveyCreate]: () => ({}),
  [surveyUpdate]: () => ({}),
  [surveyDelete]: () => ({}),

  // chain
  [processingChainUpdate]: (state, { processingChain }) => processingChain,
  [processingChainPropUpdate]: (state, { key, value }) => ProcessingChain.assocProp(key, value)(state),

  // steps
  [processingChainStepsLoad]: (state, { processingSteps }) => ProcessingChain.assocProcessingSteps(processingSteps)(state)
}

export default exportReducer(actionHandlers)