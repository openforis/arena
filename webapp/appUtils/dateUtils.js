import * as R from 'ramda'

import {
  parse,
  differenceInMonths,
  differenceInWeeks,
  differenceInDays,
  differenceInHours,
  format,

  compareDesc,
} from 'date-fns'

export const getRelativeDate = date => {

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

export const compareDatesDesc = compareDesc