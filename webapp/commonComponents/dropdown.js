import React from 'react'

import { elementOffset, clickedOutside } from '../app-utils/domUtils'

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
    } = elementOffset(this.dropdown())

    return {
      top,
      left,
      width
    }
  }

  render () {
    const {
      selection,
      placeholder,
      value,
      className,
      style = {},
    } = this.props

    return <div className={`dropdown ${className}`} style={style} ref="dropdown">
      <input className="text-center"
             placeholder={placeholder}
             value={value}/>
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
                selection.map(
                  item => <div key={item} className="dropdown__list-item">
                    {item}
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