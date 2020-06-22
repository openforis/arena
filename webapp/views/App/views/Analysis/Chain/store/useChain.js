import { useState, useEffect } from 'react'

import { useActions } from './actions/index'

export const useChain = () => {
  const [chain, setChain] = useState({})
  const [dirty, setDirty] = useState(false)

  const { onInit, onUpdate, onDismiss } = useActions({
    chain,
    setChain,
    dirty,
    setDirty,
  })

  useEffect(() => {
    onInit()
  }, [])

  return {
    chain,
    dirty,
    onUpdate,
    onSave: () => ({}),
    onDismiss,
  }
}
