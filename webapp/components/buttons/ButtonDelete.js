import React from 'react'
import PropTypes from 'prop-types'

import { Button } from './Button'

export const ButtonDelete = (props) => {
  const { disabled, id, onClick, testId } = props

  return (
    <Button
      id={id}
      data-testid={testId}
      disabled={disabled}
      aria-disabled={disabled}
      className="btn-danger btn-delete"
      iconClassName="icon-bin2 icon-left icon-12px"
      label="common.delete"
      onClick={onClick}
    />
  )
}

ButtonDelete.propTypes = {
  disabled: PropTypes.bool,
  id: PropTypes.string,
  onClick: PropTypes.func.isRequired,
  testId: PropTypes.string,
}

ButtonDelete.defaultProps = {
  disabled: false,
  id: null,
  testId: null,
}
