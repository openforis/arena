import React from 'react'
import PropTypes from 'prop-types'

import { Button } from './Button'

export const ButtonIconEdit = (props) => {
  const { disabled, id, onClick, testId } = props

  return (
    <Button
      id={id}
      data-testid={testId}
      disabled={disabled}
      aria-disabled={disabled}
      iconClassName="icon-pencil2 icon-14px"
      onClick={onClick}
    />
  )
}

ButtonIconEdit.propTypes = {
  disabled: PropTypes.bool,
  id: PropTypes.string,
  onClick: PropTypes.func.isRequired,
  testId: PropTypes.string,
}

ButtonIconEdit.defaultProps = {
  disabled: false,
  id: null,
  testId: null,
}
