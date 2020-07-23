import { useCallback } from 'react'

import { State } from '../state'

export const useRejectSelectedItems = () =>
  useCallback(
    ({ selection, state }) => (item) => {
      const selectionKeys = selection.map(State.getItemKey(state))
      return !selectionKeys.includes(State.getItemKey(state)(item))
    },
    []
  )
