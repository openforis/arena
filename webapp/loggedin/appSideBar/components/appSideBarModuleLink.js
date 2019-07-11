import React from 'react'
import { Link } from 'react-router-dom'

import useI18n from '../../../commonComponents/useI18n'

const AppSideBarModuleLink = props => {
  const { module, pathname, showLabel, disabled } = props

  const i18n = useI18n()
  const active = module.uri === pathname

  let className = 'app-sidebar__module-btn text-uppercase'
  className += module.root ? '' : ' app-sidebar__module-child-btn'
  className += active ? ' active' : ''

  return (
    <Link
      to={module.uri}
      className={className}
      aria-disabled={disabled || active}>
      {
        module.icon &&
        <span className={`icon icon-${module.icon} icon-16px${showLabel ? ' icon-left-2x' : ''}`}></span>
      }
      {
        showLabel &&
        <span>{i18n.t(`appModules.${module.key}`)}</span>
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