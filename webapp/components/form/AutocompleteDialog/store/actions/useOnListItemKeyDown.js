import { useCallback } from 'react'

import { KeyboardMap } from '@webapp/utils/keyboardMap'

import { State } from '../state'

const offsetByKey = {
  [KeyboardMap.PageUp]: -10,
  [KeyboardMap.PageDown]: 10,
  [KeyboardMap.Up]: -1,
  [KeyboardMap.Down]: 1,
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
    ({ state }) => (event) => {
      event.stopPropagation()
      event.preventDefault()

      const list = State.getList(state)
      const items = State.getItems(state)
      const focusedItemIndex = State.getFocusedItemIndex(state)
      const inputField = State.getInputField(state)

      const itemsSize = State.getItemsSize(state)

      if (itemsSize > 0) {
        switch (event.key) {
          case KeyboardMap.Enter:
          case KeyboardMap.Space:
            onItemSelect(items[focusedItemIndex])
            break
          case KeyboardMap.Esc:
            onClose()
            inputField.focus()
            break
          case KeyboardMap.PageUp:
          case KeyboardMap.PageDown:
          case KeyboardMap.Up:
          case KeyboardMap.Down:
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
