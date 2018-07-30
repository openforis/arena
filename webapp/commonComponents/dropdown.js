import './dropdown.scss'

import React from 'react'

import { clickedOutside, elementOffset } from '../appUtils/domUtils'

class Dropdown extends React.Component {

  constructor () {
    super()
    this.state = {opened: false}

    this.outsideClick = this.outsideClick.bind(this)
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

  render () {
    const {
      items,
      placeholder,
      value,
      className,
      style = {},
      inputClassName = ''
    } = this.props

    return <div className={`dropdown ${className}`} style={style} ref="dropdown">
      <input placeholder={placeholder}
             value={value}
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
                  item => <div key={item.key ? item.key : item} className="dropdown__list-item">
                    {item.value ? `${item.value} (${item.key})` : item}
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