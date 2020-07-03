import { useState, useCallback } from 'react'

import { useActions } from './actions'
import { State } from './state'

export const useCalculation = (initialState, { dirty, setDirty, chain, setChain, stepState, StepState }) => {
  const [state, setState] = useState(
    State.create({ calculation: null, calculationOriginal: null, calculationDirty: null })
  )

  const handleSetState = useCallback((newState) => setState(State.assoc(newState)(state)), [state])

  const Actions = useActions({
    dirty,
    setDirty,
    chain,
    setChain,

    stepState,
    StepState,

    State,
    state,
    setState: handleSetState,
  })

  return {
    state,
    State: {
      ...State,
      setState: handleSetState,
    },
    Actions,
  }
}
