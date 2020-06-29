import './autocompleteDialog.scss'

import React from 'react'

import { KeyboardMap } from '@webapp/utils/keyboardMap'
import { clickedOutside, elementOffset } from '@webapp/utils/domUtils'

class AutocompleteDialog extends React.Component {
  constructor(props) {
    super(props)

    this.onInputFieldKeyDown = this.onInputFieldKeyDown.bind(this)
    this.onOutsideClick = this.onOutsideClick.bind(this)

    this.list = React.createRef()
  }

  componentDidMount() {
    const { inputField } = this.props

    inputField.addEventListener('keydown', this.onInputFieldKeyDown)
    window.addEventListener('click', this.onOutsideClick)
  }

  componentWillUnmount() {
    const { inputField } = this.props

    if (inputField) {
      inputField.removeEventListener('keydown', this.onInputFieldKeyDown)
    }

    window.removeEventListener('click', this.onOutsideClick)
  }

  onOutsideClick(evt) {
    const { inputField } = this.props

    if (clickedOutside(this.list.current, evt) && clickedOutside(inputField, evt)) {
      this.close()
    }
  }

  onInputFieldKeyDown(e) {
    const { items, inputField } = this.props

    switch (e.keyCode) {
      case KeyboardMap.Down:
      case KeyboardMap.Tab:
        if (items.length > 0) {
          e.preventDefault()
          // Focus first item
          this.focusItem(0)
        } else {
          this.close()
        }

        break
      case KeyboardMap.Esc:
        this.close()
        inputField.focus()
        break
      default:
      // Do nothing
    }
  }

  onListItemKeyDown(e) {
    e.stopPropagation()
    e.preventDefault()

    const { items, inputField } = this.props

    const itemsSize = items.length
    if (itemsSize > 0) {
      let offset = 0
      switch (e.keyCode) {
        case KeyboardMap.Enter:
        case KeyboardMap.Space:
          this.selectItem(items[this.focusedItemIndex])
          break
        case KeyboardMap.Esc:
          this.close()
          inputField.focus()
          break
        case KeyboardMap.PageUp:
          offset = -10
          break
        case KeyboardMap.PageDown:
          offset = 10
          break
        case KeyboardMap.Up:
          offset = -1
          break
        case KeyboardMap.Down:
          offset = 1
          break
        default:
        // Do nothing
      }

      if (offset) {
        let index = this.focusedItemIndex + offset
        if (index < 0) {
          index = 0
        } else if (index >= itemsSize) {
          index = itemsSize - 1
        }

        this.focusItem(index)
      }
    }
  }

  focusItem(index) {
    const itemEl = this.list.current.children[index]
    itemEl.focus()

    this.focusedItemIndex = index
  }

  selectItem(item) {
    const { onItemSelect } = this.props
    if (onItemSelect) {
      onItemSelect(item)
    }
  }

  close() {
    const { onClose } = this.props
    if (onClose) {
      onClose()
    }
  }

  calculatePosition() {
    const { sourceElement, inputField } = this.props

    const { top, left, height, width } = elementOffset(sourceElement || inputField)

    return {
      top: top + height,
      left,
      width,
    }
  }

  render() {
    const { items, itemRenderer, itemLabel, itemKeyFunction, className } = this.props

    const ItemRenderer = itemRenderer

    return (
      <div ref={this.list} className={`autocomplete-list ${className}`} style={{ ...this.calculatePosition() }}>
        {items.map((item) => (
          <ItemRenderer
            key={itemKeyFunction(item)}
            tabIndex="0"
            item={item}
            itemLabel={itemLabel}
            onKeyDown={(e) => this.onListItemKeyDown(e)}
            onMouseDown={() => this.selectItem(item)}
          />
        ))}
      </div>
    )
  }
}

AutocompleteDialog.defaultProps = {
  items: [],
  itemRenderer: null,
  itemLabel: null, // required prop / string or function
  itemKeyFunction: null, // required prop / string or function - Rename it to itemKey
  inputField: null,
  sourceElement: null, // Used to calculate the size of the dialog if available, otherwise the input field is used
  className: '',
}

export default AutocompleteDialog
