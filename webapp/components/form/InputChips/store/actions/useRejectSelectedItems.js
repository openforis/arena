import { useCallback } from 'react'

import { State } from '../state'

export const useRejectSelectedItems = () =>
  useCallback(({ selection, state, items }) => {
    const selectionKeys = selection.map(State.getItemKey(state))
    const removeSelectedItems = (item) => !selectionKeys.includes(State.getItemKey(state)(item))

    if (items.constructor === Array) {
      return items.filter(removeSelectedItems)
    }
    return async (searchValue) => (await items(searchValue)).filter(removeSelectedItems)
  }, [])
