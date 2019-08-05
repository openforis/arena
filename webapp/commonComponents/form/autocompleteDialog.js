import './autocompleteDialog.scss'

import React from 'react'

import KeyboardMap from '../../utils/keyboardMap'
import { clickedOutside, elementOffset } from '../../utils/domUtils'

class AutocompleteDialog extends React.Component {

  constructor (props) {
    super(props)

    this.onInputFieldKeyDown = this.onInputFieldKeyDown.bind(this)
    this.onOutsideClick = this.onOutsideClick.bind(this)

    this.list = React.createRef()
  }

  componentDidMount () {
    const {inputField} = this.props

    inputField.addEventListener('keydown', this.onInputFieldKeyDown)
    window.addEventListener('click', this.onOutsideClick)
  }

  componentWillUnmount () {
    const {inputField} = this.props

    if (inputField) {
      inputField.removeEventListener('keydown', this.onInputFieldKeyDown)
    }

    window.removeEventListener('click', this.onOutsideClick)
  }

  onOutsideClick (evt) {
    const {inputField} = this.props

    if (clickedOutside(this.list.current, evt) && clickedOutside(inputField, evt)) {
      this.close()
    }
  }

  onInputFieldKeyDown (e) {
    const {items, inputField} = this.props

    switch (e.keyCode) {
      case KeyboardMap.Down:
      case KeyboardMap.Tab:
        if (items.length > 0) {
          e.preventDefault()
          //focus first item
          this.focusItem(0)
        } else {
          this.close()
        }
        break
      case KeyboardMap.Esc:
        this.close()
        inputField.focus()
        break
    }
  }

  onListItemKeyDown (e) {
    e.stopPropagation()
    e.preventDefault()

    const {items, inputField} = this.props

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
      }
      if (offset) {
        let index = this.focusedItemIndex + offset
        if (index < 0)
          index = 0
        else if (index >= itemsSize)
          index = itemsSize - 1

        this.focusItem(index)
      }
    }
  }

  focusItem (index) {
    const itemEl = this.list.current.children[index]
    itemEl.focus()

    this.focusedItemIndex = index
  }

  selectItem (item) {
    const {onItemSelect} = this.props
    if (onItemSelect)
      onItemSelect(item)
  }

  close () {
    const {onClose} = this.props
    if (onClose)
      onClose()
  }

  calculatePosition () {
    const {inputField} = this.props

    const {
      top,
      left,
      height,
      width,
    } = elementOffset(inputField)

    return {
      top: (top + height),
      left,
      width
    }
  }

  render () {
    const {items, itemRenderer, itemKeyFunction, className} = this.props

    const ItemRenderer = itemRenderer

    return (
      <div ref={this.list}
           className={`autocomplete-list ${className}`}
           style={{...this.calculatePosition()}}>
        {
          items.map(item => (
            <ItemRenderer key={itemKeyFunction(item)}
                          tabIndex="1"
                          item={item}
                          onKeyDown={e => this.onListItemKeyDown(e)}
                          onMouseDown={() => this.selectItem(item)}/>
          ))
        }
      </div>
    )
  }
}

AutocompleteDialog.defaultProps = {
  items: [],
  itemRenderer: null,
  itemKeyFunction: null,
  inputField: null,
  className: '',
}

export default AutocompleteDialog