import React from 'react'
import PropTypes from 'prop-types'

import { Button } from './Button'

export const ButtonSave = (props) => {
  const { disabled, id, onClick, testId } = props

  return (
    <Button
      id={id}
      data-testid={testId}
      disabled={disabled}
      aria-disabled={disabled}
      className="btn-primary"
      iconClassName="icon-floppy-disk icon-left icon-12px"
      label="common.save"
      onClick={onClick}
    />
  )
}

ButtonSave.propTypes = {
  disabled: PropTypes.bool,
  id: PropTypes.string,
  onClick: PropTypes.func.isRequired,
  testId: PropTypes.string,
}

ButtonSave.defaultProps = {
  disabled: false,
  id: null,
  testId: null,
}
