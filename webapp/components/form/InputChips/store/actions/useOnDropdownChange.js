import { useCallback } from 'react'

import * as R from 'ramda'
import { State } from '../state'

const removeDuplicates = ({ items, state }) => {
  const itemsByKey = items.reduce((acc, item) => ({ ...acc, [State.getItemKey(state)(item)]: item }), {})
  const keysWithoutDuplicated = [...new Set(Object.keys(itemsByKey))]
  return keysWithoutDuplicated.map((key) => itemsByKey[key])
}

export const useOnDropdownChange = ({ onChange, onItemAdd }) =>
  useCallback(
    ({ selection, state }) => (item) => {
      if (onChange) {
        const newItems = removeDuplicates({ items: R.append(item)(selection), state })
        onChange(newItems)
      }
      if (onItemAdd) {
        onItemAdd(item)
      }
    },
    [onChange, onItemAdd]
  )
