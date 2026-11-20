import './ButtonIconExpandToggle.scss'

import ExpandMore from '@mui/icons-material/ExpandMore'
import classNames from 'classnames'

import { Button, ButtonProps } from './Button'

type Props = Omit<ButtonProps, 'icon' | 'iconClassName' | 'label' | 'title'> & {
  expanded: boolean
}

/**
 * Button that expands or collapses a row or a section: a chevron pointing down, turned up when expanded.
 *
 * @param props - The button props.
 * @returns The button element.
 */
export const ButtonIconExpandToggle = (props: Props) => {
  const { className, expanded, size = 'small', ...otherProps } = props
  return (
    <Button
      {...otherProps}
      aria-expanded={expanded}
      className={classNames('btn-expand-toggle', { 'btn-expand-toggle--expanded': expanded }, className)}
      icon={<ExpandMore className="btn-expand-toggle__icon" />}
      size={size}
      title={expanded ? 'common.collapse' : 'common.expand'}
      variant="text"
    />
  )
}
