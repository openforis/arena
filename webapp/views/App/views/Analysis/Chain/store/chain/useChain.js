import { useState } from 'react'

import { useActions } from './actions/index'

export const useChain = (initialState = {}, { dirty, setDirty }) => {
  const [chain, setChain] = useState(initialState)

  const actions = useActions({
    chain,
    setChain,
    dirty,
    setDirty,
  })

  return {
    chain,
    setChain,
    actions,
  }
}
