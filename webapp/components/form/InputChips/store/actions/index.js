import { useOnDropdownChange } from './useOnDropdownChange'
import { useOnInputFieldChange } from './useOnInputFieldChange'
import { useOnItemAddClick } from './useOnItemAddClick'
import { useRejectSelectedItems } from './useRejectSelectedItems'
import { useRemoveItem } from './useRemoveItem'

export const useActions = ({ onChange, onItemAdd, onItemRemove, setState }) => ({
  onDropdownChange: useOnDropdownChange({ onChange, onItemAdd }),
  onInputFieldChange: useOnInputFieldChange({ onChange, setState }),
  onItemAddClick: useOnItemAddClick({ onChange, onItemAdd, setState }),
  removeItem: useRemoveItem({ onChange, onItemRemove }),
  rejectSelectedItems: useRejectSelectedItems(),
})
