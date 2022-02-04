import React from 'react'

import { Button } from './Button'

export const ButtonAdd = (props) => <Button {...props} iconClassName="icon-plus icon-12px" />

ButtonAdd.propTypes = {
  ...Button.propTypes,
}

ButtonAdd.defaultProps = {
  ...Button.defaultProps,
  label: 'common.add',
}
