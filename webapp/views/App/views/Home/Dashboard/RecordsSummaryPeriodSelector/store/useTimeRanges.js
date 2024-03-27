import * as R from 'ramda'

import { useI18n } from '@webapp/store/system'

import { timeRanges } from './utils'

export const useTimeRanges = ({ timeRange }) => {
  const i18n = useI18n()
  const timeRangeItems = [
    {
      value: timeRanges._2Weeks,
      label: i18n.t('homeView.recordsSummary.week', { count: 2 }),
    },
    {
      value: timeRanges._1Month,
      label: i18n.t('homeView.recordsSummary.month', { count: 1 }),
    },
    {
      value: timeRanges._3Months,
      label: i18n.t('homeView.recordsSummary.month', { count: 3 }),
    },
    {
      value: timeRanges._6Months,
      label: i18n.t('homeView.recordsSummary.month', { count: 6 }),
    },
    {
      value: timeRanges._1Year,
      label: i18n.t('homeView.recordsSummary.year', { count: 1 }),
    },
    {
      value: timeRanges._5Years,
      label: i18n.t('homeView.recordsSummary.year', { count: 5 }),
    },
  ]
  const timeRangeSelection = timeRangeItems.find(R.propEq('value', timeRange))

  return {
    timeRangeItems,
    timeRangeSelection,
  }
}
