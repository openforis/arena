import React from 'react'

import { Button } from './Button'

export const ButtonPrevious = (props) => <Button {...props} iconClassName="icon-arrow-left icon-12px icon-left" />

ButtonPrevious.propTypes = {
  ...Button.propTypes,
}

ButtonPrevious.defaultProps = {
  ...Button.defaultProps,
  label: 'common.previous',
}
