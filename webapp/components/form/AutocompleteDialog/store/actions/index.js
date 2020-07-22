import { useFocusItem } from './useFocusItem'
import { useOnListItemKeyDown } from './useOnListItemKeyDown'
import { useOnInputFieldKeyDown } from './useOnInputFieldKeyDown'
import { useOnOutsideClick } from './useOnOutsideClick'

export const useActions = ({ setState, onItemSelect, onClose }) => {
  const focusItem = useFocusItem({ setState })
  return {
    onListItemKeyDown: useOnListItemKeyDown({ onItemSelect, onClose, focusItem }),
    onInputFieldKeyDown: useOnInputFieldKeyDown({ onItemSelect, onClose, focusItem }),
    onOutsideClick: useOnOutsideClick({ onClose }),
  }
}
