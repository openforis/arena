import React from 'react'
import classNames from 'classnames'

import { iconComponents, IconName } from './iconComponents'

export type AppIconProps = {
  className?: string
  name: IconName
  /** Size in px; inline so it wins over the MUI button start/end icon size. */
  size?: number
  style?: React.CSSProperties
  title?: string
}

/**
 * Renders an icon by name (currently a Material icon, SVG); replaces the IcoMoon font icons (`<span className="icon icon-xxx" />`).
 */
export const AppIcon = (props: AppIconProps) => {
  const { className, name, size = 16, style, title } = props
  const Component = iconComponents[name]
  return (
    <Component
      aria-hidden={title ? undefined : true}
      className={classNames('app-icon', `app-icon--${name}`, className)}
      style={{ fontSize: size, verticalAlign: 'middle', ...style }}
      titleAccess={title}
    />
  )
}
