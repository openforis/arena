import { combineReducers } from 'redux'

import processingChain from './chain/reducer'
import processingStep from './step/reducer'
import processingStepCalculation from './processingStepCalculation/reducer'

import * as ChainState from './chain/state'
import * as StepState from './step/state/stepState'
import * as ProcessingStepCalculationState from './processingStepCalculation/processingStepCalculationState'

export default combineReducers({
  [ChainState.stateKey]: processingChain,
  [StepState.stateKey]: processingStep,
  [ProcessingStepCalculationState.stateKey]: processingStepCalculation,
})
