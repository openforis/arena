import './DateInput.scss'

import React, { useCallback } from 'react'
import PropTypes from 'prop-types'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { TextField } from '@mui/material'

import * as DateUtils from '@core/dateUtils'

const format = DateUtils.formats.dateDefault

const DateInput = (props) => {
  const { disabled, value, onChange: onChangeProp } = props

  const dateValue = DateUtils.parse(value, format)

  const onChange = useCallback(
    (date) => {
      if (date === null) {
        onChangeProp(null)
      }
      if (DateUtils.isValidDateObject(date)) {
        const dateFormatted = DateUtils.format(date, format)
        onChangeProp(dateFormatted)
      }
    },
    [onChangeProp]
  )

  return (
    <DatePicker
      className="date-picker"
      disabled={disabled}
      inputFormat={format}
      onChange={onChange}
      renderInput={(params) => <TextField {...params} className="date-picker__text-field" autoComplete="off" />}
      value={dateValue}
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
