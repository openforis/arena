const R = require('ramda')

const {
  parse,
  differenceInMonths,
  differenceInWeeks,
  differenceInDays,
  differenceInHours,
  format,

  compareDesc,
  isValid: fnsIsValid,
} = require('date-fns')

const addTrailingZeroes = (n, length) => {
  const str = n + ''
  if (str.length > length) {
    return str
  }
  return '0'.repeat(length - str.length) + str
}

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
const isValid = (year, month, day) => {
  if (!(year && month && day)) {
    return false
  }

  const mm = addTrailingZeroes(month, 2)
  const dd = addTrailingZeroes(day, 2)
  const yyyy = addTrailingZeroes(year, 4)

  const date = (new Date(`${yyyy}-${mm}-${dd}T00:00:00Z`))

  return !!fnsIsValid(date)
    && date.getUTCFullYear() === +year
    && date.getUTCMonth() + 1 === +month
    && date.getUTCDate() === +day
}

module.exports = {
  getRelativeDate,
  compareDatesDesc,
  isValid,
}