import React from 'react'

import { Button } from './Button'

export const ButtonIconCog = (props) => <Button {...props} iconClassName="icon-cog icon-14px" />

ButtonIconCog.propTypes = {
  ...Button.propTypes,
}

ButtonIconCog.defaultProps = {
  ...Button.defaultProps,
}
