import { useToggleDialog } from './useToggleDialog'
import { useUpdateSelection } from './useUpdateSelection'
import { useUpdateInputValue } from './useUpdateInputValue'

export const useActions = ({
  autocompleteMinChars,
  disabled,
  items,
  readOnly,
  showDialog,
  getItemKey,
  getItemLabel,
  onBeforeChange,
  onChange,
  setInputValue,
  setItemsDialog,
  setShowDialog,
}) => ({
  toggleDialog: useToggleDialog({ disabled, items, readOnly, showDialog, setItemsDialog, setShowDialog }),
  updateSelection: useUpdateSelection({ onBeforeChange, onChange, setInputValue, setShowDialog }),
  updateInputValue: useUpdateInputValue({
    autocompleteMinChars,
    items,
    getItemKey,
    getItemLabel,
    setInputValue,
    setItemsDialog,
  }),
})
