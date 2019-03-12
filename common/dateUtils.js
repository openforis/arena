const R = require('ramda')

const {
  parse,
  differenceInMonths,
  differenceInWeeks,
  differenceInDays,
  differenceInHours,
  isBefore,
  format,

  compareDesc,
  isValid: fnsIsValid,
} = require('date-fns')

const { isBlank } = require('../common/stringUtils')

const normalizeDateTimeValue = length => value => R.pipe(
  R.ifElse(
    R.is(String),
    R.identity,
    R.toString
  ),
  val => val.padStart(length, '0')
)(value)

const getRelativeDate = date => {

  if (R.isNil(date))
    return null

  const timestamp = parse(date)
  const now = new Date()

  const formatDiff = (fn, unit) => {
    const diff = fn(now, timestamp)
    return `${diff} ${unit}${diff > 1 ? 's' : ''} ago`
  }

  if (differenceInMonths(now, timestamp) > 0)
    return format(timestamp, 'DD MMM YYYY')

  if (differenceInWeeks(now, timestamp) > 0)
    return formatDiff(differenceInWeeks, 'week')

  if (differenceInDays(now, timestamp) > 0)
    return formatDiff(differenceInDays, 'day')

  if (differenceInHours(now, timestamp) > 0)
    return formatDiff(differenceInHours, 'hour')

  return 'A moment ago'
}

const compareDatesDesc = compareDesc

const isDateBefore = isBefore
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

  return !!fnsIsValid(date)
    && date.getFullYear() === +year
    && date.getMonth() + 1 === +month
    && date.getDate() === +day
}

const isValidTime = (hour = '', minutes = '') =>
  isBlank(hour) || isBlank(minutes)
    ? false
    : +hour >= 0 && +hour < 24 && +minutes >= 0 && +minutes < 60

const formatDate = (day, month, year) =>
  `${normalizeDateTimeValue(2)(day)}/${normalizeDateTimeValue(2)(month)}/${normalizeDateTimeValue(4)(year)}`

const formatTime = (hour, minute) =>
  `${normalizeDateTimeValue(2)(hour)}:${normalizeDateTimeValue(2)(minute)}`

module.exports = {
  getRelativeDate,
  compareDatesDesc,
  isDateBefore,

  isValidDate,
  isValidTime,

  formatTime,
  formatDate,
}
