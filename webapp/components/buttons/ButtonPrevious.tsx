import React from 'react'

import { Button, ButtonProps } from './Button'

export const ButtonPrevious = (props: ButtonProps) => {
  const { label = 'common.previous' } = props
  return <Button {...props} iconClassName="icon-arrow-left icon-12px" label={label} />
}
