import React from 'react'
import PropTypes from 'prop-types'

import { ButtonIconInfo } from '@webapp/components/buttons'

export const FormItem = (props) => {
  const { children, className = '', info = null, label = null, required = false } = props

  return (
    <div className={`form-item ${className}`}>
      <div className="form-label">
        <div className="form-label-wrapper">
          {label}
          {required ? ' *' : ''}
          {info && <ButtonIconInfo title={info} />}
        </div>
      </div>
      {children}
    </div>
  )
}

FormItem.propTypes = {
  className: PropTypes.string,
  children: PropTypes.oneOfType([PropTypes.string, PropTypes.element, PropTypes.arrayOf(PropTypes.element)]).isRequired,
  info: PropTypes.string,
  label: PropTypes.oneOfType([PropTypes.string, PropTypes.element]),
  required: PropTypes.bool,
}
