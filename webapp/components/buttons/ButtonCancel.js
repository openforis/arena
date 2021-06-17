import React from 'react'
import PropTypes from 'prop-types'

import { Button } from './Button'

export const ButtonCancel = (props) => {
  const { disabled, id, onClick, testId } = props

  return (
    <Button
      id={id}
      data-testid={testId}
      disabled={disabled}
      aria-disabled={disabled}
      className="btn-secondary"
      label="common.cancel"
      onClick={onClick}
    />
  )
}

ButtonCancel.propTypes = {
  disabled: PropTypes.bool,
  id: PropTypes.string,
  onClick: PropTypes.func.isRequired,
  testId: PropTypes.string,
}

ButtonCancel.defaultProps = {
  disabled: false,
  id: null,
  testId: null,
}
