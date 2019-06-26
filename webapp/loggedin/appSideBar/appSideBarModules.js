import React from 'react'
import { Link } from 'react-router-dom'
import * as R from 'ramda'

import { appModuleUri, appModules, designerModules, dataModules } from '../appModules'

//==== Modules hierarchy for appSidebar
const getModule = (module, children = null) => ({
  key: module.key,
  uri: appModuleUri(module),
  icon: module.icon,
  children: children
    ? children.map(childModule => getModule(childModule))
    : null
})

export const modulesHierarchy = [
  getModule(appModules.home),
  getModule(appModules.designer, [designerModules.formDesigner, designerModules.surveyHierarchy, designerModules.categories, designerModules.taxonomies]),
  getModule(appModules.data, [dataModules.records, dataModules.dataVis]),
]

const ModuleLink = ({ module, showLabel, disabled, className = '' }) => (
  <Link
    className={`app-sidebar__module-btn text-uppercase ${className}`}
    to={module.uri}
    aria-disabled={disabled}>
    {
      module.icon &&
      <span className={`icon icon-${module.icon} icon-16px${showLabel ? ' icon-left-2x' : ''}`}></span>
    }
    {
      showLabel &&
      <span>{module.key}</span>
    }

  </Link>
)

const AppSideBarModule = (props) => {
  const { pathname, module, surveyInfo, sideBarOpened = false } = props

  const active = R.startsWith(module.uri, pathname)
  const isModuleHome = module.key === appModules.home.key

  const requireSurvey = !isModuleHome
  const disabled = requireSurvey && (R.isEmpty(surveyInfo) || R.isNil(surveyInfo))

  return (
    <div className={`app-sidebar__module${active ? ' active' : ''}`}>

      <ModuleLink
        module={module}
        disabled={disabled}
        showLabel={sideBarOpened}
      />

      {
        sideBarOpened && module.children && module.children.map(childModule => (
          <ModuleLink
            key={childModule.key}
            module={childModule}
            disabled={disabled}
            showLabel={sideBarOpened}
            className="app-sidebar__module-child-btn"
          />
        ))
      }

    </div>
  )
}

const AppSideBarModules = ({ pathname, surveyInfo, sideBarOpened }) => (
  <div className="app-sidebar__modules">
    {
      modulesHierarchy.map((module, i) => (
        <React.Fragment>
          <AppSideBarModule
            key={module.key}
            module={module}
            pathname={pathname}
            surveyInfo={surveyInfo}
            sideBarOpened={sideBarOpened}
          />

          {
            i !== modulesHierarchy.length - 1 &&
            <div className="separator-of"></div>
          }

        </React.Fragment>
      ))
    }

  </div>
)

export default AppSideBarModules