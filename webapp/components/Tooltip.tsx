import './Tooltip.scss'

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import ReactDom from 'react-dom'
import classNames from 'classnames'

import { Objects } from '@openforis/arena-core'

import { elementOffset } from '@webapp/utils/domUtils'

const messageLineHeight = 20
const messageComponentHeight = 35

const determineElementIsInsideModal = (element) => {
  let el = element
  while (el) {
    if (el.classList?.contains('modal')) {
      return true
    }
    el = el.parentElement
  }
  return false
}

type TooltipProps = {
  children: ReactNode
  className?: string
  id?: string
  insideTable?: boolean
  messages?: any[]
  messageComponent?: ReactNode
  position?: 'bottom' | 'top'
  showContent?: boolean
  testId?: string
  type?: 'info' | 'error' | 'warning'
}

const Tooltip = (props: TooltipProps) => {
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

  const [state, setState] = useState({ isInsideModal: false, messageElement: null })
  const containerRef = useRef(null)

  useEffect(() => {
    const container = containerRef.current
    if (container) {
      setState((statePrev) => ({ ...statePrev, isInsideModal: determineElementIsInsideModal(container) }))
    }
  }, [])

  const { isInsideModal, messageElement } = state

  const typeClassNameSuffix = type ? `-${type}` : ''

  const messageElementClassName = useMemo(
    () => `tooltip__message${typeClassNameSuffix} ${position} ${isInsideModal ? 'inside-modal' : ''}`,
    [typeClassNameSuffix, position, isInsideModal]
  )

  const hidePopup = useCallback(() => {
    setState((statePrev) => ({ ...statePrev, messageElement: null }))
  }, [])

  useEffect(() => {
    if (!showContent && messageElement) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
      if (messageComponent || !Objects.isEmpty(messages)) {
        const style = getStyle()
        setState((statePrev) => ({
          ...statePrev,
          messageElement: (
            <div className={messageElementClassName} style={style}>
              {messageComponent || messages.map((msg) => <div key={msg}>{msg}</div>)}
            </div>
          ),
        }))
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

export default Tooltip
