import React from 'react'

import * as SideBarModule from '../sidebarModule'
import AppSideBarModuleLink from './appSideBarModuleLink'

const AppSideBarSubModules = props => {
  const {module, pathname, sideBarOpened, disabled} = props
  const children = SideBarModule.getChildren(module)

  return children.map(childModule => (
    <AppSideBarModuleLink
      key={childModule.key}
      module={childModule}
      pathname={pathname}
      showLabel={sideBarOpened}
      disabled={disabled}
    />
  ))
}

AppSideBarSubModules.defaultProps = {
  module: null,
  pathname: '',
  sideBarOpened: false,
  disabled: false,
}

export default AppSideBarSubModules
