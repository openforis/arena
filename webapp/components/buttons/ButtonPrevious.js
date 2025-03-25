import React from 'react'

import { Button } from './Button'

export const ButtonPrevious = (props) => {
  const { label = 'common.previous' } = props
  return <Button {...props} iconClassName="icon-arrow-left icon-12px" label={label} />
}

ButtonPrevious.propTypes = {
  ...Button.propTypes,
}
