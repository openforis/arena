import './AutocompleteDialog.scss'

import React, { useRef, useCallback, useState, useEffect } from 'react'
import PropTypes from 'prop-types'

import { KeyboardMap } from '@webapp/utils/keyboardMap'
import { clickedOutside, elementOffset } from '@webapp/utils/domUtils'

const offsetByKey = {
  [KeyboardMap.PageUp]: -10,
  [KeyboardMap.PageDown]: 10,
  [KeyboardMap.Up]: -1,
  [KeyboardMap.Down]: 1,
}

const AutocompleteDialog = (props) => {
  const {
    inputField,
    sourceElement,
    items,
    itemRenderer: ItemRenderer,
    itemLabel,
    itemKeyFunction,
    className,
    onItemSelect: selectItem,
    onClose: close,
  } = props
  const list = useRef(null)
  const [focusedItemIndex, setFocusedItemIndex] = useState(null)

  const calculatePosition = useCallback(() => {
    const { top, left, height, width } = elementOffset(sourceElement || inputField)
    return {
      top: top + height,
      left,
      width,
    }
  }, [sourceElement, inputField])

  const focusItem = useCallback(
    (index) => {
      const itemEl = list.current && list.current.children && list.current.children[index]
      itemEl.focus()
      setFocusedItemIndex(index)
    },
    [list]
  )
  const onOutsideClick = useCallback(
    (event) => {
      if (clickedOutside(list.current, event) && clickedOutside(inputField, event)) {
        close()
      }
    },
    [inputField, list, close]
  )

  const onInputFieldKeyDown = useCallback(
    (event) => {
      switch (event.keyCode) {
        case KeyboardMap.Down:
        case KeyboardMap.Tab:
          if ((items || []).length > 0) {
            event.preventDefault()
            // Focus first item
            focusItem(0)
          } else {
            close()
          }

          break
        case KeyboardMap.Esc:
          close()
          inputField.focus()
          break
        default:
        // Do nothing
      }
    },
    [items, inputField, focusItem, close]
  )

  const calculateNewIndexWithOffset = useCallback(
    (offset) => {
      const itemsSize = (items || []).length
      let index = focusedItemIndex + offset
      if (index < 0) {
        index = 0
      } else if (index >= itemsSize) {
        index = itemsSize - 1
      }
      return index
    },
    [items, focusedItemIndex]
  )

  const onListItemKeyDown = useCallback(
    (event) => {
      event.stopPropagation()
      event.preventDefault()
      const itemsSize = (items || []).length

      if (itemsSize > 0) {
        switch (event.keyCode) {
          case KeyboardMap.Enter:
          case KeyboardMap.Space:
            selectItem(items[focusedItemIndex])
            break
          case KeyboardMap.Esc:
            close()
            inputField.focus()
            break
          case KeyboardMap.PageUp:
          case KeyboardMap.PageDown:
          case KeyboardMap.Up:
          case KeyboardMap.Down:
            focusItem(calculateNewIndexWithOffset(offsetByKey[event.keyCode]))
            break
          default:
          // Do nothing
        }
      }
    },
    [items, inputField, close, focusItem, focusedItemIndex, selectItem, calculateNewIndexWithOffset]
  )

  useEffect(() => {
    if (inputField) {
      inputField.addEventListener('keydown', onInputFieldKeyDown)
    }
    window.addEventListener('click', onOutsideClick)

    return () => {
      if (inputField) {
        inputField.removeEventListener('keydown', onInputFieldKeyDown)
      }

      window.removeEventListener('click', onOutsideClick)
    }
  }, [inputField, onInputFieldKeyDown, onOutsideClick])

  return (
    <div ref={list} className={`autocomplete-list ${className}`} style={{ ...calculatePosition() }}>
      {(items || []).map((item) => (
        <ItemRenderer
          key={itemKeyFunction(item)}
          tabIndex="0"
          item={item}
          itemLabel={itemLabel}
          onKeyDown={onListItemKeyDown}
          onMouseDown={selectItem}
        />
      ))}
    </div>
  )
}

AutocompleteDialog.propTypes = {
  inputField: PropTypes.any,
  sourceElement: PropTypes.any,
  items: PropTypes.array,
  itemRenderer: PropTypes.any,
  itemLabel: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
  itemKeyFunction: PropTypes.func,
  className: PropTypes.string,
  onItemSelect: PropTypes.func,
  onClose: PropTypes.func,
}

AutocompleteDialog.defaultProps = {
  items: [],
  itemRenderer: null,
  itemLabel: null, // required prop / string or function
  itemKeyFunction: null, // required prop / string or function - Rename it to itemKey
  inputField: null,
  sourceElement: null, // Used to calculate the size of the dialog if available, otherwise the input field is used
  className: '',
  onItemSelect: null,
  onClose: null,
}

export default AutocompleteDialog
