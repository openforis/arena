import { useState } from 'react'

import { useActions } from './actions'

export const useCalculation = (initialState, { dirty, setDirty, chain, setChain, step, setStep }) => {
  const [calculation, setCalculation] = useState(null)
  const [calculationOriginal, setCalculationOriginal] = useState(initialState)
  const [calculationDirty, setCalculationDirty] = useState(null)

  const actions = useActions({
    dirty,
    setDirty,
    chain,
    setChain,
    step,
    setStep,
    calculation,
    setCalculation,
    calculationOriginal,
    setCalculationOriginal,
    calculationDirty,
    setCalculationDirty,
  })

  return {
    calculation,
    setCalculation,
    calculationDirty,
    setCalculationDirty,
    calculationOriginal,
    setCalculationOriginal,
    actions,
  }
}
