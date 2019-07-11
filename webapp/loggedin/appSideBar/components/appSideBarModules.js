import React, { useState, useRef } from 'react'

import AppSideBarModule from './appSideBarModule'
import AppSideBarPopupMenu from './appSideBarPopupMenu'

import { appModules, appModuleUri, dataModules, designerModules } from '../../appModules'

//==== Modules hierarchy
const getModule = (module, children = null, root = true) => ({
  key: module.key,
  uri: appModuleUri(module),
  icon: module.icon,
  root: root,
  elementRef: useRef(null),
  children: children
    ? children.map(childModule => getModule(childModule, null, false))
    : null
})

const getModulesHierarchy = () => [
  getModule(appModules.home),
  getModule(appModules.designer, [designerModules.formDesigner, designerModules.surveyHierarchy, designerModules.categories, designerModules.taxonomies]),
  getModule(appModules.data, [dataModules.records, dataModules.dataVis]),
]

const AppSideBarModules = props => {

  const { surveyInfo, pathname, sideBarOpened } = props

  // popup menu module
  const [modulePopupMenu, setModulePopupMenu] = useState(null)

  return (
    <div className={`app-sidebar__modules${modulePopupMenu ? ' popup-menu-opened' : ''}`}>
      {
        getModulesHierarchy().map(module => (
          <AppSideBarModule
            key={module.key}
            surveyInfo={surveyInfo}
            module={module}
            pathname={pathname}
            sideBarOpened={sideBarOpened}
            isOver={modulePopupMenu && module.key === modulePopupMenu.key}
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