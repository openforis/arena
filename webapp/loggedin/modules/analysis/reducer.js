import { combineReducers } from 'redux'

import processingChain from './chain/reducer'
import processingStep from './step/reducer'
import processingStepCalculation from './calculation/reducer'

import * as ChainState from './chain/state'
import * as StepState from './step/state'
import * as ProcessingStepCalculationState from './calculation/processingStepCalculationState'

export default combineReducers({
  [ChainState.stateKey]: processingChain,
  [StepState.stateKey]: processingStep,
  [ProcessingStepCalculationState.stateKey]: processingStepCalculation,
})
