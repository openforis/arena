import React from 'react'

import { Button } from './Button'

export const ButtonManage = (props) => <Button {...props} iconClassName="icon-list icon-12px" />

ButtonManage.propTypes = {
  ...Button.propTypes,
}

ButtonManage.defaultProps = {
  ...Button.defaultProps,
  label: 'common.manage',
  variant: 'outlined',
}
