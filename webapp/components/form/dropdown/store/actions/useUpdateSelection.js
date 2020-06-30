export const useUpdateSelection = ({ selection, onBeforeChange, onChange, setInputValue, setShowDialog }) => {
  return (item) => {
    ;(async () => {
      if ((!onBeforeChange || (await onBeforeChange(item))) && selection !== item) {
        setShowDialog(false)
        setInputValue('')
        await onChange(item)
      }
    })()
  }
}
