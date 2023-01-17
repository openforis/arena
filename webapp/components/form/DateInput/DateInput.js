import './DateInput.scss'

import React, { useCallback, useRef } from 'react'
import PropTypes from 'prop-types'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { TextField } from '@mui/material'

import * as DateUtils from '@core/dateUtils'

const format = DateUtils.formats.dateDefault
const validDateLength = 10

const DateInput = (props) => {
  const { disabled, value, onChange: onChangeProp } = props

  const errorRef = useRef(false)

  const dateValue = DateUtils.parse(value, format)

  const applyChange = useCallback(
    (dateFormatted) => {
      onChangeProp(dateFormatted)
      errorRef.current = false
    },
    [onChangeProp]
  )

  const onChange = useCallback(
    (date, keyboardInputValue) => {
      const selectedFromCalendar = !keyboardInputValue
      if (date === null) {
        applyChange(null)
      } else if (
        selectedFromCalendar ||
        (keyboardInputValue.length === validDateLength && DateUtils.isValidDateObject(date))
      ) {
        applyChange(DateUtils.format(date, format))
      } else {
        errorRef.current = true
      }
    },
    [applyChange]
  )

  return (
    <DatePicker
      className="date-picker"
      disabled={disabled}
      inputFormat={format}
      onChange={onChange}
      renderInput={(params) => (
        <TextField
          {...params}
          className="date-picker__text-field"
          autoComplete="off"
          error={params.error || errorRef.current}
        />
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
