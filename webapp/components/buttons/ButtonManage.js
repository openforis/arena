import React from 'react'

import { Button } from './Button'

export const ButtonManage = (props) => {
  const { label = 'common.manage', variant = 'outlined' } = props
  return <Button {...props} iconClassName="icon-list icon-12px" label={label} variant={variant} />
}

ButtonManage.propTypes = {
  ...Button.propTypes,
}
