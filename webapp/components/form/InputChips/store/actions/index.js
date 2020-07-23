import { useOnDropdownChange } from './useOnDropdownChange'
import { useRemoveItem } from './useRemoveItem'

export const useActions = ({ onChange, onItemAdd, onItemRemove }) => {
  return {
    onDropdownChange: useOnDropdownChange({ onChange, onItemAdd }),
    removeItem: useRemoveItem({ onChange, onItemRemove }),
  }
}
