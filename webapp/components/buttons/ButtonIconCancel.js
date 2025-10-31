import React from 'react'

import { Button } from './Button'

export const ButtonIconCancel = (props) => {
  const { className = 'btn-cancel', label = 'common.cancel', showLabel = false, variant = 'text' } = props
  return (
    <Button
      {...props}
      className={className}
      iconClassName="icon-cross icon-12px"
      label={label}
      showLabel={showLabel}
      variant={variant}
    />
  )
}

ButtonIconCancel.propTypes = {
  ...Button.propTypes,
}
