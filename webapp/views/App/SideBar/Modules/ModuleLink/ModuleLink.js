import React from 'react'
import PropTypes from 'prop-types'

import { Link } from 'react-router-dom'

import { useI18n } from '@webapp/store/system'

import * as SideBarModule from '../utils'

const getClassName = ({ root, active }) => {
  let className = 'sidebar__module-btn text-uppercase'
  className += root ? '' : ' sidebar__module-child-btn'
  className += active ? ' active' : ''
  return className
}

const ModuleLink = (props) => {
  const { module, pathname, showLabel, disabled } = props

  const active = SideBarModule.isActive(pathname)(module)
  const root = SideBarModule.isRoot(module)
  const icon = SideBarModule.getIcon(module)
  const uri = SideBarModule.getUri(module)
  const key = SideBarModule.getKey(module)

  const i18n = useI18n()

  const className = getClassName({ root, active })

  return (
    <Link to={uri} className={className} aria-disabled={disabled || active} id={`sidebar_btn_${key}`}>
      {icon && <span className={`icon icon-${icon} icon-16px${showLabel ? ' icon-left-2x' : ''}`} />}
      {showLabel && <span>{i18n.t(`appModules.${key}`)}</span>}
    </Link>
  )
}

ModuleLink.propTypes = {
  module: PropTypes.object,
  pathname: PropTypes.string,
  showLabel: PropTypes.bool,
  disabled: PropTypes.bool,
}

ModuleLink.defaultProps = {
  module: null,
  pathname: '',
  showLabel: false,
  disabled: false,
}

export default ModuleLink
