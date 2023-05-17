import './TimeInput.scss'

import React from 'react'
import PropTypes from 'prop-types'
import { TimePicker } from '@mui/x-date-pickers/TimePicker'

import * as DateUtils from '@core/dateUtils'
import { useDateTimeInput } from './useDateTimeInput'

const format = DateUtils.formats.timeStorage

const TimeInput = (props) => {
  const { disabled, onChange, value } = props

  const { dateValue, onInputChange, errorRef } = useDateTimeInput({ format, onChange, value })

  return (
    <TimePicker
      ampm={false}
      disabled={disabled}
      onChange={onInputChange}
      slotProps={{ textField: { className: 'time-picker__text-field', error: errorRef.current } }}
      value={dateValue}
    />
  )
}

TimeInput.propTypes = {
  disabled: PropTypes.bool,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
}

TimeInput.defaultProps = {
  disabled: false,
}

export default TimeInput
