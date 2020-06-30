import { useState } from 'react'

import { useActions } from './actions'

export const useCalculation = (initialState, { dirty, setDirty, chain, setChain, step, setStep }) => {
  const [calculation, setCalculation] = useState(null)
  const [originalCalculation, setOriginalCalculation] = useState(initialState)
  const [calculationDirty, setCalculationDirty] = useState(false)

  const actions = useActions({
    dirty,
    setDirty,
    chain,
    setChain,
    step,
    setStep,
    calculation,
    setCalculation,
    originalCalculation,
    setOriginalCalculation,
    calculationDirty,
    setCalculationDirty,
  })

  return {
    calculation,
    setCalculation,
    calculationDirty,
    setCalculationDirty,
    originalCalculation,
    setOriginalCalculation,
    actions,
  }
}
