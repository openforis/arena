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
  const { step, setStep, stepDirty, setStepDirty, setStepOriginal, actions: stepActions } = useStep(
    {},
    { dirty, setDirty, chain, setChain }
  )
  const { state: calculationState, State: CalculationState, Actions: CalculationActions } = useCalculation(
    {},
    { dirty, setDirty, chain, setChain, step, setStep }
  )

  const actions = useActions({
    attributesUuidsOtherChains,
    setAtrributesUuidsOtherChains,
    chain,
    setChain,
    dirty,
    setDirty,
    step,
    setStep,
    stepDirty,
    setStepDirty,
    setStepOriginal,

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

  return {
    attributesUuidsOtherChains,
    chain,
    step,
    calculation,
    dirty,
    editingChain: isNotNullAndNotEmpty(chain),
    editingStep: isNotNullAndNotEmpty(step),
    stepDirty,
    editingCalculation: isNotNullAndNotEmpty(calculation),
    calculationDirty,

    Actions: {
      chain: {
        ...chainActions,
      },
      step: {
        ...stepActions,
      },
      calculation: {
        ...CalculationActions,
      },
      ...actions,
    },
  }
}
