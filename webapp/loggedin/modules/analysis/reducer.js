import { combineReducers } from 'redux'

import processingChain from './chain/reducer'
import processingStep from './step/reducer'
import processingStepCalculation from './calculation/reducer'

import * as ChainState from './chain/state'
import * as StepState from './step/state'
import * as CalculationState from './calculation/state'

export default combineReducers({
  [ChainState.stateKey]: processingChain,
  [StepState.stateKey]: processingStep,
  [CalculationState.stateKey]: processingStepCalculation,
})
