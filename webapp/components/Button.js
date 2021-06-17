import React from 'react'
import PropTypes from 'prop-types'

import { useI18n } from '@webapp/store/system'

export const Button = (props) => {
  const { className, iconClassName, label, onClick } = props

  const i18n = useI18n()

  return (
    <button type="button" className={`btn ${className || ''}`} onClick={onClick}>
      {iconClassName && <span className={`icon ${iconClassName}`} />}
      {label ? i18n.t(label) : null}
    </button>
  )
}

Button.propTypes = {
  className: PropTypes.string,
  iconClassName: PropTypes.string,
  label: PropTypes.string,
  onClick: PropTypes.func.isRequired,
}

Button.defaultProps = {
  className: null,
  iconClassName: null,
  label: null,
}
