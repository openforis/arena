import React from 'react'

import { Button } from './Button'

export const ButtonIconFilter = (props) => <Button {...props} iconClassName="icon-filter icon-14px" />

ButtonIconFilter.propTypes = {
  ...Button.propTypes,
}

ButtonIconFilter.defaultProps = {
  ...Button.defaultProps,
}
