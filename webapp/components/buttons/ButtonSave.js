import React from 'react'

import { Button } from './Button'

export const ButtonSave = (props) => (
  <Button {...props} className={`btn-primary ${props.className}`} iconClassName="icon-floppy-disk icon-12px" />
)

ButtonSave.propTypes = {
  ...Button.propTypes,
}

ButtonSave.defaultProps = {
  ...Button.defaultProps,
  label: 'common.save',
}
