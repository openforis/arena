import React, { useEffect, useRef } from 'react'
import ReactDOM from 'react-dom'

import { elementOffset } from '@webapp/utils/domUtils'

import SubModules from '../SubModules'
import * as SideBarModule from '../utils'

const PopupMenu = (props) => {
  const { module, moduleElement, pathname, onClose, overSidebar } = props

  const key = SideBarModule.getKey(module)

  // Used to check if mouse is over popup-menu
  const overPopupRef = useRef(false)
  // Used to avoid multiple calls to onClose
  const closeTimeoutRef = useRef(null)

  const clearCloseTimeout = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current)
      closeTimeoutRef.current = null
    }
  }

  // If after 200 ms mouse is neither within popup-menu or module link closes popup menu
  const closePopup = () => {
    if (closeTimeoutRef.current) {
      // popup will be closed soon
      return
    }
    closeTimeoutRef.current = setTimeout(() => {
      closeTimeoutRef.current = null
      if (!overSidebar) {
        onClose()
      }
    }, 200)
  }

  // OnMount or module change, reset internal state variables
  useEffect(() => {
    // prevent popup close
    clearCloseTimeout()
    // reset internal variables
    overPopupRef.current = false
  }, [key])

  // close popup when module link is clicked (and path changes)
  useEffect(() => {
    if (overPopupRef.current) {
      onClose()
    }
  }, [pathname])

  // if mouse is outside of the sidebar or the popup menu, close the popup, otherwise
  // clear the close timeout (if any)
  useEffect(() => {
    if (overSidebar) {
      clearCloseTimeout()
    } else {
      closePopup()
    }
  }, [overSidebar])

  return ReactDOM.createPortal(
    <div
      className="sidebar__popup-menu"
      style={{ top: elementOffset(moduleElement).top - 1 }}
      onMouseEnter={() => {
        overPopupRef.current = true
      }}
      onMouseLeave={() => {
        overPopupRef.current = false
      }}
    >
      <SubModules module={module} pathname={pathname} sideBarOpened disabled={false} />
    </div>,
    document.body
  )
}

PopupMenu.defaultProps = {
  module: null,
  pathname: '',
  onClose: null,
  overSidebar: true,
}

export default PopupMenu
