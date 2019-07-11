import React from 'react'
import * as R from 'ramda'

import AppSideBarModuleLink from './appSideBarModuleLink'

import { appModules, appModuleUri, homeModules } from '../../appModules'
import AppSideBarSubModules from './appSideBarSubModules'

const AppSideBarModule = props => {
  const { surveyInfo, module, pathname, sideBarOpened, isOver, onMouseEnter } = props

  const isModuleHome = module.key === appModules.home.key

  // module home is active when page is on dashboard
  const active = isModuleHome
    ? pathname === appModuleUri(homeModules.dashboard)
    : R.startsWith(module.uri, pathname)

  const disabledRequiredSurvey = !isModuleHome && (R.isEmpty(surveyInfo) || R.isNil(surveyInfo))
  // module home is disabled when page is on dashboard, other modules are disabled when there's no active survey
  const disabledModule = isModuleHome ? active : disabledRequiredSurvey
  // link to home is disabled when page is on dashboard, other root module links are always disabled
  const disabledModuleLink = isModuleHome ? active : true

  return (
    <div className={`app-sidebar__module${active ? ' active' : ''}${isOver ? ' over' : ''}`}
         ref={module.elementRef}
         onMouseEnter={
           isModuleHome || sideBarOpened
             ? null
             : () => {
               onMouseEnter(module)
             }
         }
         aria-disabled={disabledModule}>

      <AppSideBarModuleLink
        module={module}
        pathname={pathname}
        showLabel={sideBarOpened}
        disabled={disabledModuleLink || disabledRequiredSurvey}
      />

      {
        sideBarOpened &&
        <AppSideBarSubModules
          module={module}
          pathname={pathname}
          sideBarOpened={sideBarOpened}
          disabled={disabledRequiredSurvey}
        />
      }

    </div>
  )
}

AppSideBarModule.defaultProps = {
  surveyInfo: null,
  module: null,
  pathname: '',
  sideBarOpened: false,
  isOver: false,
  onMouseEnter: null,
}

export default AppSideBarModule