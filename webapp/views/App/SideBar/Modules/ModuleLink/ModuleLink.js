import React from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import classNames from 'classnames'

import { useI18n } from '@webapp/store/system'
import { TestId } from '@webapp/utils/testId'

import * as SideBarModule from '../utils'

const ModuleLink = (props) => {
  const { disabled = false, module, pathname, showLabel = false } = props

  const key = SideBarModule.getKey(module)
  const active = SideBarModule.isActive(pathname)(module)
  const root = SideBarModule.isRoot(module)
  const external = SideBarModule.isExternal(module)

  const icon = SideBarModule.getIcon(module)
  const uri = SideBarModule.getUri(module)

  const className = classNames('sidebar__module-btn', 'text-uppercase', {
    'sidebar__module-child-btn': !root,
    active,
  })

  const i18n = useI18n()

  const testId = TestId.sidebar.moduleBtn(key)

  const linkContent = (
    <>
      {icon && <span className={`icon icon-${icon} icon-16px${showLabel ? ' icon-left-2x' : ''}`} />}
      {showLabel && <span>{i18n.t(`appModules.${key}`)}</span>}
    </>
  )

  if (external) {
    return (
      <a
        className={className}
        aria-disabled={disabled}
        data-testid={testId}
        href={uri}
        target={`openforis_arena_${key}`}
      >
        {linkContent}
      </a>
    )
  }
  return (
    <Link
      to={{ pathname: uri }}
      className={className}
      aria-disabled={disabled || active}
      data-testid={testId}
      id={`sidebar_btn_${key}`}
    >
      {linkContent}
    </Link>
  )
}

ModuleLink.propTypes = {
  module: PropTypes.object,
  pathname: PropTypes.string,
  showLabel: PropTypes.bool,
  disabled: PropTypes.bool,
}

export default ModuleLink
