import { useOnDropdownChange } from './useOnDropdownChange'
import { useRemoveItem } from './useRemoveItem'
import { useRejectSelectedItems } from './useRejectSelectedItems'

export const useActions = ({ onChange, onItemAdd, onItemRemove }) => {
  return {
    onDropdownChange: useOnDropdownChange({ onChange, onItemAdd }),
    removeItem: useRemoveItem({ onChange, onItemRemove }),
    rejectSelectedItems: useRejectSelectedItems(),
  }
}
