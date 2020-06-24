import { useState } from 'react'

import { useActions } from './actions/index'

export const useStep = (initialState = {}, { dirty, setDirty, chain, setChain }) => {
  const [step, setStep] = useState(initialState)

  const actions = useActions({
    dirty,
    setDirty,
    chain,
    setChain,
    step,
    setStep,
  })

  return {
    step,
    setStep,
    actions,
  }
}
