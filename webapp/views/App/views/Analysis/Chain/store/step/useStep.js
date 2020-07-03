import { useCallback, useState } from 'react'

import { State } from './state'

export const useStep = () => {
  const [state, setState] = useState(State.create({ step: null, stepOriginal: null, stepDirty: null }))

  const handleSetState = useCallback((newState) => setState(State.assoc(newState)(state)), [state])

  return {
    state,
    State: {
      ...State,
      setState: handleSetState,
    },
  }
}
