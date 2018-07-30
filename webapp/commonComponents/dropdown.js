import './dropdown.scss'

import React from 'react'

import * as R from 'ramda'

import { clickedOutside, elementOffset } from '../appUtils/domUtils'
import { FormInput } from './form'

class Dropdown extends React.Component {

  constructor (props) {
    super(props)

    const {items, selection} = this.props

    this.state = {
      items,
      selection,
      displayValue: this.getItemLabel(selection),
      opened: false
    }

    this.outsideClick = this.outsideClick.bind(this)
    this.onSelectionChange = this.onSelectionChange.bind(this)
    this.onInputChange = this.onInputChange.bind(this)

    window.addEventListener('click', this.outsideClick)
  }

  componentWillUnmount () {
    window.removeEventListener('click', this.outsideClick)
  }

  toggleOpened () {
    this.setState({opened: !this.state.opened})
  }

  isOpened () {
    return this.state.opened
  }

  outsideClick (evt) {
    if (this.isOpened() && clickedOutside(this.refs.dropdown, evt)) {
      this.toggleOpened()
    }
  }

  onSelectionChange (item) {
    this.props.onChange(item)

    this.setState({
      selection: item,
      displayValue: this.getItemLabel(item),
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

    const selected = filteredItems.length === 1

    const selection = selected ? R.head(filteredItems) : null

    this.setState({
      items: filteredItems,
      selection,
      displayValue: selected ? this.getItemLabel(selection) : value,
      opened: !selected,
    })

    this.props.onChange(selection)
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
      ? item.value ? `${item.value} (${item.key})` : item
      : ''
  }

  getItemLabelFromValue (value = '') {
    const item = this.props.items.find(item => item.key ? item.key === value : item === value)
    return this.getItemLabel(item)
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
                 onChange={this.onInputChange}/>


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

export default Dropdown