import React from 'react'

import { Button, ButtonProps } from './Button'

export const ButtonInvite = (props: ButtonProps) => {
  const { label = 'userView.sendNewInvitation', variant = 'contained', ...otherProps } = props
  return <Button {...otherProps} iconClassName="icon-envelop icon-left icon-12px" label={label} variant={variant} />
}
