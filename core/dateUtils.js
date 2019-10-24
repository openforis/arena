const R = require('ramda')

const {
  parse: dateFnsParse,
  parseISO,
  differenceInMonths,
  differenceInWeeks,
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  isBefore,
  isAfter,
  format,

  isValid: fnsIsValid,

  subDays,
  addDays,
  subMonths,
  subYears,
} = require('date-fns')

const { isBlank } = require('./stringUtils')

const normalizeDateTimeValue = length => value => R.pipe(
  R.ifElse(
    R.is(String),
    R.identity,
    R.toString
  ),
  val => val.padStart(length, '0')
)(value)

const getRelativeDate = (i18n, date) => {

  if (R.isNil(date))
    return null

  const now = new Date()

  const formatDiff = (fn, unit) => {
    const count = fn(now, date)
    return i18n.t('common.date.timeDiff', { count, unit })
  }

  if (differenceInMonths(now, date) > 0)
    return format(date, 'dd MMM yyyy')

  if (differenceInWeeks(now, date) > 0)
    return formatDiff(differenceInWeeks, 'week')

  if (differenceInDays(now, date) > 0)
    return formatDiff(differenceInDays, 'day')

  if (differenceInHours(now, date) > 0)
    return formatDiff(differenceInHours, 'hour')

  if (differenceInMinutes(now, date) > 10)
    return formatDiff(differenceInMinutes, 'minute')

  return i18n.t('common.date.aMomentAgo')
}

/**
 * Checks if the date is valid. Takes into account leap years
 * (i.e. 2015/2/29 is not valid).
 * Used for PostgreSQL date inserts
 *
 * @param year
 * @param month
 * @param day
 * @returns {boolean}
 */
const isValidDate = (year, month, day) => {
  if (isBlank(year) || isBlank(month) || isBlank(day)) {
    return false
  }

  const date = (new Date(year, month - 1, day))

  return !!fnsIsValid(date) &&
    date.getFullYear() === +year &&
    date.getMonth() + 1 === +month &&
    date.getDate() === +day
}

const isValidTime = (hour = '', minutes = '') =>
  isBlank(hour) || isBlank(minutes)
    ? false
    : +hour >= 0 && +hour < 24 && +minutes >= 0 && +minutes < 60

const isValidDateInFormat = (dateStr, format) => {
  const parsed = parse(dateStr, format)
  return !isNaN(parsed.getTime())
}

const formatDate = (day, month, year) =>
  `${normalizeDateTimeValue(2)(day)}/${normalizeDateTimeValue(2)(month)}/${normalizeDateTimeValue(4)(year)}`

const formatTime = (hour, minute) =>
  `${normalizeDateTimeValue(2)(hour)}:${normalizeDateTimeValue(2)(minute)}`

const parse = (dateStr, format) =>
  dateFnsParse(dateStr, format, new Date())

module.exports = {
  getRelativeDate,
  isBefore,
  isAfter,

  isValidDate,
  isValidTime,
  isValidDateInFormat,

  format,
  formatTime,
  formatDate,

  parse,
  parseISO,
  subDays,
  addDays,
  differenceInDays,
  differenceInHours,
  subMonths,
  subYears,
}
