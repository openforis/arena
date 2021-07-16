import React, { useEffect, useRef } from 'react'
import ReactDOM from 'react-dom'

import { elementOffset, isMouseEventOverElement } from '@webapp/utils/domUtils'

import * as SideBarModule from '../utils'

import SubModules from '../SubModules'
import { useGlobalOnMouseMove } from '@webapp/components/hooks/useGlobalOnMouseMove'

const PopupMenu = (props) => {
  const { module, pathname, onClose } = props

  const key = SideBarModule.getKey(module)
  const moduleElement = SideBarModule.getDomElement(module)

  // Used to check if mouse is over popup-menu
  const overPopupRef = useRef(false)
  // Used to check if mouse is over sidebar
  const overSidebarRef = useRef(true)
  // Used to avoid multiple calls to onClose
  const closeTimeoutRef = useRef(null)

  const canClosePopup = () => !(overPopupRef.current || overSidebarRef.current)

  const clearCloseTimeout = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current)
      closeTimeoutRef.current = null
    }
  }

  // If after 200 ms mouse is neither within popup-menu or module link closes popup menu
  const closePopupMenu = () => {
    if (closeTimeoutRef.current) {
      // popup will be closed soon
      return
    }
    closeTimeoutRef.current = setTimeout(() => {
      closeTimeoutRef.current = null
      if (canClosePopup()) {
        onClose(null)
      }
    }, 200)
  }

  // when popup is open (mounted), check if mouse is moved outside module link element or popup menu: in that case, close the popup
  useGlobalOnMouseMove({
    callback: (event) => {
      overSidebarRef.current = isMouseEventOverElement({ event, el: moduleElement.parentElement })

      if (canClosePopup()) {
        closePopupMenu()
      } else {
        clearCloseTimeout()
      }
    },
  })

  // OnMount or module change, reset internal state variables
  useEffect(() => {
    overPopupRef.current = false
    overSidebarRef.current = true
  }, [key])

  return ReactDOM.createPortal(
    <div
      className="sidebar__popup-menu"
      style={{ top: elementOffset(moduleElement).top - 1 }}
      onMouseEnter={() => {
        overPopupRef.current = true
      }}
      onMouseLeave={() => {
        overPopupRef.current = false
        closePopupMenu()
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
}

export default PopupMenu
