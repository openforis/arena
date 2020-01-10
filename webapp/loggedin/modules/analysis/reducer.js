import { combineReducers } from 'redux'

import processingChain from './processingChain/reducer'
import processingStep from './processingStep/reducer'
import processingStepCalculation from './processingStepCalculation/reducer'

import * as ProcessingChainState from './processingChain/processingChainState'
import * as ProcessingStepState from './processingStep/processingStepState'
import * as ProcessingStepCalculationState from './processingStepCalculation/processingStepCalculationState'

export default combineReducers({
  [ProcessingChainState.stateKey]: processingChain,
  [ProcessingStepState.stateKey]: processingStep,
  [ProcessingStepCalculationState.stateKey]: processingStepCalculation,
})
