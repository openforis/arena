import React, { useState } from 'react'

import AppSideBarModule from './appSideBarModule'
import AppSideBarPopupMenu from './appSideBarPopupMenu'

import * as SideBarModule from '../sidebarModule'

const AppSideBarModules = props => {

  const { surveyInfo, pathname, sideBarOpened } = props

  // popup menu module
  const [modulePopupMenu, setModulePopupMenu] = useState(null)

  return (
    <div className={`app-sidebar__modules${modulePopupMenu ? ' popup-menu-opened' : ''}`}>
      {
        SideBarModule.getModulesHierarchy().map(module => (
          <AppSideBarModule
            key={SideBarModule.getKey(module)}
            surveyInfo={surveyInfo}
            module={module}
            pathname={pathname}
            sideBarOpened={sideBarOpened}
            isOver={modulePopupMenu && SideBarModule.getKey(module) === SideBarModule.getKey(modulePopupMenu)}
            onMouseEnter={() => {
              setModulePopupMenu(module)
            }}
          />
        ))
      }

      {
        modulePopupMenu &&
        <AppSideBarPopupMenu
          module={modulePopupMenu}
          pathname={pathname}
          onClose={() => {
            setModulePopupMenu(null)
          }}
        />
      }

    </div>
  )
}

AppSideBarModules.defaultProps = {
  surveyInfo: null,
  pathname: '',
  sideBarOpened: false,
}

export default AppSideBarModules