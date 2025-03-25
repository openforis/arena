import React from 'react'

import { Button } from './Button'

export const ButtonInvite = (props) => {
  const { label = 'userView.sendNewInvitation', variant = 'contained', ...otherProps } = props
  return <Button {...otherProps} iconClassName="icon-envelop icon-left icon-12px" label={label} variant={variant} />
}

ButtonInvite.propTypes = {
  ...Button.propTypes,
}
