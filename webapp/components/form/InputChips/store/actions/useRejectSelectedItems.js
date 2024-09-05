import { useCallback } from 'react'

import { State } from '../state'

export const useRejectSelectedItems = () =>
  useCallback(({ selection, state, items }) => {
    const selectionKeys = selection.map(State.getItemKey(state))
    const removeSelectedItems = (item) => !selectionKeys.includes(State.getItemKey(state)(item))

    if (items.constructor === Array) {
      return items.filter(removeSelectedItems)
    }
    return async (searchValue) => {
      const itemsRes = await items(searchValue)
      const itemsArray = Object.values(itemsRes?.data?.items ?? {})
      return itemsArray.filter(removeSelectedItems)
    }
  }, [])
