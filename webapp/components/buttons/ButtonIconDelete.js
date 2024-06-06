import React from 'react'

import { Button } from './Button'

export const ButtonIconDelete = (props) => <Button {...props} iconClassName="icon-bin2 icon-12px" />

ButtonIconDelete.propTypes = {
  ...Button.propTypes,
}

ButtonIconDelete.defaultProps = {
  ...Button.defaultProps,
  className: 'btn-delete',
  label: 'common.delete',
  showLabel: false,
  variant: 'text',
}
