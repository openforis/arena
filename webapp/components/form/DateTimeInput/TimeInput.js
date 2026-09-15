import './TimeInput.scss'

import PropTypes from 'prop-types'
import classNames from 'classnames'
import { TimePicker } from '@mui/x-date-pickers/TimePicker'

import * as DateUtils from '@core/dateUtils'
import { useDateTimeInput } from './useDateTimeInput'

const TimeInput = (props) => {
  const { disabled = false, onChange, value, withSeconds = false } = props

  const valueFormat = withSeconds ? DateUtils.formats.timeWithSeconds : DateUtils.formats.timeStorage

  const { dateValue, onInputChange, errorRef } = useDateTimeInput({ onChange, value, valueFormat })

  return (
    <TimePicker
      ampm={false}
      disabled={disabled}
      onChange={onInputChange}
      slotProps={{
        textField: {
          className: classNames('time-picker__text-field', { 'time-picker__text-field--with-seconds': withSeconds }),
          // eslint-disable-next-line react-hooks/refs -- pre-existing pattern (predates this change, see git blame): errorRef is a plain ref updated in useDateTimeInput's onInputChange/applyChange callbacks, not read for reactive rendering logic.
          error: errorRef.current,
        },
      }}
      value={dateValue}
      views={withSeconds ? ['hours', 'minutes', 'seconds'] : ['hours', 'minutes']}
    />
  )
}

TimeInput.propTypes = {
  disabled: PropTypes.bool,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  withSeconds: PropTypes.bool,
}

export default TimeInput
