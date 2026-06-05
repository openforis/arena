import React from 'react'

import { Button, ButtonProps } from './Button'

export const ButtonAdd = (props: ButtonProps) => {
  const { label = 'common.add' } = props
  return <Button {...props} iconClassName="icon-plus icon-12px" label={label} />
}
