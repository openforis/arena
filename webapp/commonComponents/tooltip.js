import './tooltip.scss'

import React from 'react'
import ReactDom from 'react-dom'
import * as R from 'ramda'

import { elementOffset } from '../utils/domUtils'

class Tooltip extends React.Component {

  constructor (props) {
    super(props)

    this.state = { messageElement: null }
    this.tooltipRef = React.createRef()
  }

  getStyle () {
    const elemOffset = this.tooltipRef.current && elementOffset(this.tooltipRef.current)

    return elemOffset ? { top: elemOffset.top + elemOffset.height, left: elemOffset.left } : {}
  }

  mouseEnter () {
    const { messages, type = '' } = this.props

    if (!(R.isEmpty(messages) || R.isNil(messages))) {

      const style = this.getStyle()
      const className = `tooltip__message${type ? '-' + type : ''}`

      this.setState({
        messageElement:
          <div className={className} style={style}>
            {
              messages.map((msg, i) =>
                <div key={i}>{msg}</div>
              )
            }
          </div>
      })

    }
  }

  mouseLeave () {
    this.setState({ messageElement: null })
  }

  render () {
    const { children, className, type = '' } = this.props
    const { messageElement } = this.state

    const tooltipClass = `tooltip${type ? '-' + type : ''}` + (className ? ` ${className}` : '')

    return (
      <div className={tooltipClass}
           onMouseEnter={() => this.mouseEnter()}
           onMouseLeave={() => this.mouseLeave()}
           ref={this.tooltipRef}
           onBlur={() => this.setState({ messageElement: null })}>

        {children}

        {
          messageElement && ReactDom.createPortal(
            messageElement,
            document.body
          )
        }

      </div>
    )
  }
}

Tooltip.defaultProps = {
  messages: [],
  className: null,
  type: null,
}

export default Tooltip
