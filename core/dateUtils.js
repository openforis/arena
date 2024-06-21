import * as R from 'ramda'

import { DateFormats, Dates } from '@openforis/arena-core'

const {
  add,
  addMinutes,
  convertDate,
  diffInMinutes,
  diffInHours,
  diffInDays,
  diffInMonths,
  diffInWeeks,
  parse,
  parseISO,
  sub,
  subDays,
  subMonths,
  subYears,
} = Dates

export { add, addMinutes, convertDate, diffInHours, parse, parseISO, sub, subDays, subMonths, subYears }

import { isBlank } from './stringUtils'

export const formats = {
  dateDefault: DateFormats.dateDisplay,
  dateISO: DateFormats.dateStorage,
  datetimeDefault: DateFormats.datetimeDefault,
  datetimeExport: 'YYYY-MM-DD HH:mm:ss',
  datetimeDisplay: DateFormats.datetimeDisplay,
  datetimeISO: DateFormats.datetimeStorage,
  timeStorage: DateFormats.timeStorage,
}

const normalizeDateTimeValue = (length) => (value) =>
  R.pipe(R.ifElse(R.is(String), R.identity, R.toString), (val) => val.padStart(length, '0'))(value)

export const format = (date, format = formats.dateDefault) => Dates.format(date, format)

export const getRelativeDate = (i18n, date) => {
  if (R.isNil(date)) {
    return null
  }

  const now = new Date()

  const formatDiff = (count, unit) => i18n.t('common.date.timeDiff', { count, unit })

  const months = diffInMonths(now, date)
  if (months > 0) {
    return format(date, 'DD MMM YYYY')
  }

  const weeks = diffInWeeks(now, date)
  if (weeks > 0) {
    return formatDiff(weeks, 'week')
  }

  const days = diffInDays(now, date)
  if (days > 0) {
    return formatDiff(days, 'day')
  }

  const hours = diffInHours(now, date)
  if (hours > 0) {
    return formatDiff(hours, 'hour')
  }

  const minutes = diffInMinutes(now, date)
  if (minutes > 10) {
    return formatDiff(minutes, 'minute')
  }

  return i18n.t('common.date.aMomentAgo')
}

export const isValidDateObject = Dates.isValidDateObject

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
    Boolean(isValidDateObject(date)) &&
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
  return isValidDateObject(parsed)
}

export const formatDateISO = (date) => format(date, formats.dateISO)

export const formatDateDisplay = (date) => format(date, formats.dateDefault)

export const formatDateTimeDefault = (date) => format(date, formats.datetimeDefault)

export const formatDateTimeDisplay = (date) => format(date, formats.datetimeDisplay)

export const formatDateTimeExport = (date) => format(date, formats.datetimeExport)

export const formatTime = (hour, minute) => `${normalizeDateTimeValue(2)(hour)}:${normalizeDateTimeValue(2)(minute)}`

export const parseDateISO = (dateStr) => parse(dateStr, formats.dateISO)

export const convertDateFromISOToDisplay = (dateStr) =>
  convertDate({
    dateStr,
    formatFrom: formats.dateISO,
    formatTo: formats.dateDefault,
  })

export const convertDateTimeFromISOToDisplay = (dateStr) =>
  convertDate({
    dateStr,
    formatFrom: formats.datetimeISO,
    formatTo: formats.datetimeDisplay,
  })

export const nowFormatDefault = () => format(Date.now(), formats.datetimeDefault)
