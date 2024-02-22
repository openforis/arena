import { useOnDropdownChange } from './useOnDropdownChange'
import { useOnInputFieldChange } from './useOnInputFieldChange'
import { useOnItemAddClick } from './useOnItemAddClick'
import { useRemoveItem } from './useRemoveItem'
import { useRejectSelectedItems } from './useRejectSelectedItems'

export const useActions = ({ onChange, onItemAdd, onItemRemove, setState }) => ({
  onDropdownChange: useOnDropdownChange({ onChange, onItemAdd }),
  onInputFieldChange: useOnInputFieldChange({ onChange, setState }),
  onItemAddClick: useOnItemAddClick({ onChange, setState }),
  removeItem: useRemoveItem({ onChange, onItemRemove }),
  rejectSelectedItems: useRejectSelectedItems(),
})
