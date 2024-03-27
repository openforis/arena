import { useCallback } from 'react'

import { KeyboardKeys } from '@webapp/utils/keyboardKeys'

import { State } from '../state'

const offsetByKey = {
  [KeyboardKeys.PageUp]: -10,
  [KeyboardKeys.PageDown]: 10,
  [KeyboardKeys.ArrowUp]: -1,
  [KeyboardKeys.ArrowDown]: 1,
}

const calculateNewIndexWithOffset = ({ offset, focusedItemIndex, itemsSize }) => {
  let index = focusedItemIndex + offset
  if (index < 0) {
    index = 0
  } else if (index >= itemsSize) {
    index = itemsSize - 1
  }
  return index
}

export const useOnListItemKeyDown = ({ onItemSelect, onClose, focusItem }) =>
  useCallback(
    ({ state }) =>
      (event) => {
        event.stopPropagation()
        event.preventDefault()

        const list = State.getList(state)
        const items = State.getItems(state)
        const focusedItemIndex = State.getFocusedItemIndex(state)
        const inputField = State.getInputField(state)

        const itemsSize = State.getItemsSize(state)

        if (itemsSize > 0) {
          switch (event.key) {
            case KeyboardKeys.Enter:
            case KeyboardKeys.Space:
              onItemSelect(items[focusedItemIndex])
              break
            case KeyboardKeys.Escape:
              onClose()
              inputField.focus()
              break
            case KeyboardKeys.PageUp:
            case KeyboardKeys.PageDown:
            case KeyboardKeys.ArrowUp:
            case KeyboardKeys.ArrowDown:
              focusItem({
                list,
                index: calculateNewIndexWithOffset({
                  offset: offsetByKey[event.key],
                  focusedItemIndex,
                  itemsSize,
                }),
              })
              break
            default:
            // Do nothing
          }
        }
      },
    []
  )
