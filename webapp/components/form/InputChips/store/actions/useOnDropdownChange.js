import { useCallback } from 'react'

import * as R from 'ramda'

export const useOnDropdownChange = ({ onChange, onItemAdd }) =>
  useCallback(
    ({ selection }) => (item) => {
      console.log(item, selection)
      if (onChange) {
        const newItems = R.append(item)(selection)
        onChange(newItems)
      }
      if (onItemAdd) {
        onItemAdd(item)
      }
    },
    []
  )
