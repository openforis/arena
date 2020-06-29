export const useUpdateSelection = ({ onBeforeChange, onChange, setOpened }) => {
  return (item) => {
    ;(async () => {
      if (!onBeforeChange || (await onBeforeChange(item))) {
        setOpened(false)
        await onChange(item)
      }
    })()
  }
}
