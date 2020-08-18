import { useCloseDialog } from './useCloseDialog'
import { useOpenDialog } from './useOpenDialog'
import { useUpdateSelection } from './useUpdateSelection'
import { useUpdateInputValue } from './useUpdateInputValue'
import { useBlurInputValue } from './useBlurInputValue'

export const useActions = ({ setState, onBeforeChange, onChange }) => {
  const closeDialog = useCloseDialog({ setState })
  return {
    closeDialog,
    openDialog: useOpenDialog({ setState }),
    updateSelection: useUpdateSelection({ closeDialog, onBeforeChange, onChange }),
    updateInputValue: useUpdateInputValue({ setState }),
    blurInputValue: useBlurInputValue({ onChange }),
  }
}
