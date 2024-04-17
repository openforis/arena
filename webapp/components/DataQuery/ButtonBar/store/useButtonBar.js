import { useState } from 'react'

import { State } from './state'

export const useButtonBar = () => {
  const [state, setState] = useState(() => State.create())

  const Actions = {
    closePanels: () => setState(State.create()),
    togglePanelFilter: () => setState(State.togglePanelFilter),
    togglePanelSort: () => setState(State.togglePanelSort),
    togglePanelQueries: () => setState(State.togglePanelQueries),
  }

  return { state, Actions }
}
