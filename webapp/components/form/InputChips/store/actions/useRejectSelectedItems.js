import { useCallback } from 'react'

import { State } from '../state'

const wrapItemsFetchFunction = (itemsFetchFn, itemsFilter) => async (searchValue) => {
  const itemsRes = await itemsFetchFn(searchValue)
  const itemsArray = Array.isArray(itemsRes) ? itemsRes : Object.values(itemsRes?.data?.items ?? {})
  return itemsArray.filter((item) => itemsFilter(item))
}

export const useRejectSelectedItems = () =>
  useCallback(({ selection, state, items }) => {
    const selectionKeys = new Set(selection.map(State.getItemKey(state)))
    const removeSelectedItems = (item) => !selectionKeys.has(State.getItemKey(state)(item))

    // items can be an array or a function fetching them
    return Array.isArray(items)
      ? items.filter((item) => removeSelectedItems(item))
      : wrapItemsFetchFunction(items, removeSelectedItems)
  }, [])
