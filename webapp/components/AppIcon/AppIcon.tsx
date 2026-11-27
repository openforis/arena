import './AppIcon.scss'

import { SvgIconProps } from '@mui/material'
import classNames from 'classnames'

import { iconComponents, IconName } from './iconComponents'

// Material glyphs have ~2px of padding in their 24px box: scaled up, an icon of size N looks as big as text of size N
const visualScale = 1.15

export type AppIconProps = Omit<SvgIconProps, 'fontSize' | 'titleAccess'> & {
  name: IconName
  /** Size in px, as the text next to it; inline so it wins over the MUI button start/end icon size. */
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
      style={{ fontSize: Math.round(size * visualScale), verticalAlign: 'middle', ...style }}
      titleAccess={title}
    />
  )
}
