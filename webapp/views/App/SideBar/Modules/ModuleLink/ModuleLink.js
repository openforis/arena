import React from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import classNames from 'classnames'

import { useI18n } from '@webapp/store/system'
import { DataTestId } from '@webapp/utils/dataTestId'

import * as SideBarModule from '../utils'

const ModuleLink = (props) => {
  const { module, pathname, showLabel, disabled } = props

  const active = SideBarModule.isActive(pathname)(module)
  const root = SideBarModule.isRoot(module)
  const icon = SideBarModule.getIcon(module)
  const uri = SideBarModule.getUri(module)
  const key = SideBarModule.getKey(module)
  const outside = SideBarModule.isOutside(module)

  const i18n = useI18n()

  const className = classNames('sidebar__module-btn', 'text-uppercase', {
    'sidebar__module-child-btn': !root,
    active,
  })

  if (outside) {
    // opens the uri into a new tab
    return (
      <a
        href={uri}
        target={`openforis_arena_${key}`}
        className={className}
        aria-disabled={disabled || active}
        data-testid={DataTestId.sidebar.moduleBtn(key)}
      >
        {icon && <span className={`icon icon-${icon} icon-16px${showLabel ? ' icon-left-2x' : ''}`} />}
        {showLabel && <span>{i18n.t(`appModules.${key}`)}</span>}
      </a>
    )
  }

  // internal (relative) link
  return (
    <Link
      to={uri}
      className={className}
      aria-disabled={disabled || active}
      data-testid={DataTestId.sidebar.moduleBtn(key)}
      id={`sidebar_btn_${key}`}
    >
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
