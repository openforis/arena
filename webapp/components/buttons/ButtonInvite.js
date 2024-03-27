import React from 'react'

import { Button } from './Button'

export const ButtonInvite = (props) => <Button {...props} iconClassName="icon-envelop icon-left icon-12px" />

ButtonInvite.propTypes = {
  ...Button.propTypes,
}

ButtonInvite.defaultProps = {
  ...Button.defaultProps,
  label: 'userView.sendNewInvitation',
}
