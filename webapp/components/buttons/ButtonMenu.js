import './ButtonMenu.scss'

import React, { useCallback, useRef, useState } from 'react'
import PropTypes from 'prop-types'

import { Button } from './Button'

export const ButtonMenu = (props) => {
  const { children, popupComponent, popupAlignment, ...otherProps } = props

  const wrapperRef = useRef(null)
  const closeTimeoutRef = useRef(null)
  const [showPopup, setShowPopup] = useState(false)
  const toggleShowPopup = useCallback(() => setShowPopup((showPopupPrev) => !showPopupPrev), [])
  const closePopup = useCallback(() => setShowPopup(false), [])

  const cancelCloseTimeout = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current)
      closeTimeoutRef.current = null
    }
  }

  const startCloseTimeout = () => {
    cancelCloseTimeout()
    closeTimeoutRef.current = setTimeout(closePopup, 500)
  }

  const onMouseLeave = useCallback(() => {
    startCloseTimeout()
  }, [])

  const onMouseEnter = useCallback(() => {
    cancelCloseTimeout()
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
      className="button-menu__wrapper"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onBlur={onBlur}
    >
      <Button
        {...otherProps}
        onClick={(event) => {
          event.preventDefault()
          event.stopPropagation()
          toggleShowPopup()
        }}
        onKeyDown={toggleShowPopup}
      >
        {children}
      </Button>

      {showPopup && <div className={`button-menu__popup-wrapper align-${popupAlignment}`}>{popupComponent}</div>}
    </div>
  )
}

// onClick prop is not required in ButtonMenu
const { onClick, ...otherButtonPropTypes } = Button.propTypes

ButtonMenu.propTypes = {
  ...otherButtonPropTypes,
  popupComponent: PropTypes.element.isRequired,
  popupAlignment: PropTypes.oneOf(['left', 'right']),
}

ButtonMenu.defaultProps = {
  ...Button.defaultProps,
}
