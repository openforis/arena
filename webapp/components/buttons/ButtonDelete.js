import React from 'react'

import { Button } from './Button'

export const ButtonDelete = (props) => (
  <Button
    {...props}
    className={`btn-danger btn-delete ${props.className ? props.className : ''}`}
    iconClassName="icon-bin icon-12px"
  />
)

ButtonDelete.propTypes = {
  ...Button.propTypes,
}

ButtonDelete.defaultProps = {
  ...Button.defaultProps,
  label: 'common.delete',
}
