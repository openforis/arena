import React, { useState, useEffect, createRef, useMemo, useRef } from 'react'
import PropTypes from 'prop-types'
import ReactDOM from 'react-dom'
import Calendar from 'react-calendar'

import { useI18n } from '@webapp/store/system'
import { KeyboardKeys } from '@webapp/utils/keyboardKeys'

import 'react-calendar/dist/Calendar.css'
import './reactDateInput.scss'

import { extractInfoFromDate, buildDate, getDaysInMonth, validateDate } from './utils'

import Separator from './Separator'
import Input from './Input'

const dateKeysByFormat = {
  MMDDYYYY: ['month', 'day', 'year'],
  DDMMYYYY: ['day', 'month', 'year'],
  YYYYMMDD: ['year', 'month', 'day'],
}

const shouldJumpNext = ({ day, month, year, date, separator, format, canMoveNext }) => {
  if (parseInt(day, 10) >= 4) return true
  if (((day || '').startsWith('0') || canMoveNext) && parseInt(day, 10) > 0) return true
  const maxDaysInMonth = getDaysInMonth({ date, separator, format })
  if (maxDaysInMonth < 30 && parseInt(day, 10) >= 3) return true

  if (parseInt(month, 10) >= 2) return true
  if (((month || '').startsWith('0') || canMoveNext) && parseInt(month, 10) > 0) return true

  if (parseInt(year, 10) >= 1000) return true

  return false
}

const PLACEHOLDERS = {
  day: 'dd',
  month: 'mm',
  year: 'yyyy',
}

const LABELS = {
  day: 'Day',
  month: 'Month',
  year: 'Year',
}

const getDateValue = ({ date, format, separator }) => {
  if (date === null) {
    return new Date()
  }
  const { day, month, year } = extractInfoFromDate({ date, format, separator })
  return new Date(year, month - 1, day)
}

