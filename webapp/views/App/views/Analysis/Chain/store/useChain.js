import * as R from 'ramda'

import { useState, useEffect } from 'react'

import { useActions } from './actions/index'

export const useChain = () => {
  const [chain, setChain] = useState({})
  const [step, setStep] = useState({})
  const [dirty, setDirty] = useState(false)

  const { onInit, onUpdate, onDismiss, onNewStep, onSelectStep, onUpdateStep, onDeleteStep } = useActions({
    chain,
    setChain,
    dirty,
    setDirty,
    step,
    setStep,
  })

  useEffect(() => {
    onInit()
  }, [])

  return {
    chain,
    step,
    dirty,
    editingStep: !R.isEmpty(step) || false,
    onUpdate,
    onSave: () => ({}),
    onDismiss,
    onNewStep,
    onSelectStep,
    onUpdateStep,
    onDeleteStep,
  }
}
