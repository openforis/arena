import { useState } from 'react'

import { State } from './state'

export const useButtonBar = () => {
  const [state, setState] = useState(State.create())

  const Actions = {
    closePanels: () => setState(State.create()),
    togglePanelFilter: () => setState((statePrev) => State.togglePanelFilter(statePrev)),
    togglePanelSort: () => setState((statePrev) => State.togglePanelSort(statePrev)),
  }

  return { state, Actions }
}
