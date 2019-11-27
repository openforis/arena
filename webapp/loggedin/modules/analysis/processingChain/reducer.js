import {exportReducer} from '@webapp/utils/reduxUtils'

import * as ProcessingChain from '@common/analysis/processingChain'

import {appUserLogout} from '@webapp/app/actions'

import {surveyCreate, surveyDelete, surveyUpdate} from '@webapp/survey/actions'
import {
  processingChainUpdate,
  processingChainPropUpdate,
  processingChainStepsLoad,
} from './actions'

const actionHandlers = {
  // Reset state
  [appUserLogout]: () => ({}),
  [surveyCreate]: () => ({}),
  [surveyUpdate]: () => ({}),
  [surveyDelete]: () => ({}),

  // Chain
  [processingChainUpdate]: (state, {processingChain}) => processingChain,
  [processingChainPropUpdate]: (state, {key, value}) => ProcessingChain.assocProp(key, value)(state),

  // Steps
  [processingChainStepsLoad]: (state, {processingSteps}) => ProcessingChain.assocProcessingSteps(processingSteps)(state)
}

export default exportReducer(actionHandlers)
