import './tooltip.scss'

import React from 'react'
import ReactDom from 'react-dom'
import * as R from 'ramda'

import { elementOffset } from '@webapp/utils/domUtils'

class Tooltip extends React.Component {
  constructor(props) {
    super(props)

    this.state = { messageElement: null, componentElement: null }
    this.tooltipRef = React.createRef()

    this.mouseEnter = this.mouseEnter.bind(this)
    this.mouseLeave = this.mouseLeave.bind(this)
  }

  getStyle() {
    const elemOffset = this.tooltipRef.current && elementOffset(this.tooltipRef.current)

    return elemOffset ? { top: elemOffset.top + elemOffset.height, left: elemOffset.left } : {}
  }

  mouseEnter() {
    const { messages, messageComponent, showContent, type } = this.props

    if (showContent) {
      const style = this.getStyle()
      const className = `tooltip__message${type ? `-${type}` : ''}`

      if (messageComponent || !(R.isEmpty(messages) || R.isNil(messages))) {
        this.setState({
          messageElement: (
            <div className={className} style={style}>
              {messageComponent || messages.map((msg, i) => <div key={i}>{msg}</div>)}
            </div>
          ),
          componentElement: null,
        })
      }
    }
  }

  mouseLeave() {
    this.setState({ messageElement: null, componentElement: null })
  }

  render() {
    const { children, className, id, type, showContent, insideTable } = this.props
    const { messageElement, componentElement } = this.state

    const tooltipClass = `tooltip${type ? `-${type}` : ''}${className ? ` ${className}` : ''}${
      showContent ? ' hoverable' : ''
    } ${insideTable ? 'inside-table' : ''}`

    return (
      <div
        className={tooltipClass}
        data-testid={id}
        onMouseEnter={this.mouseEnter}
        onMouseLeave={this.mouseLeave}
        ref={this.tooltipRef}
        onBlur={() => this.setState({ messageElement: null })}
      >
        {children}

        {messageElement && ReactDom.createPortal(messageElement, document.body)}
        {componentElement && ReactDom.createPortal(componentElement, document.body)}
      </div>
    )
  }
}

Tooltip.defaultProps = {
  className: null,
  id: null,
  messages: [], // Array of messages
  messageComponent: null, // React message component
  type: null, // Tooltip type (error or warning)
  showContent: true, // Set to false not to show the tooltip on mouse over
}

export default Tooltip
