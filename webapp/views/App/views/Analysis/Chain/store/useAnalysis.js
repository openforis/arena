import * as R from 'ramda'
import { useState, useEffect } from 'react'

import { useActions } from './actions/index'
import { useChain } from './chain'
import { useStep } from './step'
import { useCalculation } from './calculation'

export const useAnalysis = () => {
  const [dirty, setDirty] = useState(null)
  const [attributesUuidsOtherChains, setAtrributesUuidsOtherChains] = useState([])
  const { chain, setChain, actions: chainActions } = useChain({}, { dirty, setDirty })

  const { state: stepState, State: StepState, Actions: StepActions } = useStep({}, { dirty, setDirty, chain, setChain })
  const { state: calculationState, State: CalculationState, Actions: CalculationActions } = useCalculation(
    {},
    {
      dirty,
      setDirty,
      chain,
      setChain,
      stepState,
      StepState,
    }
  )

  const actions = useActions({
    attributesUuidsOtherChains,
    setAtrributesUuidsOtherChains,

    chain,
    setChain,
    dirty,
    setDirty,

    stepState,
    StepState,

    calculationState,
    CalculationState,
  })

  useEffect(() => {
    actions.init()
  }, [])

  useEffect(() => {
    actions.getAttributeUuidsOtherChains()
  }, [chain])

  const isNotNullAndNotEmpty = (item) => !(R.isNil(item) || R.isEmpty(item))

  const { calculation, calculationDirty } = CalculationState.get(calculationState)
  const { step, stepDirty } = StepState.get(stepState)

  return {
    attributesUuidsOtherChains,
    chain,

    dirty,
    editingChain: isNotNullAndNotEmpty(chain),

    step,
    editingStep: isNotNullAndNotEmpty(step),
    stepDirty,

    calculation,
    editingCalculation: isNotNullAndNotEmpty(calculation),
    calculationDirty,

    Actions: {
      chain: {
        ...chainActions,
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
