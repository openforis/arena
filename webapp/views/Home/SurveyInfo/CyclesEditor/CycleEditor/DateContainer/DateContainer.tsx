import { useCallback } from 'react'

import { DateFormats, Dates } from '@openforis/arena-core'

import { DateInput } from '@webapp/components/form/DateTimeInput'
import { useI18n } from '@webapp/store/system'

type DateContainerProps = {
  date?: string
  keyLabel: string
  readOnly: boolean
  onChange: (...args: any[]) => any
}

const DateContainer = ({ date, keyLabel, readOnly, onChange: onChangeProp }: DateContainerProps) => {
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

export default DateContainer
