import React from 'react'

import { Button } from './Button'

export const ButtonAdd = (props) => {
  const { label = 'common.add' } = props
  return <Button {...props} iconClassName="icon-plus icon-12px" label={label} />
}

ButtonAdd.propTypes = {
  ...Button.propTypes,
}
