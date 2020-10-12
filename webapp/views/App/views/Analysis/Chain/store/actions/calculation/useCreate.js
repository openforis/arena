import { useCallback } from 'react'
import * as A from '@core/arena'

import * as ChainFactory from '@common/analysis/chainFactory'
import * as ChainController from '@common/analysis/chainController'
import * as Step from '@common/analysis/processingStep'

import { State } from '../../state'

export const useCreate = ({ setState }) => {
  return useCallback(({ state }) => {
    const chain = State.getChainEdit(state)
    const step = State.getStepEdit(state)
    const calculation = ChainFactory.createCalculation({ step })
    const stepWithCalculation = Step.assocCalculation(calculation)(step)
    const chainWithStep = ChainController.assocStep({ chain, step: stepWithCalculation })

    setState(
      A.pipe(
        State.assocChainEdit(chainWithStep),
        State.assocStepEdit(stepWithCalculation),
        State.assocCalculationEdit(calculation)
      )(state)
    )
  }, [])
}
