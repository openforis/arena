import { useCallback } from 'react'
import * as A from '@core/arena'

import * as ChainFactory from '@common/analysis/chainFactory'
import * as Chain from '@common/analysis/processingChain'
import * as Step from '@common/analysis/processingStep'

import { State } from '../../state'

export const useCreate = ({ setState }) => {
  return useCallback(({ state }) => {
    const step = State.getStepEdit(state)
    const calculation = ChainFactory.newProcessingStepCalculation({ step })
    const stepWithCalculation = Step.assocCalculation(calculation)(step)
    const chainWithStep = Chain.assocProcessingStep(stepWithCalculation)(State.getChainEdit(state))

    setState(
      A.pipe(
        State.assocChainEdit(chainWithStep),
        State.assocStepEdit(stepWithCalculation),
        State.assocCalculationEdit(calculation)
      )(state)
    )
  }, [])
}
