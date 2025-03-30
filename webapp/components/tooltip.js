import './tooltip.scss'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import ReactDom from 'react-dom'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import { Objects } from '@openforis/arena-core'

import { elementOffset } from '@webapp/utils/domUtils'

const messageLineHeight = 20
const messageComponentHeight = 35

const Tooltip = (props) => {
  const {
    children,
    className = null,
    id = null,
    insideTable,
    messageComponent,
    messages = [],
    position = 'bottom',
    showContent = true, // Set to false to prevent showing tooltip on mouse over
    testId,
    type,
  } = props

  const [state, setState] = useState({ messageElement: null })
  const containerRef = useRef(null)

  const { messageElement } = state

  const typeClassNameSuffix = type ? `-${type}` : ''

  const messageElementClassName = `tooltip__message${typeClassNameSuffix} ${position}`

  const hidePopup = useCallback(() => setState({ messageElement: null }), [])

  useEffect(() => {
    if (!showContent && messageElement) {
      hidePopup()
    }
  }, [hidePopup, messageElement, showContent])

  const calculateMessageElementHeight = useCallback(() => {
    return messages?.length * messageLineHeight || messageComponentHeight
  }, [messages])

  const getStyle = useCallback(() => {
    const elemOffset = containerRef.current && elementOffset(containerRef.current)
    if (!elemOffset) return {}
    const offsetTop = position === 'bottom' ? elemOffset.height : -elemOffset.height - calculateMessageElementHeight()
    const top = elemOffset.top + offsetTop
    return { top, left: elemOffset.left }
  }, [calculateMessageElementHeight, position, containerRef])

  const onMouseEnter = useCallback(
    (event) => {
      if (!showContent || !containerRef?.current?.contains?.(event.target)) {
        if (messageElement) {
          hidePopup()
        }
        return
      }

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
    },
    [getStyle, hidePopup, messageComponent, messageElement, messageElementClassName, messages, showContent]
  )

  const mainClassName = `tooltip${typeClassNameSuffix}`
  const tooltipClass = classNames(mainClassName, className, {
    howerable: showContent,
    'inside-table': insideTable,
  })

  return (
    <div
      className={tooltipClass}
      data-testid={testId || id}
      onMouseEnter={onMouseEnter}
      onMouseLeave={hidePopup}
      ref={containerRef}
      onBlur={hidePopup}
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
  testId: PropTypes.string,
  type: PropTypes.oneOf(['info', 'error', 'warning']),
}

export default Tooltip
