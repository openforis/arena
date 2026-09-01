import classNames from 'classnames'

import { Button, ButtonProps } from './Button'

export const ButtonIconInfo = (props: ButtonProps) => {
  const { className: classNameProp, onClick, variant = 'text', ...otherProps } = props

  const className = classNames('btn-info', classNameProp)

  return (
    <Button
      {...otherProps}
      className={className}
      iconClassName="icon-info icon-14px"
      onClick={onClick}
      variant={variant}
    />
  )
}
