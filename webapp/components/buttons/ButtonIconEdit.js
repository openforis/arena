import React from 'react'

import { Button } from './Button'

export const ButtonIconEdit = (props) => <Button {...props} iconClassName="icon-pencil2 icon-14px" />

ButtonIconEdit.propTypes = {
  ...Button.propTypes,
}

ButtonIconEdit.defaultProps = {
  ...Button.defaultProps,
  label: 'common.edit',
  showLabel: false,
}
