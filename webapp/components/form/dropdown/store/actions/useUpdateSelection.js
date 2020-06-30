export const useUpdateSelection = ({ onBeforeChange, onChange, setInputValue, setShowDialog }) => {
  return (item) => {
    ;(async () => {
      if (!onBeforeChange || (await onBeforeChange(item))) {
        setShowDialog(false)
        setInputValue('')
        await onChange(item)
      }
    })()
  }
}
