import { getItemsDialog } from './getItemsDialog'

export const useUpdateInputValue = ({
  autocompleteMinChars,
  items,
  getItemKey,
  getItemLabel,
  onChange,
  setInputValue,
  setItemsDialog,
}) => ({ value = '' }) => {
  ;(async () => {
    const itemsDialog = await getItemsDialog({ autocompleteMinChars, items, value, getItemKey, getItemLabel })

    setInputValue(value.trim())
    setItemsDialog(itemsDialog)
    onChange(null)
  })()
}
