import React from 'react'

import { Button } from './Button'

export const ButtonIconClose = (props) => {
  const { className = 'close-btn btn-s', label = 'common.close', showLabel = false, variant = 'text' } = props
  return (
    <Button
      {...props}
      className={className}
      iconClassName="icon-cross icon-10px"
      label={label}
      showLabel={showLabel}
      variant={variant}
    />
  )
}

ButtonIconClose.propTypes = {
  ...Button.propTypes,
}
