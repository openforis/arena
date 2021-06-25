import React from 'react'

import { Button } from './Button'

export const ButtonCancel = (props) => <Button {...props} className="btn-secondary" label="common.cancel" />

ButtonCancel.propTypes = {
  ...Button.propTypes,
}

ButtonCancel.defaultProps = {
  ...Button.defaultProps,
}
