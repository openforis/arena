import { useOnDropdownChange } from './useOnDropdownChange'
import { useOnInputFieldChange } from './useOnInputFieldChange'
import { useRemoveItem } from './useRemoveItem'
import { useRejectSelectedItems } from './useRejectSelectedItems'

export const useActions = ({ onChange, onItemAdd, onItemRemove, setState }) => ({
  onDropdownChange: useOnDropdownChange({ onChange, onItemAdd }),
  onInputFieldChange: useOnInputFieldChange({ setState }),
  removeItem: useRemoveItem({ onChange, onItemRemove }),
  rejectSelectedItems: useRejectSelectedItems(),
})
