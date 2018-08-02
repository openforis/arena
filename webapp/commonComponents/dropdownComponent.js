import './dropdown.scss'

import React from 'react'

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
      opened: false
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
    this.setState({opened: !this.state.opened})
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
      opened: false,
    })
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
      opened: true,
    })

    this.props.onChange(null)
  }

  onInputFocus (e) {
    if (! this.isOpened() && this.props.selection === null) {
      this.toggleOpened()
    }
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
      className,
      style = {},
      validation = {},
    } = this.props

    const {
      items,
      displayValue,
    } = this.state

    return <div className={`dropdown ${className}`} style={style} ref="dropdown">
      <FormInput placeholder={placeholder}
                 value={displayValue}
                 validation={validation}
                 ref="dropdownInput"
                 onChange={e => this.onInputChange(e)}
                 onFocus={e => this.onInputFocus(e)} />


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
                               onClick={() => this.onSelectionChange(item)}>
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