const DateInput = React.forwardRef(
  (
    {
      format = 'MMDDYYYY',
      separator = '/',
      placeholders = PLACEHOLDERS,
      labels = LABELS,
      showLabel = false,

      disabled,
      date,
      onChange,
      onFocus,
      onBlur,
      withCalendar = true,
    },
    ref
  ) => {
    const i18n = useI18n()

    const dateInputContainer = useRef(null)
    const calendarContainer = useRef(null)
    const [dateInputContainerRef, setDateInputContainerRef] = useState(null)
    const [localDate, setDate] = useState(null)
    const [elRefs, setElRefs] = useState([])
    const [error, setError] = useState(false)
    const [warning, setWarning] = useState(false)
    const [isCalendarOpen, setIsCalendarOpen] = useState(false)

    const dateKeys = dateKeysByFormat[format]

    const handleValidateDate = ({ newDate }) => {
      setError(false)
      setWarning(false)
      const { isValid, isIncomplete } = validateDate({
        date: newDate,
        format,
        separator,
      })
      if (!isValid) {
        setError(true)
      }
      if (isIncomplete) {
        setWarning(true)
      }
    }

    const handleFocus = () => {
      onFocus?.()
      setIsCalendarOpen(true)
    }

    const handleBlur = () => {
      onBlur?.()
    }

    useEffect(() => {
      if (date) {
        setDate(date)
        handleValidateDate({ newDate: date })
      }
    }, [date])

    React.useEffect(() => {
      // add or remove refs
      setElRefs((elRefsArr) =>
        Array(3)
          .fill()
          .map((_, i) => elRefsArr[i] || createRef())
      )
      setDateInputContainerRef(dateInputContainer)
    }, [])

    const globalClickListener = (e) => {
      if (
        isCalendarOpen &&
        !(e.path?.includes(calendarContainer.current) || e.path?.includes(dateInputContainer.current))
      ) {
        setIsCalendarOpen(false)
      }
    }

    useEffect(() => {
      window.addEventListener('click', globalClickListener)
      return () => {
        document.removeEventListener('click', globalClickListener)
      }
    }, [isCalendarOpen])

    const handleShouldFocusCalendar = (e) => {
      if (!withCalendar) return
      if (isCalendarOpen) {
        if (e.target === elRefs[2].current && e.key === KeyboardKeys.Tab) {
          e.stopPropagation()
          e.preventDefault()
          calendarContainer.current.getElementsByTagName('button')[0].focus()
        }

        if (e.key === KeyboardKeys.Enter) {
          e.stopPropagation()
          e.preventDefault()
          const calendarButtons = calendarContainer.current.getElementsByTagName('button')
          if ([...calendarButtons].includes(document.activeElement)) {
            document.activeElement.click()
          }
        }

        if (e.key === KeyboardKeys.Escape) {
          e.stopPropagation()
          e.preventDefault()
          setIsCalendarOpen(false)
        }
      }
    }

    useEffect(() => {
      window.addEventListener('keydown', handleShouldFocusCalendar)

      return () => {
        window.removeEventListener('keydown', handleShouldFocusCalendar)
      }
    }, [elRefs, calendarContainer, isCalendarOpen])

    const handleChange = ({ day, month, year, itemIndex, canMoveNext = false }) => {
      const newDate = buildDate({
        date: localDate,
        separator,
        format,
        day,
        month,
        year,
      })

      if (
        shouldJumpNext({
          day,
          month,
          year,
          separator,
          format,
          date,
          canMoveNext,
        })
      ) {
        if (elRefs[itemIndex + 1]) {
          elRefs[itemIndex + 1].current.focus()
          elRefs[itemIndex + 1].current.setSelectionRange(0, elRefs[itemIndex + 1].current.value.length)
        }
      }
      setDate(newDate)
      const { isValid, isIncomplete } = validateDate({
        date: newDate,
        format,
        separator,
      })
      onChange(!isValid || isIncomplete ? null : newDate)
      handleValidateDate({ newDate })
      setIsCalendarOpen(false)
    }

    const moveBack = ({ itemIndex }) => {
      if (elRefs[itemIndex - 1]) {
        elRefs[itemIndex - 1].current.focus()
        elRefs[itemIndex - 1].current.setSelectionRange(0, elRefs[itemIndex - 1].current.value.length)
      }
    }

    const moveNext = ({ itemIndex, day, month, year }) => {
      handleChange({ itemIndex, canMoveNext: true, day, month, year })
    }

    const calculatedPosition = useMemo(() => {
      const el = dateInputContainerRef?.current
      if (isCalendarOpen && el) {
        const rect = el.getBoundingClientRect()

        const scrollLeft = window.pageXOffset || document.documentElement?.scrollLeft
        const scrollTop = window.pageYOffset || document.documentElement?.scrollTop

        return {
          top: rect.top + scrollTop + rect.height,
          left: rect.left + scrollLeft,
          position: 'fixed',
        }
      }

      return {}
    }, [dateInputContainerRef, isCalendarOpen])

    const handleChangeDateCalendar = (newDate) => {
      const year = String(newDate.getFullYear())
      const month = String(newDate.getMonth() + 1)
      const day = String(newDate.getDate())
      handleChange({ canMoveNext: false, day, month, year })
    }

    const renderCalendar = () => {
      return ReactDOM.createPortal(
        // eslint-disable-next-line jsx-a11y/click-events-have-key-events,jsx-a11y/no-static-element-interactions
        <div
          ref={calendarContainer}
          onClick={(e) => e.stopPropagation()}
          className="calendar-container"
          style={{ ...calculatedPosition }}
        >
          <Calendar
            inputRef={ref}
            disabled={disabled}
            onChange={handleChangeDateCalendar}
            value={getDateValue({ date: localDate, format, separator })}
          />
        </div>,
        document.body
      )
    }

    return (
      <div ref={ref} className="react-date-input date-input">
        <div ref={dateInputContainer} className="date-input-container">
          {React.createElement(Input, {
            disabled,
            date: localDate,
            placeholders,
            labels,
            separator,
            format,
            onChange: handleChange,
            itemIndex: 0,
            ref: elRefs[0],
            moveBack,
            moveNext,
            dateKey: dateKeys[0],
            onFocus: handleFocus,
            onBlur: handleBlur,
            showLabel,
          })}
          <Separator separator={separator} />
          {React.createElement(Input, {
            disabled,
            placeholders,
            labels,
            date: localDate,
            separator,
            format,
            onChange: handleChange,
            itemIndex: 1,
            ref: elRefs[1],
            moveBack,
            moveNext,
            dateKey: dateKeys[1],
            onFocus: handleFocus,
            onBlur: handleBlur,
            showLabel,
          })}
          <Separator separator={separator} />
          {React.createElement(Input, {
            disabled,
            placeholders,
            labels: LABELS,
            date: localDate,
            separator,
            format,
            onChange: handleChange,
            itemIndex: 2,
            ref: elRefs[2],
            moveBack,
            moveNext,
            dateKey: dateKeys[2],
            onFocus: handleFocus,
            onBlur: handleBlur,
            showLabel,
          })}
        </div>
        {error ||
          (warning && (
            <div className="error-container">
              <small>{i18n.t('validationErrors.invalidDate')}</small>
            </div>
          ))}

        {withCalendar && isCalendarOpen && renderCalendar()}
      </div>
    )
  }
)

DateInput.propTypes = {
  format: PropTypes.string,
  separator: PropTypes.string,
  placeholders: PropTypes.object,
  labels: PropTypes.object,
  showLabel: PropTypes.bool,

  disabled: PropTypes.bool,
  date: PropTypes.string,
  onChange: PropTypes.func,
  onFocus: PropTypes.func,
  onBlur: PropTypes.func,
  withCalendar: PropTypes.bool,
}

DateInput.defaultProps = {
  format: 'MMDDYYYY',
  separator: '/',
  placeholders: PLACEHOLDERS,
  labels: LABELS,
  showLabel: false,

  disabled: false,
  date: null,
  onChange: null,
  onFocus: null,
  onBlur: null,
  withCalendar: true,
}

export default DateInput
