import React, { useContext, useMemo } from 'react'

import { BarChart } from '@webapp/charts/BarChart'

import { useI18n } from '@webapp/store/system'

import { RecordsSummaryContext } from '../RecordsSummaryContext'
import RecordsSummaryPeriodSelector from '../RecordsSummaryPeriodSelector'
import { NoRecordsAddedInSelectedPeriod } from '../NoRecordsAddedInSelectedPeriod'

export const RecordsByUser = () => {
  const i18n = useI18n()
  const { userCounts } = useContext(RecordsSummaryContext)

  const { chartData, totalCount } = useMemo(() => {
    const chartData = []
    let totalCount = 0
    userCounts.forEach((userCount) => {
      const { owner_name, owner_email, count: cnt } = userCount
      const count = Number(cnt)
      chartData.push({
        name: owner_name ?? owner_email,
        count,
      })
      totalCount += count
    })
    return { chartData, totalCount }
  }, [userCounts])

  return (
    <>
      <h4 className="dashboard-chart-header">
        {i18n.t('homeView.dashboard.recordsAddedPerUserWithCount', { totalCount })}
      </h4>

      <RecordsSummaryPeriodSelector />

      {chartData?.length > 0 ? (
        <BarChart data={chartData} dataKeys={['count']} layout="vertical" showLegend={false} />
      ) : (
        <NoRecordsAddedInSelectedPeriod />
      )}
    </>
  )
}
