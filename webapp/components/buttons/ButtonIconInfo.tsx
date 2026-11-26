import classNames from 'classnames'

import { Button, ButtonProps } from './Button'

export const ButtonIconInfo = (props: ButtonProps) => {
  const { className: classNameProp, onClick, variant = 'text', ...otherProps } = props

  const className = classNames('btn-info', classNameProp)

  return <Button {...otherProps} className={className} iconName="info" onClick={onClick} variant={variant} />
}
