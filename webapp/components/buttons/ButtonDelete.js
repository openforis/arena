import React from 'react'

import { Button } from './Button'

export const ButtonDelete = (props) => (
  <Button
    {...props}
    className="btn-danger btn-delete"
    iconClassName="icon-bin2 icon-left icon-12px"
    label="common.delete"
  />
)

ButtonDelete.propTypes = {
  ...Button.propTypes,
}

ButtonDelete.defaultProps = {
  ...Button.defaultProps,
}
