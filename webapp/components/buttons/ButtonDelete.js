import React from 'react'
import classNames from 'classnames'

import { Button } from './Button'

export const ButtonDelete = (props) => {
  const { label = 'common.delete' } = props
  return (
    <Button
      {...props}
      className={classNames('btn-danger btn-delete', props.className)}
      iconClassName="icon-bin2 icon-12px"
      label={label}
      variant="text"
    />
  )
}

ButtonDelete.propTypes = {
  ...Button.propTypes,
}
