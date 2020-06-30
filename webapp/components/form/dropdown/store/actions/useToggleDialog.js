export const useToggleDialog = ({ disabled, items, readOnly, showDialog, setItemsDialog, setShowDialog }) => () => {
  if (!disabled && !readOnly) {
    // when opening dialog and selection is set, restore items dialog (user might have previously selected item by filtering them)
    if (!showDialog) {
      // show original items
      setItemsDialog(items)
    }

    setShowDialog((showDialogPrev) => !showDialogPrev)
  }
}
