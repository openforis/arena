import React from 'react'
import { Link } from 'react-router-dom'

import { useI18n } from '@webapp/commonComponents/hooks'

import * as SideBarModule from '../sidebarModule'

const AppSideBarModuleLink = props => {
  const { module, pathname, showLabel, disabled } = props

  const active = SideBarModule.isActive(pathname)(module)
  const root = SideBarModule.isRoot(module)
  const icon = SideBarModule.getIcon(module)
  const uri = SideBarModule.getUri(module)
  const key = SideBarModule.getKey(module)

  const i18n = useI18n()

  let className = 'app-sidebar__module-btn text-uppercase'
  className += root ? '' : ' app-sidebar__module-child-btn'
  className += active ? ' active' : ''

  return (
    <Link
      to={uri}
      className={className}
      aria-disabled={disabled || active}>
      {
        icon &&
        <span className={`icon icon-${icon} icon-16px${showLabel ? ' icon-left-2x' : ''}`}></span>
      }
      {
        showLabel &&
        <span>{i18n.t(`appModules.${key}`)}</span>
      }
    </Link>
  )

}

AppSideBarModuleLink.defaultProps = {
  module: null,
  pathname: '',
  showLabel: false,
  disabled: false,
}

export default AppSideBarModuleLink