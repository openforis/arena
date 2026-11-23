import { useCallback } from 'react'

import { State } from '../../state'

export const useToggleEditExtraPropertiesPanel = ({ setState }) =>
  useCallback(
    () =>
      setState((statePrev) => {
        const editingPrev = State.isEditingItemExtraDefs(statePrev)
        return State.assocEditingItemExtraDefs(!editingPrev)(statePrev)
      }),
    []
  )
