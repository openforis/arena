import * as R from 'ramda'

import { useState, useEffect } from 'react'

import { useActions } from './actions/index'

export const useAnalysis = () => {
  const [chain, setChain] = useState({})
  const [step, setStep] = useState({})
  const [calculation, setCalculation] = useState({})
  const [dirty, setDirty] = useState(false)

  const { onInit, onDismiss, chain: chainActions, step: stepActions, calculation: calculationActions } = useActions({
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
    },
  }
}
