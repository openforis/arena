import './dropdown.scss'

import React from 'react'
import ReactDOM from 'react-dom'

import * as R from 'ramda'

import { clickedOutside, elementOffset } from '../../appUtils/domUtils'
import { Input } from './input'

const dropdownListItemClassName = 'dropdown__list-item'

class Dropdown extends React.Component {

  constructor (props) {
    super(props)

    const {items, selection, autocompleteMinChars} = this.props

    this.state = {
      items: autocompleteMinChars > 0 ? [] : items,
      displayValue: this.getItemLabel(selection),
      itemsFocusIndex: -1,
      opened: false,
    }

    this.outsideClick = this.outsideClick.bind(this)
    this.onSelectionChange = this.onSelectionChange.bind(this)

    this.dropdown = React.createRef()
    this.input = React.createRef()
    this.dropdownList = React.createRef()

    window.addEventListener('click', this.outsideClick)
  }

  componentDidUpdate (prevProps, prevState, snapshot) {
    const {items, autocompleteMinChars} = this.props
    if (prevProps.items.length !== items.length)
      this.setState({
        items: autocompleteMinChars > 0 ? [] : items
      })
  }

  componentWillUnmount () {
    window.removeEventListener('click', this.outsideClick)
  }

  getInputEl () {
    return this.input.current.inputElement
  }

  outsideClick (evt) {
    if (this.isOpened() && clickedOutside(this.dropdown.current, evt)) {
      this.toggleOpened()
    }
  }

  toggleOpened (callback = null) {
    if (!(this.props.readOnly || this.props.disabled)) {
      this.setState({
        opened: !this.state.opened,
        itemsFocusIndex: -1,
      }, callback)
    }
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
      itemsFocusIndex: -1,
      opened: false,
    })
  }

  selectFocusedItem () {
    const {itemsFocusIndex, items} = this.state
    if (itemsFocusIndex >= 0) {
      this.onSelectionChange(items[itemsFocusIndex])
    }
  }

  onInputChange (evt) {
    const {value = ''} = evt.target

    const {items, autocompleteMinChars} = this.props

    const contains = (a = '', b = '') => R.contains(R.toLower(a), R.toLower(b))

    const searchValue = R.trim(value)

    const filteredItems =
      autocompleteMinChars <= 0 && searchValue.length === 0 ?
        items
        : autocompleteMinChars > 0 && searchValue.length < autocompleteMinChars ?
        []
        : items.filter(item => item.key
          ? contains(searchValue, item.key) || contains(searchValue, item.value)
          : contains(searchValue, item)
        )

    this.setState({
      items: filteredItems,
      displayValue: value,
      itemsFocusIndex: -1,
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
    const itemFocused = R.prop('className')(e.relatedTarget) === dropdownListItemClassName
    if (this.isOpened() && !itemFocused) {
      this.toggleOpened()
    }
  }

  onInputKeyDown (e) {
    const {items} = this.state
    if (items.length > 0 && e.keyCode === 40) { //arrow down
      if (!this.isOpened()) {
        this.toggleOpened(() => this.focusItem(0))
      } else {
        this.focusItem(0)
      }
    }
  }

  onListItemKeyDown (e) {
    e.stopPropagation()
    e.preventDefault()

    const {items, itemsFocusIndex} = this.state
    if (items.length > 0) {
      let offset = 0
      switch (e.keyCode) {
        case 13: //enter
        case 32: //space
          this.selectFocusedItem()
          break
        case 27: //escape
          this.toggleOpened()
          this.getInputEl().focus()
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
        let index = itemsFocusIndex + offset
        if (index < 0)
          index = 0
        else if (index >= items.length)
          index = items.length - 1
        this.focusItem(index)
      }
    }
  }

  focusItem (index) {
    const dropdownEl = this.dropdownList.current
    const itemEl = dropdownEl.getElementsByClassName(dropdownListItemClassName)[index]
    if (!itemEl) {
      console.log(index)
    }
    itemEl.focus()

    this.setState({
      itemsFocusIndex: index
    })
  }

  getOffset () {
    const {
      top,
      left,
      height,
      width
    } = elementOffset(this.getInputEl())

    return {
      top: (top + height),
      left,
      width
    }
  }

  getItemLabel (item = '') {
    return item ? item.key ? `${item.value}` : item : ''
  }

  render () {
    const {
      placeholder,
      className = '',
      style = {},
      validation = {},
      readOnly,
      disabled,
    } = this.props

    const {
      items,
      displayValue,
    } = this.state

    return <div ref={this.dropdown}
                className={`dropdown ${className}`}
                style={style}
                onBlur={e => this.onBlur(e)}>
      <Input ref={this.input}
             placeholder={placeholder}
             value={displayValue}
             validation={validation}
             readOnly={readOnly}
             disabled={disabled}
             onChange={e => this.onInputChange(e)}
             onFocus={e => this.onInputFocus(e)}
             onKeyDown={e => this.onInputKeyDown(e)}/>

      <span className="icon icon-menu2 icon-24px"
            onClick={() => this.toggleOpened()}
            aria-disabled={disabled}/>
      {
        this.isOpened() ?
          ReactDOM.createPortal(
            <div ref={this.dropdownList}
                 className="dropdown__list"
                 style={{
                   ...this.getOffset(),
                 }}>
              {
                items.map(
                  item => <div key={item.key ? item.key : item} className={dropdownListItemClassName}
                               onMouseDown={e => this.onSelectionChange(item)}
                               onKeyDown={e => this.onListItemKeyDown(e)}
                               tabIndex="1">
                    {this.getItemLabel(item)}
                  </div>
                )
              }
            </div>,
            document.body
          )
          : null

      }
    </div>
  }
}

Dropdown.defaultProps = {
  clearOnSelection: false,
  autocompleteMinChars: 0,
  readOnly: false,
  disabled: false,
  items: [],
  selection: null,
  onChange: null,
}

export default Dropdown