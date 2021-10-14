import React from 'react'

import { Button } from './Button'

export const ButtonIconRetry = (props) => <Button {...props} iconClassName="icon-reply icon-16px" />

ButtonIconRetry.propTypes = {
  ...Button.propTypes,
}

ButtonIconRetry.defaultProps = {
  ...Button.defaultProps,
}
