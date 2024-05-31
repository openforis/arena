import moment from 'moment'
import { useCallback, useRef } from 'react'

import * as DateUtils from '@core/dateUtils'

export const useDateTimeInput = ({ format, onChange: onChangeProp, value }) => {
  const errorRef = useRef(false)

  const dateValue = value ? moment(DateUtils.parse(value, format)) : null

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
        applyChange(DateUtils.format(date, format))
      }
    },
    [applyChange, format]
  )

  return { dateValue, onInputChange, errorRef }
}
