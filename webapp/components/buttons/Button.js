import React from 'react'
import PropTypes from 'prop-types'

import { useI18n } from '@webapp/store/system'

export const Button = (props) => {
  const { className, disabled, iconClassName, id, label, onClick, testId, ...otherProps } = props

  const i18n = useI18n()

  return (
    <button
      id={id}
      data-testid={testId}
      disabled={disabled}
      aria-disabled={disabled}
      type="button"
      className={`btn ${className || ''}`}
      onClick={onClick}
      {...otherProps}
    >
      {iconClassName && <span className={`icon ${iconClassName}`} />}
      {label ? i18n.t(label) : null}
    </button>
  )
}

Button.propTypes = {
  className: PropTypes.string,
  disabled: PropTypes.bool,
  id: PropTypes.string,
  iconClassName: PropTypes.string,
  label: PropTypes.string,
  onClick: PropTypes.func.isRequired,
  testId: PropTypes.string,
}

Button.defaultProps = {
  className: null,
  disabled: false,
  iconClassName: null,
  id: null,
  label: null,
  testId: null,
}
