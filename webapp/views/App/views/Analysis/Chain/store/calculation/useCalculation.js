import { useState } from 'react'

import { useActions } from './actions'
import { State } from './state'

export const useCalculation = (initialState, { dirty, setDirty, chain, setChain, step, setStep }) => {
  const [state, setState] = useState(
    State.create({ calculation: null, calculationOriginal: null, calculationDirty: null })
  )

  const Actions = useActions({
    dirty,
    setDirty,
    chain,
    setChain,
    step,
    setStep,
    State,
    state,
    setState,
  })

  return {
    state,
    State: {
      ...State,
      setState,
    },
    Actions,
  }
}
