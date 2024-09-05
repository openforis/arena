import React, { useCallback } from 'react'
import PropTypes from 'prop-types'

import { useI18n } from '@webapp/store/system'
import { DateInput } from '@webapp/components/form/DateTimeInput'
import { DateFormats, Dates } from '@openforis/arena-core'

const DateContainer = ({ date, keyLabel, readOnly, onChange: onChangeProp }) => {
  const i18n = useI18n()
  const dateFormatted = Dates.convertDate({ dateStr: date, formatTo: DateFormats.dateDisplay })

  const onChange = useCallback(
    (newDate) => {
      const newDateFormatted = newDate
        ? Dates.convertDate({
            dateStr: newDate,
            formatFrom: DateFormats.dateDisplay,
            formatTo: DateFormats.dateStorage,
          })
        : null
      onChangeProp(newDateFormatted)
    },
    [onChangeProp]
  )

  return (
    <div className="date-container">
      <span className="date-label">{i18n.t(keyLabel)}</span>
      {readOnly ? <span className="date">{date}</span> : <DateInput onChange={onChange} value={dateFormatted} />}
    </div>
  )
}

DateContainer.propTypes = {
  date: PropTypes.string,
  keyLabel: PropTypes.string.isRequired,
  readOnly: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired,
}

export default DateContainer
