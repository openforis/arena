import React from 'react'

import { Button } from './Button'

export const ButtonNext = (props) => <Button {...props} iconClassName="icon-arrow-right icon-12px icon-left" />

ButtonNext.propTypes = {
  ...Button.propTypes,
}

ButtonNext.defaultProps = {
  ...Button.defaultProps,
  label: 'common.next',
}
