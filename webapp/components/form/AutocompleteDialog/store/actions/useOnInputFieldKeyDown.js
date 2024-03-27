import { useCallback } from 'react'

import { KeyboardKeys } from '@webapp/utils/keyboardKeys'

import { State } from '../state'

export const useOnInputFieldKeyDown = ({ onClose, focusItem }) =>
  useCallback(
    ({ state }) =>
      (event) => {
        const list = State.getList(state)
        const items = State.getItems(state)
        const inputField = State.getInputField(state)
        switch (event.key) {
          case KeyboardKeys.ArrowDown:
          case KeyboardKeys.Tab:
            if (items.length > 0) {
              event.preventDefault()
              // Focus first item
              focusItem({ list, index: 0 })
            } else {
              onClose()
            }

            break
          case KeyboardKeys.Escape:
            onClose()
            inputField.focus()
            break
          default:
          // Do nothing
        }
      },
    []
  )
