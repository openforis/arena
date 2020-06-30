import * as R from 'ramda'
import { useState, useEffect } from 'react'

import { useActions } from './actions/index'
import { useChain } from './chain'
import { useStep } from './step'
import { useCalculation } from './calculation'

export const useAnalysis = () => {
  const [dirty, setDirty] = useState(false)
  const [attributesUuidsOtherChains, setAtrributesUuidsOtherChains] = useState([])
  const { chain, setChain, actions: chainActions } = useChain({}, { dirty, setDirty })
  const { step, setStep, stepDirty, setStepDirty, setOriginalStep, actions: stepActions } = useStep(
    {},
    { dirty, setDirty, chain, setChain }
  )
  const {
    calculation,
    setCalculation,
    calculationDirty,
    setCalculationDirty,
    setOriginalCalculation,
    actions: calculationActions,
  } = useCalculation({}, { dirty, setDirty, chain, setChain, step, setStep })

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
    setOriginalStep,
    calculation,
    setCalculation,
    calculationDirty,
    setCalculationDirty,
    setOriginalCalculation,
  })

  useEffect(() => {
    actions.onInit()
  }, [])

  useEffect(() => {
    actions.getAttributeUuidsOtherChains()
  }, [chain])

  return {
    attributesUuidsOtherChains,
    chain,
    step,
    calculation,
    dirty,
    editingChain: !R.isEmpty(chain) || false,
    editingStep: !R.isEmpty(step) || false,
    stepDirty,
    editingCalculation: !R.isEmpty(calculation) || false,
    calculationDirty,

    Actions: {
      chain: {
        ...chainActions,
      },
      step: {
        ...stepActions,
      },
      calculation: {
        ...calculationActions,
      },
      ...actions,
    },
  }
}
