import React from 'react'

import { Button } from './Button'

export const ButtonIconGear = (props) => <Button {...props} iconClassName="icon-cog icon-14px" />

ButtonIconGear.propTypes = {
  ...Button.propTypes,
}

ButtonIconGear.defaultProps = {
  ...Button.defaultProps,
  variant: 'text',
}
