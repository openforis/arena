import './autocomplete.scss'

import React from 'react'
import { EventEmitter } from 'events'

import { elementOffset } from '../../appUtils/domUtils'

class Autocomplete extends React.Component {

  constructor (props) {
    super(props)

    const {onItemSelect, onClose} = props

    //add event listeners
    this.eventEmitter = new EventEmitter()
    this.eventEmitter.on(Autocomplete.events.itemSelect, onItemSelect)
    this.eventEmitter.on(Autocomplete.events.close, onClose)

    this.list = React.createRef()
    this.onInputFieldKeyDown = this.onInputFieldKeyDown.bind(this)
  }

  componentDidMount () {
    const {inputField} = this.props

    inputField.addEventListener('keydown', this.onInputFieldKeyDown)
  }

  componentWillUnmount () {
    const {inputField} = this.props

    if (inputField) {
      inputField.removeEventListener('keydown', this.onInputFieldKeyDown)
    }

    this.eventEmitter.removeAllListeners()
  }

  onInputFieldKeyDown (e) {
    const {items, inputField} = this.props

    switch (e.keyCode) {
      case 40: //arrow down
        if (items.length > 0) { //arrow down
          this.focusItem(0)
        }
        break
      case 27: //escape
        this.close()
        inputField.focus()
        break
    }

    if (items.length > 0 && e.keyCode === 40) { //arrow down
      this.focusItem(0)
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
          this.dispatchItemSelectEvent(this.focusedItemIndex)
          break
        case 27: //escape
          this.close()
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
    this.dispatchItemSelectEvent(this.props.items.indexOf(item))
  }

  dispatchItemSelectEvent (index) {
    this.eventEmitter.emit(Autocomplete.events.itemSelect, {index})
  }

  close () {
    this.eventEmitter.emit(Autocomplete.events.close)
  }

  calculatePosition () {
    const {inputField} = this.props

    const {
      top,
      left,
      height,
    } = elementOffset(inputField)

    return {
      top: (top + height),
      left,
    }
  }

  render () {
    const {items, itemRenderer} = this.props

    const ItemRenderer = itemRenderer

    return (
      <div ref={this.list}
           className="autocomplete-list"
           style={{...this.calculatePosition()}}>
        {
          items.map(item => (
            <ItemRenderer key={item.uuid}
                          item={item}
                          onKeyDown={e => this.onListItemKeyDown(e)}
                          onMouseDown={() => this.onItemClick(item)}/>
          ))
        }
      </div>
    )
  }
}

Autocomplete.events = {
  itemSelect: 'itemSelect',
  close: 'close',
}

export default Autocomplete