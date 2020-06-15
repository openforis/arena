import React, { useEffect, useRef } from 'react'
import ReactDOM from 'react-dom'

import { elementOffset } from '@webapp/utils/domUtils'

import * as SideBarModule from '../utils'

import SubModules from '../SubModules'

const PopupMenu = (props) => {
  const { module, pathname, onClose } = props
  const moduleElement = SideBarModule.getDomElement(module)
  const key = SideBarModule.getKey(module)

  // Used to check if mouse is within popup-menu or module link
  const inPopupMenu = useRef(false)
  const inModuleLink = useRef(true)

  // If after 200 ms mouse is neither within popup-menu or module link closes popup menu
  const closePopupMenuHandler = () =>
    setTimeout(() => {
      if (!(inPopupMenu.current || inModuleLink.current)) {
        onClose(null)
      }
    }, 200)

  // OnMount or module change, attach onmouseleave and onmousenter event listener on popupMenuElement and moduleElement
  useEffect(() => {
    inPopupMenu.current = false
    inModuleLink.current = true

    const onmouseenter = () => {
      inModuleLink.current = true
    }

    const onmouseleave = (event) => {
      // Check why mouseleave fires on inner elements
      if (event.target === moduleElement) {
        inModuleLink.current = false
        closePopupMenuHandler()
      }
    }

    moduleElement.addEventListener('mouseenter', onmouseenter, true)
    moduleElement.addEventListener('mouseleave', onmouseleave, true)

    return () => {
      moduleElement.removeEventListener('mouseenter', onmouseenter, true)
      moduleElement.removeEventListener('mouseleave', onmouseleave, true)
    }
  }, [key])

  return ReactDOM.createPortal(
    <div
      className="sidebar__popup-menu"
      style={{ top: elementOffset(moduleElement).top - 1 }}
      onMouseEnter={() => {
        inPopupMenu.current = true
      }}
      onMouseLeave={() => {
        inPopupMenu.current = false
        closePopupMenuHandler()
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
