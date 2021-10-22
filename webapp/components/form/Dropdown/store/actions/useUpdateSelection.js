import { useCallback } from 'react'

import { State } from '../state'

import { useCloseDialog } from './useCloseDialog'

export const useUpdateSelection = ({ onBeforeChange, onChange, setState }) => {
  const closeDialog = useCloseDialog({ setState })

  return useCallback(
    async ({ item, selection, state }) => {
      const keySelection = selection && State.getItemKey(state)(selection)
      const keyItem = State.getItemKey(state)(item)

      if (keyItem !== keySelection && (!onBeforeChange || (await onBeforeChange(item)))) {
        await onChange(item)
      }
      const selectionNew = keyItem === keySelection ? selection : item

      closeDialog({ selection: selectionNew })
    },
    [onBeforeChange, onChange, setState]
  )
}
