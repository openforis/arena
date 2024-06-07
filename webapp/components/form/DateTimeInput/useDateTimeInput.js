import { useCallback, useRef } from 'react'

import * as DateUtils from '@core/dateUtils'

export const useDateTimeInput = ({ onChange: onChangeProp, value, valueFormat }) => {
  const errorRef = useRef(false)

  const dateValue = value ? DateUtils.parse(value, valueFormat) : null

  const applyChange = useCallback(
    (dateFormatted) => {
      onChangeProp(dateFormatted)
      errorRef.current = false
    },
    [onChangeProp]
  )

  const onInputChange = useCallback(
    (date, context) => {
      const { validationError } = context
      if (date === null) {
        applyChange(null)
      } else if (validationError) {
        errorRef.current = true
      } else {
        applyChange(DateUtils.format(date, valueFormat))
      }
    },
    [applyChange, valueFormat]
  )

  return { dateValue, onInputChange, errorRef }
}
