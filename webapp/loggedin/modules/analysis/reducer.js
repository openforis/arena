import { combineReducers } from 'redux'

import processingChain from './chain/reducer'
import processingStep from './processingStep/reducer'
import processingStepCalculation from './processingStepCalculation/reducer'

import * as ChainState from './chain/state'
import * as ProcessingStepState from './processingStep/processingStepState'
import * as ProcessingStepCalculationState from './processingStepCalculation/processingStepCalculationState'

export default combineReducers({
  [ChainState.stateKey]: processingChain,
  [ProcessingStepState.stateKey]: processingStep,
  [ProcessingStepCalculationState.stateKey]: processingStepCalculation,
})
