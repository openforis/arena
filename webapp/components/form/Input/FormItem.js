import React from 'react'
import PropTypes from 'prop-types'

export const FormItem = (props) => {
  const { children, className, label } = props

  return (
    <div className={`form-item ${className}`}>
      <div className="form-label">{label}</div>
      {children}
    </div>
  )
}

FormItem.propTypes = {
  className: PropTypes.string,
  children: PropTypes.oneOfType([PropTypes.element, PropTypes.arrayOf(PropTypes.element)]).isRequired,
  label: PropTypes.oneOfType([PropTypes.string, PropTypes.element]),
}

FormItem.defaultProps = {
  className: '',
  label: null,
}
