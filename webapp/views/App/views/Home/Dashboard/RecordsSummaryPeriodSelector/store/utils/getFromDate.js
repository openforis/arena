import * as DateUtils from '@core/dateUtils'

import { timeRanges } from './timeRanges'

export const getFromDate = (date, timeRange) => {
  switch (timeRange) {
    case timeRanges._2Weeks:
      return DateUtils.subDays(date, 14)

    case timeRanges._1Month:
      return DateUtils.subMonths(date, 1)

    case timeRanges._3Months:
      return DateUtils.subMonths(date, 3)

    case timeRanges._6Months:
      return DateUtils.subMonths(date, 6)

    case timeRanges._1Year:
      return DateUtils.subYears(date, 1)

    case timeRanges._5Years:
      return DateUtils.subYears(date, 5)

    default:
      throw new Error(`Unknown timeRange: ${timeRange}`)
  }
}
