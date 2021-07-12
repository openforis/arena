import React from 'react'
import PropTypes from 'prop-types'

export const FormItem = (props) => {
  const { children, className, label, required } = props

  return (
    <div className={`form-item ${className}`}>
      <div className="form-label">
        {label}
        {required ? ' *' : ''}
      </div>
      {children}
    </div>
  )
}

FormItem.propTypes = {
  className: PropTypes.string,
  children: PropTypes.oneOfType([PropTypes.element, PropTypes.arrayOf(PropTypes.element)]).isRequired,
  label: PropTypes.oneOfType([PropTypes.string, PropTypes.element]),
  required: PropTypes.bool,
}

FormItem.defaultProps = {
  className: '',
  label: null,
  required: false,
}
