import React from 'react'

import * as SideBarModule from '../utils'

import ModuleLink from '../ModuleLink'

const SubModules = (props) => {
  const { disabled = false, module, pathname, sideBarOpened = false } = props
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

export default SubModules
