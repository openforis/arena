import { useCallback, useState } from 'react'

import { useActions } from './actions/index'
import { State } from './state'

export const useStep = (initialState, { dirty, setDirty, chain, setChain }) => {
  const [state, setState] = useState(State.create({ step: null, stepOriginal: null, stepDirty: null }))

  const handleSetState = useCallback((newState) => setState(State.assoc(newState)(state)), [state])

  const Actions = useActions({
    dirty,
    setDirty,
    chain,
    setChain,

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
