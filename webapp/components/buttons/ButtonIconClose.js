import React from 'react'

import { Button } from './Button'

export const ButtonIconClose = (props) => <Button {...props} iconClassName="icon-cross icon-10px" />

ButtonIconClose.propTypes = {
  ...Button.propTypes,
}

ButtonIconClose.defaultProps = {
  ...Button.defaultProps,
  className: 'close-btn btn-s',
  label: 'common.close',
  showLabel: false,
}
