import React from 'react'

import { Button } from './Button'
import { ButtonDelete } from './ButtonDelete'

export const ButtonIconDelete = (props) => {
  const { showLabel = false, size = 'small', variant = 'text' } = props
  return <ButtonDelete {...props} showLabel={showLabel} size={size} variant={variant} />
}

ButtonIconDelete.propTypes = {
  ...Button.propTypes,
}
