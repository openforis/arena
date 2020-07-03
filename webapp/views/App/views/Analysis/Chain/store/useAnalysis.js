import * as R from 'ramda'
import { useState, useEffect } from 'react'

import { useActions } from './actions/index'
import { useChain } from './chain'
import { useStep } from './step'
import { useCalculation } from './calculation'

export const useAnalysis = () => {
  const [attributesUuidsOtherChains, setAtrributesUuidsOtherChains] = useState([])

  const { state: chainState, State: ChainState, Actions: ChainActions } = useChain({})

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

  const { chain, dirty } = ChainState.get(chainState)
  const { step, stepDirty } = StepState.get(stepState)
  const { calculation, calculationDirty } = CalculationState.get(calculationState)

  useEffect(() => {
    actions.init()
  }, [])

  useEffect(() => {
    actions.getAttributeUuidsOtherChains()
  }, [chain])

  const isNotNullAndNotEmpty = (item) => !(R.isNil(item) || R.isEmpty(item))

  return {
    attributesUuidsOtherChains,

    chain,
    editingChain: isNotNullAndNotEmpty(chain),
    dirty,

    step,
    editingStep: isNotNullAndNotEmpty(step),
    stepDirty,

    calculation,
    editingCalculation: isNotNullAndNotEmpty(calculation),
    calculationDirty,

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
