import * as R from 'ramda'

import { useState, useEffect } from 'react'

import { useActions } from './actions/index'

export const useChain = () => {
  const [chain, setChain] = useState({})
  const [step, setStep] = useState({})
  const [calculation, setCalculation] = useState({})
  const [dirty, setDirty] = useState(false)

  const {
    onInit,
    onUpdate,
    onDismiss,
    onNewStep,
    onSelectStep,
    onUpdateStep,
    onDeleteStep,
    onNewCalculation,
    onMoveCalculation,
    onDeleteCalculation,
  } = useActions({
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
    chain,
    step,
    calculation,
    dirty,
    editingStep: !R.isEmpty(step) || false,
    editingCalculation: !R.isEmpty(calculation) || false,
    onUpdate,
    onSave: () => ({}),
    onDismiss,
    onNewStep,
    onSelectStep,
    onUpdateStep,
    onDeleteStep,
    onNewCalculation,
    onMoveCalculation,
    onDeleteCalculation,
  }
}
