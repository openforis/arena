import React, { useState, useRef, useEffect } from 'react'
import ReactDOM from 'react-dom'

import AppSideBarModule from './appSideBarModule'
import AppSideBarSubModules from './appSideBarSubModules'

import { appModules, appModuleUri, dataModules, designerModules } from '../../appModules'
import { elementOffset } from '../../../utils/domUtils'

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

  // popup menu
  const [modulePopupMenu, setModulePopupMenu] = useState(null)

  const inPopupMenu = useRef(false)
  const inModuleLink = useRef(false)

  const closePopupMenuHandler = () => setTimeout(() => {
    if (!(inPopupMenu.current || inModuleLink.current))
      setModulePopupMenu(null)
  }, 500)

  useEffect(() => {
    if (modulePopupMenu) {
      modulePopupMenu.elementRef.current.onmouseleave = (e) => {
        inModuleLink.current = false
        closePopupMenuHandler()
      }
    }
  }, [modulePopupMenu])

  return (
    <div className={`app-sidebar__modules${modulePopupMenu ? ' menu-opened' : ''}`}>
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
              inModuleLink.current = true
              setModulePopupMenu(module)
            }}
          />
        ))
      }

      {
        modulePopupMenu &&
        ReactDOM.createPortal(
          <div
            className="app-sidebar__popup-menu"
            style={{ top: elementOffset(modulePopupMenu.elementRef.current).top - 1, }}
            onMouseEnter={() => {inPopupMenu.current = true}}
            onMouseLeave={() => {
              inPopupMenu.current = false
              closePopupMenuHandler()
            }}>
            <AppSideBarSubModules
              module={modulePopupMenu}
              pathname={pathname}
              sideBarOpened={true}
              disabled={false}
            />
          </div>,
          document.body
        )
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