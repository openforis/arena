import classNames from 'classnames'

import { Button, ButtonProps } from './Button'

export const ButtonDelete = (props: ButtonProps) => {
  const { className, label = 'common.delete' } = props
  return (
    <Button
      {...props}
      className={classNames('btn-danger btn-delete', className)}
      iconName="delete"
      iconSize={14}
      label={label}
      variant="text"
    />
  )
}
