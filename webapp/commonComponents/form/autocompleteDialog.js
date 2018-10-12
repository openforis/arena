import './autocompleteDialog.scss'

import React from 'react'
import * as R from 'ramda'
import { EventEmitter } from 'events'

import { clickedOutside, elementOffset } from '../../appUtils/domUtils'

class AutocompleteDialog extends React.Component {

  constructor (props) {
    super(props)

    const {onItemSelect, onClose} = props

    //add event listeners
    this.eventEmitter = new EventEmitter()
    this.eventEmitter.on(AutocompleteDialog.events.itemSelect, onItemSelect)
    this.eventEmitter.on(AutocompleteDialog.events.close, onClose)

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

    this.eventEmitter.removeAllListeners()

    window.removeEventListener('click', this.onOutsideClick)
  }

  onOutsideClick (evt) {
    const {inputField} = this.props

    if (clickedOutside(this.list.current, evt) && clickedOutside(inputField, evt)) {
      this.dispatchCloseEvent()
    }
  }

  onInputFieldKeyDown (e) {
    const {items, inputField} = this.props

    switch (e.keyCode) {
      case 40: //arrow down
      case 9: //tab
        if (items.length > 0) {
          e.preventDefault()
          //focus first item
          this.focusItem(0)
        } else {
          this.dispatchCloseEvent()
        }
        break
      case 27: //escape
        //close dialog
        this.dispatchCloseEvent()
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
        case 13: //enter
        case 32: //space
          this.dispatchItemSelectEvent(items[this.focusedItemIndex])
          break
        case 27: //escape
          this.dispatchCloseEvent()
          inputField.focus()
          break
        case 33: //page up
          offset = -10
          break
        case 34: //page down
          offset = 10
          break
        case 38: //arrow up
          offset = -1
          break
        case 40: //arrow down
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
    if (!itemEl) {
      console.log(index)
    }
    itemEl.focus()

    this.focusedItemIndex = index
  }

  onItemClick (item) {
    this.dispatchItemSelectEvent(item)
  }

  dispatchItemSelectEvent (item) {
    this.eventEmitter.emit(AutocompleteDialog.events.itemSelect, item)
  }

  dispatchCloseEvent () {
    this.eventEmitter.emit(AutocompleteDialog.events.close)
  }

  calculatePosition () {
    const {alignToElement, limitToInputFieldWidth = true} = this.props

    const {
      top,
      left,
      height,
      width,
    } = elementOffset(alignToElement)

    const style = {
      top: (top + height),
      left,
    }

    return limitToInputFieldWidth
      ? R.assoc('width', width)(style)
      : style
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
                          onMouseDown={() => this.onItemClick(item)}/>
          ))
        }
      </div>
    )
  }
}

AutocompleteDialog.events = {
  itemSelect: 'itemSelect',
  close: 'close',
}

export default AutocompleteDialog