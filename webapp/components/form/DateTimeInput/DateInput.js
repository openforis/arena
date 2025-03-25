import './DateInput.scss'

import React from 'react'
import PropTypes from 'prop-types'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'

import * as DateUtils from '@core/dateUtils'
import { useDateTimeInput } from './useDateTimeInput'

const DateInput = (props) => {
  const {
    disabled = false,
    displayFormat = DateUtils.formats.dateDefault,
    onChange = null,
    value = null,
    valueFormat = DateUtils.formats.dateDefault,
  } = props

  const { dateValue, onInputChange, errorRef } = useDateTimeInput({ onChange, value, valueFormat })

  return (
    <DatePicker
      className="date-picker"
      disabled={disabled}
      format={displayFormat}
      onChange={onInputChange}
      slotProps={{ textField: { autoComplete: 'off', className: 'date-picker__text-field', error: errorRef.current } }}
      value={dateValue}
    />
  )
}

DateInput.propTypes = {
  disabled: PropTypes.bool,
  displayFormat: PropTypes.string,
  value: PropTypes.string,
  valueFormat: PropTypes.string,
  onChange: PropTypes.func,
}

export default DateInput
