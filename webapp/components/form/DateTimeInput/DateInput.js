import './DateInput.scss'

import React from 'react'
import PropTypes from 'prop-types'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { TextField } from '@mui/material'

import * as DateUtils from '@core/dateUtils'
import { useDateTimeInput } from './useDateTimeInput'

const format = DateUtils.formats.dateDefault

const DateInput = (props) => {
  const { disabled, value, onChange } = props

  const { dateValue, onInputChange, errorRef } = useDateTimeInput({ format, onChange, value })

  return (
    <DatePicker
      className="date-picker"
      disabled={disabled}
      inputFormat={format}
      onChange={onInputChange}
      renderInput={(params) => (
        <TextField {...params} className="date-picker__text-field" autoComplete="off" error={errorRef.current} />
      )}
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
