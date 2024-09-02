import React from 'react'

import { Button } from './Button'

export const ButtonIconAdd = (props) => {
  const { className = 'btn-add', label = 'common.add', showLabel = false, variant = 'text' } = props
  return (
    <Button
      {...props}
      className={className}
      iconClassName="icon-plus icon-12px"
      label={label}
      showLabel={showLabel}
      variant={variant}
    />
  )
}

ButtonIconAdd.propTypes = {
  ...Button.propTypes,
}
