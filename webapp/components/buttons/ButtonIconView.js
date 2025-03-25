import React from 'react'

import { Button } from './Button'

export const ButtonIconView = (props) => {
  const { label = 'common.view', showLabel = false } = props
  return <Button {...props} iconClassName="icon-eye icon-14px" label={label} showLabel={showLabel} />
}

ButtonIconView.propTypes = {
  ...Button.propTypes,
}
