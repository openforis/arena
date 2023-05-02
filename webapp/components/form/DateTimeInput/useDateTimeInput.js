import { useCallback, useRef } from 'react'

import * as DateUtils from '@core/dateUtils'

export const useDateTimeInput = ({ format, onChange: onChangeProp, value }) => {
  const errorRef = useRef(false)

  const dateValue = DateUtils.parse(value, format)

  const applyChange = useCallback(
    (dateFormatted) => {
      onChangeProp(dateFormatted)
      errorRef.current = false
    },
    [onChangeProp]
  )

  const onInputChange = useCallback(
    (date, keyboardInputValue) => {
      const selectedFromCalendar = !keyboardInputValue
      if (date === null) {
        applyChange(null)
      } else if (
        selectedFromCalendar ||
        (keyboardInputValue.length === format.length && DateUtils.isValidDateObject(date))
      ) {
        applyChange(DateUtils.format(date, format))
      } else {
        errorRef.current = true
      }
    },
    [applyChange, format]
  )

  return { dateValue, onInputChange, errorRef }
}
