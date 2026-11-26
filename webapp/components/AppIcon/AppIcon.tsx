import './AppIcon.scss'

import { SvgIconProps } from '@mui/material'
import classNames from 'classnames'

import { iconComponents, IconName } from './iconComponents'

export type AppIconProps = Omit<SvgIconProps, 'fontSize' | 'titleAccess'> & {
  name: IconName
  /** Size in px; inline so it wins over the MUI button start/end icon size. */
  size?: number
  title?: string
}

/**
 * Renders an icon by name (currently a Material icon, SVG).
 */
export const AppIcon = (props: AppIconProps) => {
  const { className, name, size = 16, style, title, ...otherProps } = props
  const Component = iconComponents[name]
  return (
    <Component
      aria-hidden={title ? undefined : true}
      {...otherProps}
      className={classNames('app-icon', `app-icon--${name}`, className)}
      style={{ fontSize: size, verticalAlign: 'middle', ...style }}
      titleAccess={title}
    />
  )
}
