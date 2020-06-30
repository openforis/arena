import { useState } from 'react'
import { useOnUpdate } from '@webapp/components/hooks'

import { useActions } from './actions'

export const useDropdown = ({
  autocompleteMinChars,
  disabled,
  itemKey,
  itemLabel,
  items,
  onBeforeChange,
  onChange,
  readOnly,
  selection,
}) => {
  // utility getters
  const getItemKey = (item) => (itemKey.constructor === String ? item[itemKey] : itemKey(item))
  const getItemLabel = (item) => (itemLabel.constructor === String ? item[itemLabel] : itemLabel(item))
  const getSelectionLabel = () => (selection ? getItemLabel(selection) : '')

  // state/action properties
  const [inputValue, setInputValue] = useState(getSelectionLabel())
  const [itemsDialog, setItemsDialog] = useState(items)
  const [showDialog, setShowDialog] = useState(false)

  const Actions = useActions({
    autocompleteMinChars,
    disabled,
    readOnly,
    items,
    showDialog,
    getItemKey,
    getItemLabel,
    onBeforeChange,
    onChange,
    setInputValue,
    setItemsDialog,
    setShowDialog,
  })

  // on update selection: update input value
  useOnUpdate(() => {
    setInputValue(getSelectionLabel())
  }, [selection])

  return {
    Actions,

    inputValue,
    itemsDialog,
    showDialog,

    getItemKey,
    getItemLabel,
  }
}
