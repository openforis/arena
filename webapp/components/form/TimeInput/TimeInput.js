import './TimeInput.scss'

import React, { useCallback, useRef } from 'react'
import PropTypes from 'prop-types'
import { TimePicker } from '@mui/x-date-pickers/TimePicker'
import { TextField } from '@mui/material'

import * as DateUtils from '@core/dateUtils'

const format = DateUtils.formats.timeStorage
const validTimeStringLength = 5

const TimeInput = (props) => {
  const { onChange: onChangeProp, value } = props

  const errorRef = useRef(false)

  const dateObjValue = DateUtils.parse(value, format)

  const onChange = useCallback(
    (newTime, keyboardInputValue) => {
      const selectedFromPicker = !keyboardInputValue

      if (!newTime) {
        errorRef.current = false
        onChangeProp(null)
      } else if (
        selectedFromPicker ||
        (keyboardInputValue.length === validTimeStringLength && DateUtils.isValidDateObject(newTime))
      ) {
        errorRef.current = false
        const newTimeFormatted = DateUtils.format(newTime, DateUtils.formats.timeStorage)
        onChangeProp(newTimeFormatted)
      } else {
        errorRef.current = true
      }
    },
    [onChangeProp]
  )

  return (
    <TimePicker
      ampm={false}
      value={dateObjValue}
      onChange={onChange}
      renderInput={(params) => <TextField {...params} className="time-picker__text-field" error={errorRef.current} />}
    />
  )
}

TimeInput.propTypes = {
  disabled: PropTypes.bool,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
}

TimeInput.defaultProps = {
  disabled: false,
}

export default TimeInput
