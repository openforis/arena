import './dropdown.scss'

import React from 'react'

import { clickedOutside, elementOffset } from '../appUtils/domUtils'

class Dropdown extends React.Component {

  constructor (props) {
    super(props)
    this.state = {
      items: props.items,
      value: props.value,
      opened: false
    }

    this.outsideClick = this.outsideClick.bind(this)
    this.onChange = this.onChange.bind(this)
    this.onInputChange = this.onInputChange.bind(this)

    window.addEventListener('click', this.outsideClick)
  }

  componentWillUnmount () {
    window.removeEventListener('click', this.outsideClick)
  }

  dropdown () {
    return this.refs.dropdown
  }

  toggleOpened () {
    this.setState({opened: !this.state.opened})
  }

  isOpened () {
    return this.state.opened
  }

  outsideClick (evt) {
    if (this.isOpened() && clickedOutside(this.dropdown(), evt)) {
      this.toggleOpened()
    }
  }

  onChange (item) {
    this.props.onChange(item)
    this.toggleOpened()
  }

  onInputChange (evt) {
    const {value = ''} = evt.target
    const {items} = this.props

    const filteredItems = R.trim(value).length > 0
      ? items.filter(item => {
        return R.contains(value, item) ||
          R.contains(value, item.key) ||
          R.contains(value, item.label)
      })
      : items

    const selected = filteredItems.length < 2

    this.setState({
      items: filteredItems,
      value: value,
      opened: !selected,
    })

    if(selected)
      this.onChange(R.head(filteredItems))
  }

  getOffset () {
    const {
      top,
      left,
      height,
      width
    } = elementOffset(this.refs.dropdownInput)

    return {
      top: (top + height),
      // left,
      width
    }
  }

  getItemLabel (item = '') {
    return item.value ? `${item.value} (${item.key})` : item
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
      inputClassName = '',
    } = this.props

    const {
      items,
      value,
    } = this.state

    return <div className={`dropdown ${className}`} style={style} ref="dropdown">
      <input placeholder={placeholder}
             value={this.getItemLabelFromValue(value)}
             className={inputClassName}
             ref="dropdownInput"/>
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
                               onClick={() => this.onChange(item)}>
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