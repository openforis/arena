import { useCallback, useState } from 'react'

import { useActions } from './actions/index'
import { State } from './state'

export const useChain = () => {
  const [state, setState] = useState(State.create({ chain: null, dirty: null }))

  const handleSetState = useCallback((newState) => setState(State.assoc(newState)(state)), [state])

  const Actions = useActions({
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
