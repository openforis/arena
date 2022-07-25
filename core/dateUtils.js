import * as R from 'ramda'

import {
  parse as dateFnsParse,
  differenceInMonths,
  differenceInWeeks,
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  format,
  isValid as fnsIsValid,
} from 'date-fns'

import { isBlank } from './stringUtils'

export {
  isBefore,
  isAfter,
  format,
  parseISO,
  subDays,
  addDays,
  differenceInDays,
  differenceInHours,
  subMonths,
  subYears,
} from 'date-fns'

export const formats = {
  dateDefault: 'dd/MM/yyyy',
  dateISO: 'yyyy-MM-dd',
  datetimeDefault: 'yyyy-MM-dd_HH-mm-ss',
  datetimeDisplay: 'dd/MM/yyyy HH:mm:ss',
  datetimeISO: `yyyy-MM-dd'T'HH:mm:ss.SSS'Z'`,
  timeStorage: 'HH:mm',
}

const normalizeDateTimeValue = (length) => (value) =>
  R.pipe(R.ifElse(R.is(String), R.identity, R.toString), (val) => val.padStart(length, '0'))(value)

export const getRelativeDate = (i18n, date) => {
  if (R.isNil(date)) {
    return null
  }

  const now = new Date()

  const formatDiff = (fn, unit) => {
    const count = fn(now, date)
    return i18n.t('common.date.timeDiff', { count, unit })
  }

  if (differenceInMonths(now, date) > 0) {
    return format(date, 'dd MMM yyyy')
  }

  if (differenceInWeeks(now, date) > 0) {
    return formatDiff(differenceInWeeks, 'week')
  }

  if (differenceInDays(now, date) > 0) {
    return formatDiff(differenceInDays, 'day')
  }

  if (differenceInHours(now, date) > 0) {
    return formatDiff(differenceInHours, 'hour')
  }

  if (differenceInMinutes(now, date) > 10) {
    return formatDiff(differenceInMinutes, 'minute')
  }

  return i18n.t('common.date.aMomentAgo')
}

/**.
 * Checks if the date is valid. Takes into account leap years
 * (i.e. 2015/2/29 is not valid).
 * Used for PostgreSQL date inserts
 *
 * @param year
 * @param month
 * @param day
 * @returns {boolean}
 */
export const isValidDate = (year, month, day) => {
  if (isBlank(year) || isBlank(month) || isBlank(day)) {
    return false
  }

  const date = new Date(year, month - 1, day)

  return (
    Boolean(fnsIsValid(date)) &&
    date.getFullYear() === Number(year) &&
    date.getMonth() + 1 === Number(month) &&
    date.getDate() === Number(day)
  )
}

export const isValidTime = (hour = '', minutes = '') =>
  isBlank(hour) || isBlank(minutes)
    ? false
    : Number(hour) >= 0 && Number(hour) < 24 && Number(minutes) >= 0 && Number(minutes) < 60

export const isValidDateInFormat = (dateStr, format) => {
  const parsed = parse(dateStr, format)
  return fnsIsValid(parsed)
}

export const formatDateISO = (date) => (date ? format(date, formats.dateISO) : null)

export const formatDateTimeDefault = (date) => (date ? format(date, formats.datetimeDefault) : null)

export const formatDateTimeDisplay = (date) => (date ? format(date, formats.datetimeDisplay) : null)

export const formatTime = (hour, minute) => `${normalizeDateTimeValue(2)(hour)}:${normalizeDateTimeValue(2)(minute)}`

export const parse = (dateStr, format) => dateFnsParse(dateStr, format, new Date())
export const parseDateISO = (dateStr) => parse(dateStr, formats.dateISO)
export const convertDate = ({ dateStr, formatFrom = formats.dateISO, formatTo, adjustTimezoneDifference = false }) => {
  if (R.isNil(dateStr) || R.isEmpty(dateStr)) {
    return null
  }
  const dateParsed = parse(dateStr, formatFrom)
  if (!fnsIsValid(dateParsed)) {
    return null
  }
  let dateAdjusted
  if (adjustTimezoneDifference) {
    const timezoneOffset = dateParsed.getTimezoneOffset() * 60000
    dateAdjusted = new Date(dateParsed.getTime() - timezoneOffset)
  } else {
    dateAdjusted = dateParsed
  }
  return format(dateAdjusted, formatTo)
}

export const convertDateTimeFromISOToDisplay = (dateStr) =>
  convertDate({
    dateStr,
    formatFrom: formats.datetimeISO,
    formatTo: formats.datetimeDisplay,
    adjustTimezoneDifference: true,
  })

export const nowFormatDefault = () => format(Date.now(), formats.datetimeDefault)
