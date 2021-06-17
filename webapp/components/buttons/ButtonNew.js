import React from 'react'
import PropTypes from 'prop-types'

import { Button } from './Button'

export const ButtonNew = (props) => {
  const { disabled, id, onClick, testId } = props

  return (
    <Button
      id={id}
      data-testid={testId}
      disabled={disabled}
      aria-disabled={disabled}
      className="btn-primary"
      iconClassName="icon-plus icon-12px icon-left"
      label="common.new"
      onClick={onClick}
    />
  )
}

ButtonNew.propTypes = {
  disabled: PropTypes.bool,
  id: PropTypes.string,
  onClick: PropTypes.func.isRequired,
  testId: PropTypes.string,
}

ButtonNew.defaultProps = {
  disabled: false,
  id: null,
  testId: null,
}
