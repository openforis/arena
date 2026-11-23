import { useCallback } from 'react'

import { State } from '../state'

export const useToggleEditExtraPropertiesPanel = ({ setState }) =>
  useCallback(
    () =>
      setState((statePrev) => {
        const editingPrev = State.isEditingExtraPropDefs(statePrev)
        return State.assocEditingExtraPropDefs(!editingPrev)(statePrev)
      }),
    []
  )
