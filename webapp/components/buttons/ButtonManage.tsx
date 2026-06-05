import React from 'react'

import { Button, ButtonProps } from './Button'

export const ButtonManage = (props: ButtonProps) => {
  const { label = 'common.manage', variant = 'outlined' } = props
  return <Button {...props} iconClassName="icon-list icon-12px" label={label} variant={variant} />
}
