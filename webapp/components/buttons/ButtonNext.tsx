import React from 'react'

import { Button, ButtonProps } from './Button'

export const ButtonNext = (props: ButtonProps) => {
  const { label = 'common.next' } = props
  return <Button {...props} iconClassName="icon-arrow-right icon-12px" label={label} />
}
