import React from 'react'
import classNames from 'classnames'

import { Button } from './Button'

export const ButtonSave = (props) => {
  const { label = 'common.save' } = props
  return (
    <Button
      {...props}
      className={classNames('btn-primary btn-save', props.className)}
      iconClassName="icon-floppy-disk icon-12px"
      label={label}
    />
  )
}

ButtonSave.propTypes = {
  ...Button.propTypes,
}
