import * as R from 'ramda'
import { useState, useEffect } from 'react'

import { useActions } from './actions/index'
import { useChain } from './chain'
import { useStep } from './step'
import { useCalculation } from './calculation'

export const useAnalysis = () => {
  const [dirty, setDirty] = useState(false)
  const { chain, setChain, actions: chainActions } = useChain({}, { dirty, setDirty })
  const { step, setStep, actions: stepActions } = useStep({}, { dirty, setDirty, chain, setChain })
  const { calculation, setCalculation, actions: calculationActions } = useCalculation(
    {},
    { dirty, setDirty, chain, setChain, step, setStep }
  )

  const { onInit, onDismiss, canSelectNodeDef } = useActions({
    chain,
    setChain,
    dirty,
    setDirty,
    step,
    setStep,
    calculation,
    setCalculation,
  })

  useEffect(() => {
    onInit()
  }, [])

  return {
    state: {
      chain,
      step,
      calculation,
      dirty,
      editingStep: !R.isEmpty(step) || false,
      editingCalculation: !R.isEmpty(calculation) || false,
    },
    actions: {
      chain: {
        ...chainActions,
      },
      step: {
        ...stepActions,
      },
      calculation: {
        ...calculationActions,
      },
      onSave: () => ({}),
      openRButton: () => ({}),
      onDismiss,
      canSelectNodeDef,
    },
  }
}
