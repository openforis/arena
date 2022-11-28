import React from 'react'

import { Button } from './Button'

export const ButtonIconView = (props) => <Button {...props} iconClassName="icon-eye icon-14px" />

ButtonIconView.propTypes = {
  ...Button.propTypes,
}

ButtonIconView.defaultProps = {
  ...Button.defaultProps,
  label: 'common.view',
  showLabel: false,
}
