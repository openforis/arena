import { useCallback } from 'react'
import { KeyboardMap } from '@webapp/utils/keyboardMap'
import { State } from '@webapp/components/form/AutocompleteDialog/store'

export const useOnInputFieldKeyDown = ({ onClose, focusItem }) =>
  useCallback(({ event, list, state }) => {
    const items = State.getItems(state)
    const inputField = State.getInputField(state)
    switch (event.keyCode) {
      case KeyboardMap.Down:
      case KeyboardMap.Tab:
        if (items.length > 0) {
          event.preventDefault()
          // Focus first item
          focusItem({ list, index: 0 })
        } else {
          onClose()
        }

        break
      case KeyboardMap.Esc:
        onClose()
        inputField.focus()
        break
      default:
      // Do nothing
    }
  }, [])
