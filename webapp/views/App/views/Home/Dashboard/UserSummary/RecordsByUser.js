import React, { useContext, useMemo } from 'react'

import { BarChart } from '@webapp/charts/BarChart'

import { useI18n } from '@webapp/store/system'

import { RecordsSummaryContext } from '../RecordsSummaryContext'
import RecordsSummaryPeriodSelector from '../RecordsSummaryPeriodSelector'

export const RecordsByUser = () => {
  const i18n = useI18n()
  const { userCounts } = useContext(RecordsSummaryContext)

  const chartData = useMemo(() => {
    return userCounts.map((userCount) => {
      const { owner_name, owner_email, count } = userCount
      return {
        name: owner_name ?? owner_email,
        count: Number(count),
      }
    })
  }, [userCounts])

  const totalCount = useMemo(() => userCounts.reduce((acc, userCount) => acc + Number(userCount), 0), [userCounts])

  return (
    <>
      <h4 className="dashboard-chart-header">
        {i18n.t('homeView.dashboard.recordsAddedPerUserWithCount', { totalCount })}
      </h4>

      <RecordsSummaryPeriodSelector />

      <BarChart data={chartData} dataKey="count" layout="vertical" showLegend={false} />
    </>
  )
}
