import React from 'react'

import { Button } from './Button'

export const ButtonIconGear = (props) => {
  const { variant = 'text' } = props
  return <Button {...props} iconClassName="icon-cog icon-14px" variant={variant} />
}

ButtonIconGear.propTypes = {
  ...Button.propTypes,
}
