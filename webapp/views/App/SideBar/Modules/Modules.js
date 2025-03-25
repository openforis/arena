import React, { useCallback, useRef, useState } from 'react'
import PropTypes from 'prop-types'

import * as SideBarModule from './utils'

import Module from './Module'
import PopupMenu from './PopupMenu'

const Modules = (props) => {
  const { pathname = '', sideBarOpened = false, surveyInfo = null, user = null } = props

  const [overSidebar, setOverSidebar] = useState(false)
  const moduleElementsByKeyRef = useRef({})

  // Popup menu module
  const [modulePopupMenu, setModulePopupMenu] = useState(null)

  const modulesHierarchy = SideBarModule.getModulesHierarchy(user, surveyInfo).filter(
    (module) => !SideBarModule.isHidden(module)
  )

  const setModuleElementRef = ({ key, ref }) => {
    moduleElementsByKeyRef.current[key] = ref
  }

  const onMouseEnter = useCallback(() => {
    if (!sideBarOpened) {
      setOverSidebar(true)
    }
  }, [sideBarOpened])

  const onMouseLeave = useCallback(() => {
    if (!sideBarOpened) {
      setOverSidebar(false)
    }
  }, [sideBarOpened])

  const moduleElement = modulePopupMenu ? moduleElementsByKeyRef.current[SideBarModule.getKey(modulePopupMenu)] : null

  return (
    <div
      className={`sidebar__modules${modulePopupMenu ? ' popup-menu-opened' : ''}`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {modulesHierarchy.map((module) => {
        const key = SideBarModule.getKey(module)
        return (
          <Module
            key={key}
            surveyInfo={surveyInfo}
            module={module}
            pathname={pathname}
            sideBarOpened={sideBarOpened}
            isOver={modulePopupMenu && key === SideBarModule.getKey(modulePopupMenu)}
            onMouseEnter={() => {
              setModulePopupMenu(module)
            }}
            ref={(ref) => setModuleElementRef({ key, ref })}
          />
        )
      })}

      {modulePopupMenu && (
        <PopupMenu
          module={modulePopupMenu}
          moduleElement={moduleElement}
          pathname={pathname}
          overSidebar={overSidebar}
          onClose={() => {
            setModulePopupMenu(null)
          }}
        />
      )}
    </div>
  )
}

Modules.propTypes = {
  user: PropTypes.object,
  surveyInfo: PropTypes.object,
  pathname: PropTypes.string,
  sideBarOpened: PropTypes.bool,
}

export default Modules
