import React from 'react'
import * as R from 'ramda'

import AppSideBarModuleLink from './appSideBarModuleLink'
import AppSideBarSubModules from './appSideBarSubModules'

import * as SideBarModule from '../sidebarModule'

const AppSideBarModule = props => {
  const { surveyInfo, module, pathname, sideBarOpened, isOver, onMouseEnter } = props

  const elementRef: any = SideBarModule.getElementRef(module)
  const isModuleHome = SideBarModule.isHome(module)

  const active = SideBarModule.isActive(pathname)(module)
  // all modules except home require the survey
  const disabledRequiredSurvey = !isModuleHome && (R.isEmpty(surveyInfo) || R.isNil(surveyInfo))
  // module home is disabled when page is on dashboard, other modules are disabled when there's no active survey
  const disabledModule = isModuleHome ? active : disabledRequiredSurvey
  // link to home is disabled when page is on dashboard, other root module links are always disabled
  const disabledModuleLink = isModuleHome ? active : true

  return (
    <div className={`app-sidebar__module${active ? ' active' : ''}${isOver ? ' over' : ''}`}
         ref={elementRef}
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
        // @ts-ignore TODO
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
