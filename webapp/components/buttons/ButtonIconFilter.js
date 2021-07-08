import React from 'react'

import { Button } from './Button'

export const ButtonIconFilter = (props) => <Button {...props} iconClassName="icon-filter icon-12px" />

ButtonIconFilter.propTypes = {
  ...Button.propTypes,
}

ButtonIconFilter.defaultProps = {
  ...Button.defaultProps,
}
