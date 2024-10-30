import React from 'react'

import { Button } from './Button'

export const ButtonIconEdit = (props) => {
  const { label = 'common.edit', showLabel = false, variant = 'text' } = props
  return (
    <Button {...props} iconClassName="icon-pencil2 icon-16px" label={label} showLabel={showLabel} variant={variant} />
  )
}

ButtonIconEdit.propTypes = {
  ...Button.propTypes,
}
