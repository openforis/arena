import React from 'react'

import * as SideBarModule from '../utils'

import ModuleLink from '../ModuleLink'

const SubModules = (props) => {
  const { module, pathname, sideBarOpened, disabled } = props
  const children = SideBarModule.getChildren(module)

  return children.map((childModule) => (
    <ModuleLink
      key={childModule.key}
      module={childModule}
      pathname={pathname}
      showLabel={sideBarOpened}
      disabled={disabled}
    />
  ))
}

SubModules.defaultProps = {
  module: null,
  pathname: '',
  sideBarOpened: false,
  disabled: false,
}

export default SubModules
