import { getItemsDialog } from './getItemsDialog'

export const useToggleDialog = ({
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
}) => () => {
  if (!disabled && !readOnly) {
    ;(async () => {
      // when opening dialog and selection is set, restore items dialog (user might have previously selected item by filtering them)
      if (!showDialog) {
        // show original items
        const itemsDialog = await getItemsDialog({
          autocompleteMinChars,
          items,
          value: autocompleteMinChars > 0 ? inputValue : '', // show all items if autocompleteMinChars is 0
          getItemKey,
          getItemLabel,
        })
        setItemsDialog(itemsDialog)
      }

      setShowDialog((showDialogPrev) => !showDialogPrev)
    })()
  }
}
