import { useCloseDialog } from './useCloseDialog'
import { useOpenDialog } from './useOpenDialog'
import { useUpdateSelection } from './useUpdateSelection'
import { useUpdateInputValue } from './useUpdateInputValue'
import { useUpdateItemLabelFunction } from './useUpdateItemLabelFunction'
import { useOnBlurInputValue } from './useOnBlurInputValue'

export const useActions = ({ setState, onBeforeChange, onChange }) => ({
  closeDialog: useCloseDialog({ setState }),
  openDialog: useOpenDialog({ setState }),
  updateSelection: useUpdateSelection({ onBeforeChange, onChange, setState }),
  updateInputValue: useUpdateInputValue({ setState }),
  updateItemLabelFunction: useUpdateItemLabelFunction({ setState }),
  onBlurInput: useOnBlurInputValue({ onChange }),
})
