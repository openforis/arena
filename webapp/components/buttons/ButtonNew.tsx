import classNames from 'classnames'

import { Button, ButtonProps } from './Button'

export const ButtonNew = (props: ButtonProps) => {
  const { label = 'common.new' } = props
  return (
    <Button
      {...props}
      className={classNames('btn-primary btn-new', props.className)}
      iconClassName="icon-plus icon-12px icon-left"
      label={label}
    />
  )
}
