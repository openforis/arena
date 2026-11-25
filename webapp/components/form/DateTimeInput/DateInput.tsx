import './DateInput.scss'

import { DatePicker } from '@mui/x-date-pickers/DatePicker'

import * as DateUtils from '@core/dateUtils'

import { useDateTimeInput } from './useDateTimeInput'

type DateInputProps = {
  disabled?: boolean
  displayFormat?: string
  value?: string
  valueFormat?: string
  onChange?: (...args: any[]) => any
}

const DateInput = (props: DateInputProps) => {
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
      slotProps={{
        field: { clearable: !disabled },
        textField: {
          className: 'date-picker__text-field',
          // eslint-disable-next-line react-hooks/refs -- same pre-existing pattern as TimeInput
          error: errorRef.current,
        },
      }}
      value={dateValue}
    />
  )
}

export default DateInput
