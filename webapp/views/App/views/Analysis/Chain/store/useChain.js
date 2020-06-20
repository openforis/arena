import { useState, useEffect } from 'react'

import { useActions } from './actions/index'

export const useChain = () => {
  const [chain, setChain] = useState({})

  const { onInit, onUpdate, onSave } = useActions({ chain, setChain })

  useEffect(() => {
    onInit()
  }, [])

  return {
    chain,
    onUpdate,
    onSave,
  }
}
