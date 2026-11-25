import classNames from 'classnames'
import { Link } from 'react-router'

import { useI18n } from '@webapp/store/system'
import { TestId } from '@webapp/utils/testId'
import * as SideBarModule from '../utils'

type ModuleLinkProps = {
  module?: Record<string, any>
  pathname?: string
  showLabel?: boolean
  disabled?: boolean
}

const ModuleLink = (props: ModuleLinkProps) => {
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

export default ModuleLink
