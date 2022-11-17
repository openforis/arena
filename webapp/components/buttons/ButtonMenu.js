import './ButtonMenu.scss'

import React, { useCallback, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import { elementOffset } from '@webapp/utils/domUtils'

import { Button } from './Button'

export const ButtonMenu = (props) => {
  const { buttonClassName, children, className, popupComponent, popupAlignment, ...otherProps } = props

  const wrapperRef = useRef(null)
  const buttonRef = useRef(null)
  const closeTimeoutRef = useRef(null)
  const [state, setState] = useState({ showPopup: false, popupTop: 0, popupLeft: 0, popupRight: 0 })
  const { showPopup, popupTop, popupLeft, popupRight } = state

  const toggleShowPopup = useCallback(() => {
    setState((statePrev) => {
      const showPopupNew = !statePrev.showPopup
      let popupTopNew = undefined
      let popupLeftNew = undefined
      let popupRightNew = undefined
      if (showPopupNew) {
        // align popup (with fixed position) to the trigger button
        const btnEl = buttonRef.current
        const btnOffset = elementOffset(btnEl)
        popupTopNew = btnOffset.y + btnOffset.height
        if (popupAlignment === 'left') {
          // align popup to button bottom left corner
          popupLeftNew = btnOffset.x
        } else if (popupAlignment === 'right') {
          // align popup to button bottom right corner
          popupRightNew = window.innerWidth - (btnOffset.x + btnOffset.width)
        }
      }
      return {
        ...statePrev,
        showPopup: showPopupNew,
        popupTop: popupTopNew,
        popupLeft: popupLeftNew,
        popupRight: popupRightNew,
      }
    })
  }, [buttonRef])

  const closePopup = useCallback(() => setState((statePrev) => ({ ...statePrev, showPopup: false })), [])

  const cancelPopupCloseTimeout = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current)
      closeTimeoutRef.current = null
    }
  }

  const startCloseTimeout = () => {
    cancelPopupCloseTimeout()
    closeTimeoutRef.current = setTimeout(closePopup, 500)
  }

  const onMouseLeave = useCallback(() => {
    if (showPopup) {
      startCloseTimeout()
    }
  }, [showPopup])

  const onMouseEnter = useCallback(() => {
    cancelPopupCloseTimeout()
  }, [])

  const onBlur = useCallback((event) => {
    const focusIsOnADescendant = wrapperRef.current?.contains(event.target)
    if (!focusIsOnADescendant) {
      closePopup()
    }
  }, [])

  return (
    <div
      ref={wrapperRef}
      className={classNames('button-menu__wrapper', className)}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onBlur={onBlur}
    >
      <Button
        {...otherProps}
        ref={buttonRef}
        className={classNames('button-menu__button', buttonClassName)}
        onClick={(event) => {
          event.preventDefault()
          event.stopPropagation()
          toggleShowPopup()
        }}
        onKeyDown={toggleShowPopup}
      >
        {children}
        {/* show small arrow down icon on the right */}
        <span className="icon icon-ctrl button-menu__button-icon" />
      </Button>

      {showPopup && (
        <div className="button-menu__popup-wrapper" style={{ top: popupTop, right: popupRight, left: popupLeft }}>
          {popupComponent}
        </div>
      )}
    </div>
  )
}

// onClick prop is not required in ButtonMenu
// eslint-disable-next-line no-unused-vars
const { onClick, ...otherButtonPropTypes } = Button.propTypes

ButtonMenu.propTypes = {
  ...otherButtonPropTypes,
  buttonClassName: PropTypes.string,
  popupComponent: PropTypes.element.isRequired,
  popupAlignment: PropTypes.oneOf(['left', 'right']),
}

ButtonMenu.defaultProps = {
  ...Button.defaultProps,
  buttonClassName: null,
  popupAlignment: 'left',
}
