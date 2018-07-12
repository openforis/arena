import React from 'react'

import { elementOffset } from '../app-utils/domUtils'

class Dropdown extends React.Component {

  constructor () {
    super()
    this.state = {opened: false}
  }

  toggleOpened () {
    this.setState({opened: !this.state.opened})
  }

  getOffset () {
    const {
      top,
      left,
      height,
      width
    } = elementOffset(this.refs.dropdown)

    return {
      top: (top + height),
      left,
      width
    }
  }

  render () {
    const {
      selection,
      placeholder,
      value,
      className
    } = this.props

    return <div className={`dropdown ${className}`} ref="dropdown">
      <input className="text-center"
             placeholder={placeholder}
             value={value}/>
      <span className="icon icon-menu2 icon-24px"
            onClick={() => this.toggleOpened()}></span>
      {
        this.state.opened
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