import './tooltip.scss'

import React, { createRef, useCallback, useEffect, useState } from 'react'
import ReactDom from 'react-dom'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import { elementOffset } from '@webapp/utils/domUtils'
import { Objects } from '@openforis/arena-core'

const messageLineHeight = 20
const messageComponentHeight = 35

const Tooltip = (props) => {
  const { children, className, id, insideTable, messages, messageComponent, position, showContent, testId, type } =
    props

  const [state, setState] = useState({ messageElement: null })
  const tooltipRef = createRef(null)

  const { messageElement } = state

  const messageElementClassName = `tooltip__message${type ? `-${type}` : ''} ${position}`

  const hidePopup = useCallback(() => {
    // setState({ messageElement: null })
  }, [])

  useEffect(() => {
    if (!showContent && messageElement) {
      hidePopup()
    }
  }, [hidePopup, messageElement, showContent])

  const calculateMessageElementHeight = useCallback(() => {
    return messages?.length * messageLineHeight || messageComponentHeight
  }, [messages])

  const getStyle = useCallback(() => {
    const elemOffset = tooltipRef.current && elementOffset(tooltipRef.current)
    if (!elemOffset) return {}
    const offsetTop = position === 'bottom' ? elemOffset.height : -elemOffset.height - calculateMessageElementHeight()
    const top = elemOffset.top + offsetTop
    return { top, left: elemOffset.left }
  }, [calculateMessageElementHeight, position, tooltipRef])

  const onMouseEnter = useCallback(() => {
    if (showContent) {
      const style = getStyle()
      const className = messageElementClassName

      if (messageComponent || !Objects.isEmpty(messages)) {
        setState({
          messageElement: (
            <div className={className} style={style}>
              {messageComponent || messages.map((msg, i) => <div key={i}>{msg}</div>)}
            </div>
          ),
        })
      }
    }
  }, [getStyle, messageComponent, messageElementClassName, messages, showContent])

  const onMouseLeave = useCallback(() => {
    hidePopup()
  }, [hidePopup])

  const onBlur = useCallback(() => {
    hidePopup()
  }, [hidePopup])

  const classSuffix = type ? `-${type}` : ''
  const mainClassName = `tooltip${classSuffix}`
  const tooltipClass = classNames(mainClassName, className, {
    howerable: showContent,
    'inside-table': insideTable,
  })

  return (
    <div
      className={tooltipClass}
      data-testid={testId || id}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      ref={tooltipRef}
      onBlur={onBlur}
    >
      {children}

      {messageElement && ReactDom.createPortal(messageElement, document.body)}
    </div>
  )
}

Tooltip.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  id: PropTypes.string,
  insideTable: PropTypes.bool,
  messages: PropTypes.array,
  messageComponent: PropTypes.node,
  position: PropTypes.oneOf(['bottom', 'top']),
  showContent: PropTypes.bool,
  showKeys: PropTypes.bool,
  testId: PropTypes.string,
  type: PropTypes.oneOf(['info', 'error', 'warning']),
  validation: PropTypes.object,
}

Tooltip.defaultProps = {
  className: null,
  id: null,
  messages: [],
  position: 'bottom',
  showContent: true, // Set to false to prevent showing tooltip on mouse over
}

export default Tooltip
