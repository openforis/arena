import React from 'react'

import { Button } from './Button'

export const ButtonNew = (props) => (
  <Button {...props} className="btn-primary" iconClassName="icon-plus icon-12px icon-left" label="common.new" />
)

ButtonNew.propTypes = {
  ...Button.propTypes,
}

ButtonNew.defaultProps = {
  ...Button.defaultProps,
}
