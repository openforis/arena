import React from 'react'

import { Button } from './Button'

export const ButtonNext = (props) => {
  const { label = 'common.next' } = props
  return <Button {...props} iconClassName="icon-arrow-right icon-12px icon-left" label={label} />
}

ButtonNext.propTypes = {
  ...Button.propTypes,
}
