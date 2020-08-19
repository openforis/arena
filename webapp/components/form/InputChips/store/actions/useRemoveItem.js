import { useCallback } from 'react'

export const useRemoveItem = ({ onChange, onItemRemove }) =>
  useCallback(
    ({ selection }) => (item) => {
      if (onChange) {
        const idx = selection.indexOf(item)
        const newItems = [...selection]
        newItems.splice(idx, 1)
        onChange(newItems)
      }
      if (onItemRemove) {
        onItemRemove(item)
      }
    },
    [onChange, onItemRemove]
  )
