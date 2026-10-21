import React, { useCallback, useState } from 'react'
import PropTypes from 'prop-types'

import * as SideBarModule from './utils'

import Module from './Module'
import PopupMenu from './PopupMenu'

const Modules = (props) => {
  const { pathname = '', sideBarOpened = false, surveyInfo = null, surveyIsDirty = false, user = null } = props

  const [overSidebar, setOverSidebar] = useState(false)

  // Popup menu module and the element it is anchored to
  const [popupMenu, setPopupMenu] = useState(null)
  const modulePopupMenu = popupMenu?.module ?? null

  const modulesHierarchy = SideBarModule.getModulesHierarchy(user, surveyInfo).filter(
    (module) => !SideBarModule.isHidden(module)
  )

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
            disabled={surveyIsDirty}
            surveyInfo={surveyInfo}
            module={module}
            pathname={pathname}
            sideBarOpened={sideBarOpened}
            isOver={modulePopupMenu && key === SideBarModule.getKey(modulePopupMenu)}
            onMouseEnter={(event) => {
              // modules without submenu (e.g. Home, Dashboard) close the popup menu of other modules
              const hasPopupMenu = !SideBarModule.isHome(module) && SideBarModule.getChildren(module).length > 0
              setPopupMenu(hasPopupMenu ? { module, element: event.currentTarget } : null)
            }}
          />
        )
      })}

      {modulePopupMenu && (
        <PopupMenu
          module={modulePopupMenu}
          moduleElement={popupMenu.element}
          pathname={pathname}
          overSidebar={overSidebar}
          onClose={() => {
            setPopupMenu(null)
          }}
        />
      )}
    </div>
  )
}

Modules.propTypes = {
  user: PropTypes.object,
  surveyInfo: PropTypes.object,
  surveyIsDirty: PropTypes.bool,
  pathname: PropTypes.string,
  sideBarOpened: PropTypes.bool,
}

export default Modules
