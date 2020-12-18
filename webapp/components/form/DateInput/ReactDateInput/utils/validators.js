import { extractInfoFromDate } from './extractor'

export const getDaysInMonth = ({ date, separator, format }) => {
  const { month, year } = extractInfoFromDate({ date, separator, format })

  // Here January is 1 based //Day 0 is the last day in the previous month
  return new Date(year, month, 0).getDate()
  // Here January is 0 based // return new Date(year, month+1, 0).getDate();
}

const getNewValue = ({ value }) => {
  const valueNumeric = parseInt(value, 10)
  let newValue = false
  if (value === '') {
    newValue = value
  }

  if ((!Number.isNaN(valueNumeric) && value.match(/^[0-9]+$/)) || value === '') {
    newValue = value
  }
  return newValue
}

const isBetweenLimitsOrEmpty = ({ min, max, value }) => {
  let isValid = true
  const valueNumeric = parseInt(value, 10)

  if (valueNumeric > max || valueNumeric < min) {
    isValid = false
  }
  if (value === '') {
    isValid = true
  }
  return { isValid, newValue: value }
}

export const validateDay = ({ date, format, separator, value }) => ({
  errors: [],
  ...isBetweenLimitsOrEmpty({
    min: 0,
    max: getDaysInMonth({ date, format, separator }),
    value: getNewValue({ value }),
  }),
})

export const validateMonth = ({ value }) => ({
  errors: [],
  ...isBetweenLimitsOrEmpty({
    min: 0,
    max: 12,
    value: getNewValue({ value }),
  }),
})

export const validateYear = ({ value }) => ({
  errors: [],
  ...isBetweenLimitsOrEmpty({
    min: 0,
    max: 9999,
    value: getNewValue({ value }),
  }),
})

export const validatorsByKey = {
  day: validateDay,
  month: validateMonth,
  year: validateYear,
}

export const validateDate = ({ date, format, separator }) => {
  const { day, month, year } = extractInfoFromDate({ date, separator, format })
  let isValid = true
  let isIncomplete = false
  const { isValid: isDayValid } = validateDay({
    date,
    format,
    separator,
    value: day,
  })
  const { isValid: isMonthValid } = validateMonth({
    date,
    format,
    separator,
    value: month,
  })
  const { isValid: isYearValid } = validateYear({
    date,
    format,
    separator,
    value: year,
  })
  if (!isDayValid || !isMonthValid || !isYearValid) isValid = false

  isIncomplete = parseInt(day || '', 10) === 0 || parseInt(month || '', 10) === 0 || parseInt(year || '', 10) === 0
  return { isValid, isIncomplete }
}
