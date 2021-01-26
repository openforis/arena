import './DateInput.scss'

import React, { useRef } from 'react'
import PropTypes from 'prop-types'

import ReactDateInput from './ReactDateInput'

const DateInput = (props) => {
  const { disabled, value, onChange } = props

  const inputField = useRef()

  return (
    <ReactDateInput
      ref={inputField}
      disabled={disabled}
      format="DDMMYYYY"
      separator="/"
      onChange={onChange}
      date={value}
    />
  )
}

DateInput.propTypes = {
  disabled: PropTypes.bool,
  value: PropTypes.string,
  onChange: PropTypes.func,
}

DateInput.defaultProps = {
  disabled: false,
  value: null,
  onChange: null,
}

export default DateInput
