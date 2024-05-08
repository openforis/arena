import React, { useMemo } from 'react'
import PropTypes from 'prop-types'

import { convertDateFromISOToDisplay } from '@core/dateUtils'

import { LineChart } from '@webapp/charts/LineChart'

import { useI18n } from '@webapp/store/system'

import RecordsSummaryPeriodSelector from '../RecordsSummaryPeriodSelector'
import { NoRecordsAddedInSelectedPeriod } from '../NoRecordsAddedInSelectedPeriod'

const TotalRecordsSummaryChart = (props) => {
  const { counts } = props

  const i18n = useI18n()

  const chartData = useMemo(
    () =>
      counts.map(({ date, count }) => ({
        date: convertDateFromISOToDisplay(date),
        count: Number(count),
      })),
    [counts]
  )

  return (
    <>
      <h4 className="dashboard-chart-header">{i18n.t('homeView.dashboard.totalRecords')}</h4>

      <RecordsSummaryPeriodSelector />

      {chartData.length > 0 ? (
        <LineChart allowDecimals={false} data={chartData} dataKey="count" labelDataKey="date" />
      ) : (
        <NoRecordsAddedInSelectedPeriod />
      )}
    </>
  )
}

TotalRecordsSummaryChart.propTypes = {
  counts: PropTypes.array.isRequired,
}

export default TotalRecordsSummaryChart
