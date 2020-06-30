import { getItemsDialog } from '@webapp/components/form/dropdown/store/actions/getItemsDialog'

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
          value: inputValue,
          getItemKey,
          getItemLabel,
        })
        setItemsDialog(itemsDialog)
      }

      setShowDialog((showDialogPrev) => !showDialogPrev)
    })()
  }
}
