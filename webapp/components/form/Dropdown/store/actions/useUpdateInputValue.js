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

    setInputValue(value)
    setItemsDialog(itemsDialog)
    onChange(null)
  })()
}
