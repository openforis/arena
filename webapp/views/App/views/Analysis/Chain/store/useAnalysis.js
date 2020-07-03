import { useState, useEffect } from 'react'

import { useActions } from './actions/index'
import { useChain } from './chain'
import { useStep } from './step'
import { useCalculation } from './calculation'

import { State } from './state'

export const useAnalysis = () => {
  const [attributesUuidsOtherChains, setAtrributesUuidsOtherChains] = useState([])

  const { state: chainState, State: ChainState, Actions: ChainActions } = useChain()

  const { state: stepState, State: StepState, Actions: StepActions } = useStep({}, { chainState, ChainState })
  const { state: calculationState, State: CalculationState, Actions: CalculationActions } = useCalculation(
    {},
    {
      chainState,
      ChainState,

      stepState,
      StepState,
    }
  )

  const actions = useActions({
    attributesUuidsOtherChains,
    setAtrributesUuidsOtherChains,

    chainState,
    ChainState,

    stepState,
    StepState,

    calculationState,
    CalculationState,
  })

  const chain = ChainState.getChain(chainState)

  useEffect(() => {
    actions.init()
  }, [])

  useEffect(() => {
    actions.getAttributeUuidsOtherChains()
  }, [chain])

  return {
    state: State.create({
      attributesUuidsOtherChains,
      chainState,
      ChainState,
      stepState,
      StepState,
      calculationState,
      CalculationState,
    }),

    Actions: {
      chain: {
        ...ChainActions,
      },
      step: {
        ...StepActions,
      },
      calculation: {
        ...CalculationActions,
      },
      ...actions,
    },
  }
}
