import { useState } from 'react'

import { useActions } from './actions'

export const useCalculation = (initialState = {}, { dirty, setDirty, chain, setChain, step, setStep }) => {
  const [calculation, setCalculation] = useState(initialState)

  const actions = useActions({
    dirty,
    setDirty,
    chain,
    setChain,
    step,
    setStep,
    calculation,
    setCalculation,
  })

  return {
    calculation,
    setCalculation,
    actions,
  }
}
