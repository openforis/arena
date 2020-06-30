import { useState } from 'react'

import { useActions } from './actions/index'

export const useStep = (initialState = {}, { dirty, setDirty, chain, setChain }) => {
  const [step, setStep] = useState(initialState)
  const [originalStep, setOriginalStep] = useState(initialState)
  const [stepDirty, setStepDirty] = useState(false)

  const actions = useActions({
    dirty,
    setDirty,
    chain,
    setChain,
    step,
    setStep,
    originalStep,
    setOriginalStep,
    stepDirty,
    setStepDirty,
  })

  return {
    step,
    setStep,
    stepDirty,
    setStepDirty,
    originalStep,
    setOriginalStep,
    actions,
  }
}
