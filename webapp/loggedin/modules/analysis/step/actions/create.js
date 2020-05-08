import * as Chain from '@common/analysis/processingChain'

import * as ChainState from '@webapp/loggedin/modules/analysis/chain/state'
import * as StepState from '@webapp/loggedin/modules/analysis/step/state'

import { hideAppLoader, showAppLoader } from '@webapp/app/actions'

export const stepCreate = 'analysis/step/create'
export const calculationCreate = 'analysis/calculation/create'

export const createStep = () => async (dispatch, getState) => {
  dispatch(showAppLoader())

  const state = getState()
  const processingChain = ChainState.getProcessingChain(state)
  const processingStep = Chain.newProcessingStep(processingChain)

  dispatch({ type: stepCreate, processingStep })
  dispatch(hideAppLoader())
}

export const createCalculation = () => async (dispatch, getState) => {
  dispatch(showAppLoader())

  const state = getState()
  const processingStep = StepState.getProcessingStep(state)
  const calculation = Chain.newProcessingStepCalculation(processingStep)

  dispatch({ type: calculationCreate, calculation })
  dispatch(hideAppLoader())
}
