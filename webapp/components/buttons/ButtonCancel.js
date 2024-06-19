import React from 'react'

import { Button } from './Button'

export const ButtonCancel = (props) => <Button {...props} className={`btn-secondary ${props.className || ''}`} />

ButtonCancel.propTypes = {
  ...Button.propTypes,
}

ButtonCancel.defaultProps = {
  ...Button.defaultProps,
  label: 'common.cancel',
  variant: 'text',
}
