import { useCallback } from 'react'

import { State } from '../state'
import { Objects } from '@openforis/arena-core'

const removeDuplicates = ({ items, state }) => {
  const itemsByKey = items.reduce((acc, item) => ({ ...acc, [State.getItemKey(state)(item)]: item }), {})
  const keysWithoutDuplicated = [...new Set(Object.keys(itemsByKey))]
  return keysWithoutDuplicated.map((key) => itemsByKey[key])
}

export const useOnDropdownChange = ({ onChange, onItemAdd }) =>
  useCallback(
    ({ selection, state }) =>
      (item) => {
        if (onChange) {
          const newItems = Objects.isEmpty(item) ? selection : removeDuplicates({ items: [...selection, item], state })
          onChange(newItems)
        }
        if (onItemAdd) {
          onItemAdd(item)
        }
      },
    [onChange, onItemAdd]
  )
