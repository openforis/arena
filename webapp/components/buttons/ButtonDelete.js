import React from 'react'

import { Button } from './Button'

export const ButtonDelete = (props) => (
  <Button
    {...props}
    className="btn-danger btn-delete"
    iconClassName="icon-bin icon-left icon-12px"
  />
)

ButtonDelete.propTypes = {
  ...Button.propTypes,
}

ButtonDelete.defaultProps = {
  ...Button.defaultProps,
  label: "common.delete"
}
