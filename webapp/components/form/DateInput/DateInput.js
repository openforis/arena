import './DateInput.scss'

import React, { useRef } from 'react'

import PropTypes from 'prop-types'

import * as DateUtils from '@core/dateUtils'

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
      placeholders={{
        day: 'dd',
        month: 'mm',
        year: 'yyyy',
      }}
      onChange={onChange}
      date={value || DateUtils.format(new Date(), 'dd/MM/yyyy')}
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
