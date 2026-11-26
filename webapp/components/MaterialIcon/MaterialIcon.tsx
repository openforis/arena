import React from 'react'
import classNames from 'classnames'

import { iconComponents, IconName } from './iconComponents'

export type MaterialIconProps = {
  className?: string
  name: IconName
  /** Size in px; inline so it wins over the MUI button start/end icon size. */
  size?: number
  style?: React.CSSProperties
  title?: string
}

/**
 * Renders a Material icon (SVG) by name; replaces the IcoMoon font icons (`<span className="icon icon-xxx" />`).
 */
export const MaterialIcon = (props: MaterialIconProps) => {
  const { className, name, size = 16, style, title } = props
  const Component = iconComponents[name]
  return (
    <Component
      aria-hidden={title ? undefined : true}
      className={classNames('material-icon', `material-icon--${name}`, className)}
      style={{ fontSize: size, ...style }}
      titleAccess={title}
    />
  )
}
