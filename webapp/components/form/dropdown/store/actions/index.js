import { useToggleDialog } from './useToggleDialog'
import { useUpdateSelection } from './useUpdateSelection'
import { useUpdateInputValue } from './useUpdateInputValue'

export const useActions = ({
  autocompleteMinChars,
  disabled,
  inputValue,
  items,
  readOnly,
  selection,
  showDialog,
  getItemKey,
  getItemLabel,
  onBeforeChange,
  onChange,
  setInputValue,
  setItemsDialog,
  setShowDialog,
}) => ({
  toggleDialog: useToggleDialog({
    autocompleteMinChars,
    disabled,
    inputValue,
    items,
    readOnly,
    showDialog,
    getItemKey,
    getItemLabel,
    setItemsDialog,
    setShowDialog,
  }),
  updateSelection: useUpdateSelection({ selection, onBeforeChange, onChange, setInputValue, setShowDialog }),
  updateInputValue: useUpdateInputValue({
    autocompleteMinChars,
    items,
    getItemKey,
    getItemLabel,
    setInputValue,
    setItemsDialog,
  }),
})
