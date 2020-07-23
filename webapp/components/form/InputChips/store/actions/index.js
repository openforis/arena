import { useOnDropdownChange } from './useOnDropdownChange'
import { useRemoveItem } from './useRemoveItem'

export const useActions = ({ setState, onChange, onItemAdd, onItemRemove }) => {
  return {
    onDropdownChange: useOnDropdownChange({ onChange, onItemAdd }),
    removeItem: useRemoveItem({ onChange, onItemRemove }),
  }
}
