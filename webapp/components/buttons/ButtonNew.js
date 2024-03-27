import React from 'react'

import { Button } from './Button'

export const ButtonNew = (props) => (
  <Button {...props} className={`btn-primary ${props.className}`} iconClassName="icon-plus icon-12px icon-left" />
)

ButtonNew.propTypes = {
  ...Button.propTypes,
}

ButtonNew.defaultProps = {
  ...Button.defaultProps,
  label: 'common.new',
}
