import './tooltip.scss'

import React from 'react'
import * as R from 'ramda'

import { elementOffset } from '../appUtils/domUtils'

class Tooltip extends React.Component {

  constructor (props) {
    super(props)

    this.state = { style: {} }
    this.elementRef = React.createRef()
  }

  getStyle () {
    const elemOffset = this.elementRef.current && elementOffset(this.elementRef.current.parentElement)

    return elemOffset ? { top: elemOffset.top + elemOffset.height } : {}
  }

  mouseEnter () {
    const style = this.getStyle()
    if (!R.isEmpty(style)) this.setState({ style: this.getStyle() })
  }

  render () {
    const { children, messages = [], className, style, type = '' } = this.props
    const { style: msgStyle } = this.state

    const tooltipClass = `tooltip${type ? '-' + type : ''}` + (className ? ` ${className}` : '')

    return <div className={tooltipClass} style={style} onMouseEnter={() => this.mouseEnter()}>
      {children}

      {
        !R.isEmpty(messages) &&
        <div className="message" ref={this.elementRef} style={msgStyle}>
          {
            messages.map((msg, i) =>
              <div key={i}>{msg}</div>
            )
          }
        </div>
      }
    </div>
  }
}

Tooltip.defaultProps = {
  message: null,
}

export default Tooltip
