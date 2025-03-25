import React from 'react'
import classNames from 'classnames'

import { Button } from './Button'

export const ButtonNew = (props) => {
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

ButtonNew.propTypes = {
  ...Button.propTypes,
}
