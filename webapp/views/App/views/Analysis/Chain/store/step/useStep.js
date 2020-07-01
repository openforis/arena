import { useState } from 'react'

import { useActions } from './actions/index'

export const useStep = (initialState, { dirty, setDirty, chain, setChain }) => {
  const [step, setStep] = useState(null)
  const [stepOriginal, setStepOriginal] = useState(initialState)
  const [stepDirty, setStepDirty] = useState(null)

  const actions = useActions({
    dirty,
    setDirty,
    chain,
    setChain,
    step,
    setStep,
    stepOriginal,
    setStepOriginal,
    stepDirty,
    setStepDirty,
  })

  return {
    step,
    setStep,
    stepDirty,
    setStepDirty,
    stepOriginal,
    setStepOriginal,
    actions,
  }
}
