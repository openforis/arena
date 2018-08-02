import './dropdown.scss'

import React from 'react'
import ReactDOM from 'react-dom'

import * as R from 'ramda'

import { clickedOutside, elementOffset } from '../appUtils/domUtils'
import { FormInput } from './formInputComponents'

class DropdownComponent extends React.Component {

  constructor (props) {
    super(props)

    const {items, selection} = this.props

    this.state = {
      items,
      displayValue: this.getItemLabel(selection),
      focusedItemIndex: -1,
      opened: false,
    }

    this.outsideClick = this.outsideClick.bind(this)
    this.onSelectionChange = this.onSelectionChange.bind(this)

    window.addEventListener('click', this.outsideClick)
  }

  componentDidUpdate (prevProps, prevState, snapshot) {
    const {items} = this.props
    if (prevProps.items.length !== items.length)
      this.setState({items})
  }

  componentWillUnmount () {
    window.removeEventListener('click', this.outsideClick)
  }

  outsideClick (evt) {
    if (this.isOpened() && clickedOutside(this.refs.dropdown, evt)) {
      this.toggleOpened()
    }
  }

  toggleOpened () {
    this.setState({
      opened: !this.state.opened,
      focusedItemIndex: -1,
    })
  }

  isOpened () {
    return this.state.opened
  }

  onSelectionChange (item) {
    const {onChange, clearOnSelection} = this.props

    onChange(item)

    this.setState({
      selection: clearOnSelection ? null : item,
      displayValue: clearOnSelection ? '' : this.getItemLabel(item),
      focusedItemIndex: -1,
      opened: false,
    })
  }

  selectFocusedItem () {
    const {focusedItemIndex, items} = this.state
    if (focusedItemIndex >= 0) {
      this.onSelectionChange(items[focusedItemIndex])
    }
  }

  onInputChange (evt) {
    const {value = ''} = evt.target

    const {items} = this.props

    const contains = (a = '', b = '') => R.contains(R.toLower(a), R.toLower(b))

    const filteredItems = R.trim(value).length > 0
      ? items.filter(item => item.key
        ? contains(value, item.key) || contains(value, item.value)
        : contains(value, item)
      )
      : items

    this.setState({
      items: filteredItems,
      displayValue: value,
      focusedItemIndex: -1,
      opened: true,
    })

    this.props.onChange(null)
  }

  onInputFocus (e) {
    if (!this.isOpened() && this.props.selection === null) {
      this.toggleOpened()
    }
  }

  onBlur (e) {
    const focusRequestedOnDropdownListItem = R.prop('className')(e.relatedTarget) === 'dropdown__list-item'
    if (this.isOpened() && !focusRequestedOnDropdownListItem) {
      this.toggleOpened()
    }
  }

  onInputKeyDown (e) {
    const {items} = this.state
    if (items.length > 0 && e.keyCode === 40) { //arrow down
      this.setFocusOnDropdownListItem(0)
    }
  }

  onListItemKeyDown (e) {
    e.stopPropagation()
    e.preventDefault()

    const {items, focusedItemIndex} = this.state
    if (items.length > 0) {
      let offset = 0
      switch (e.keyCode) {
        case 13: //enter
        case 32: //space
          this.selectFocusedItem()
          break
        case 27:
          this.toggleOpened()
          ReactDOM.findDOMNode(this.refs.dropdownInput.refs.input).focus()
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
        let index = focusedItemIndex + offset
        if (index < 0)
          index = 0
        else if (index >= items.length)
          index = items.length - 1
        this.setFocusOnDropdownListItem(index)
      }
    }
  }

  setFocusOnDropdownListItem (index) {
    const dropdownEl = ReactDOM.findDOMNode(this.refs.dropdown)
    const itemEl = dropdownEl.getElementsByClassName('dropdown__list-item')[index]
    itemEl.focus()

    this.setState({
      focusedItemIndex: index
    })
  }

  getOffset () {
    const {
      top,
      left,
      height,
      width
    } = elementOffset(this.refs.dropdownInput.refs.input)

    return {
      top: (top + height),
      // left,
      width
    }
  }

  getItemLabel (item = '') {
    return item
      ? item.key ? `${item.value} (${item.key})` : item
      : ''
  }

  render () {
    const {
      placeholder,
      className = '',
      style = {},
      validation = {},
    } = this.props

    const {
      items,
      displayValue,
    } = this.state

    return <div className={`dropdown ${className}`}
                style={style}
                ref="dropdown"
                onBlur={e => this.onBlur(e)}>
      <FormInput placeholder={placeholder}
                 value={displayValue}
                 validation={validation}
                 ref="dropdownInput"
                 onChange={e => this.onInputChange(e)}
                 onFocus={e => this.onInputFocus(e)}
                 onKeyDown={e => this.onInputKeyDown(e)}/>

      <span className="icon icon-menu2 icon-24px"
            onClick={() => this.toggleOpened()}></span>
      {
        this.isOpened()
          ? (
            <div className="dropdown__list"
                 style={{
                   ...this.getOffset(),
                 }}>
              {
                items.map(
                  item => <div key={item.key ? item.key : item} className="dropdown__list-item"
                               onMouseDown={e => this.onSelectionChange(item)}
                               onKeyDown={e => this.onListItemKeyDown(e)}
                               tabIndex="1">
                    {this.getItemLabel(item)}
                  </div>
                )
              }
            </div>
          )
          : (
            null
          )
      }
    </div>
  }
}

DropdownComponent.defaultProps = {
  clearOnSelection: false
}

export default DropdownComponent