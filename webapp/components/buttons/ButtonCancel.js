import React from 'react'

import { Button } from './Button'

export const ButtonCancel = (props) => {
  const { iconClassName = 'icon-cross icon-12px', label = 'common.cancel', variant = 'text', ...otherProps } = props
  return (
    <Button
      className={`btn-cancel btn-secondary ${props.className ?? ''}`}
      iconClassName={iconClassName}
      label={label}
      variant={variant}
      {...otherProps}
    />
  )
}

ButtonCancel.propTypes = {
  ...Button.propTypes,
}
