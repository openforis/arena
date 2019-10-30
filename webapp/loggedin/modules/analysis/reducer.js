import { combineReducers } from 'redux'

import processingChain from './processingChain/reducer'
import processingStep from './processingStep/reducer'

import * as ProcessingChainState from './processingChain/processingChainState'
import * as ProcessingStepState from './processingStep/processingStepState'

export default combineReducers({
  [ProcessingChainState.stateKey]: processingChain,
  [ProcessingStepState.stateKey]: processingStep,
})