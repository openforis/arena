import * as R from 'ramda'

import { useI18n } from '@webapp/store/system'
import { timeRanges } from './utils'

export const useTimeRanges = ({ timeRange }) => {
  const i18n = useI18n()
  const timeRangeItems = [
    {
      key: timeRanges._2Weeks,
      value: i18n.t('homeView.recordsSummary.week', { count: 2 }),
    },
    {
      key: timeRanges._1Month,
      value: i18n.t('homeView.recordsSummary.month', { count: 1 }),
    },
    {
      key: timeRanges._3Months,
      value: i18n.t('homeView.recordsSummary.month', { count: 3 }),
    },
    {
      key: timeRanges._6Months,
      value: i18n.t('homeView.recordsSummary.month', { count: 6 }),
    },
    {
      key: timeRanges._1Year,
      value: i18n.t('homeView.recordsSummary.year', { count: 1 }),
    },
  ]
  const timeRangeSelection = timeRangeItems.find(R.propEq('key', timeRange))

  return {
    timeRangeItems,
    timeRangeSelection,
  }
}
