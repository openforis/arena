import * as R from 'ramda'

import {
  parse,
  differenceInMonths,
  differenceInWeeks,
  differenceInDays,
  differenceInHours,
  format,
} from 'date-fns'

export const getRelativeDate = (rawDate) => {
  const timestamp = parse(rawDate)
  const now = new Date()

  const formatDiff = (fn, unit) => {
    const count = fn(now, timestamp)
    return `${count} ${unit}${count > 1 ? 's' : ''} ago`
  }

  if (R.isNil(rawDate))
    return null

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
