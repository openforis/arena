export const useUpdateSelection = ({
  selection,
  getItemKey,
  onBeforeChange,
  onChange,
  setInputValue,
  setShowDialog,
}) => {
  return (item) => {
    ;(async () => {
      const keySelection = selection && getItemKey(selection)
      const keyItem = getItemKey(item)

      if (keyItem !== keySelection && (!onBeforeChange || (await onBeforeChange(item)))) {
        setShowDialog(false)
        setInputValue('')
        await onChange(item)
      }
    })()
  }
}
