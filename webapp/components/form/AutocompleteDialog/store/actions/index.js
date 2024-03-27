import { useFocusItem } from './useFocusItem'
import { useOnInputFieldKeyDown } from './useOnInputFieldKeyDown'
import { useOnListItemKeyDown } from './useOnListItemKeyDown'
import { useOnOutsideClick } from './useOnOutsideClick'

export const useActions = ({ setState, onItemSelect, onClose }) => {
  const focusItem = useFocusItem({ setState })
  return {
    onListItemKeyDown: useOnListItemKeyDown({ onItemSelect, onClose, focusItem }),
    onInputFieldKeyDown: useOnInputFieldKeyDown({ onClose, focusItem }),
    onOutsideClick: useOnOutsideClick({ onClose }),
  }
}
