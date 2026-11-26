import classNames from 'classnames'

import { Button, ButtonProps } from './Button'

export const ButtonSave = (props: ButtonProps) => {
  const { label = 'common.save' } = props
  return (
    <Button
      {...props}
      className={classNames('btn-primary btn-save', props.className)}
      iconName="save"
      iconSize={14}
      label={label}
    />
  )
}
