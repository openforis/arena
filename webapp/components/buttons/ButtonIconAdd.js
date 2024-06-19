import React from 'react'

import { Button } from './Button'

export const ButtonIconAdd = (props) => <Button {...props} iconClassName="icon-plus icon-12px" />

ButtonIconAdd.propTypes = {
  ...Button.propTypes,
}

ButtonIconAdd.defaultProps = {
  ...Button.defaultProps,
  className: 'btn-add',
  label: 'common.add',
  showLabel: false,
  variant: 'text',
}
