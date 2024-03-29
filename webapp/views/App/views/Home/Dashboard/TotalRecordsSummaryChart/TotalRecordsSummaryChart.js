import './TotalRecordsSummaryChart.scss'

import React, { useMemo } from 'react'
import PropTypes from 'prop-types'

import { convertDateFromISOToDisplay } from '@core/dateUtils'
import { useI18n } from '@webapp/store/system'

import RecordsSummaryPeriodSelector from '../RecordsSummaryPeriodSelector'

import { LineChart } from '@webapp/charts/LineChart'

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

      <LineChart data={chartData} dataKey="count" labelDataKey="date" />
    </>
  )
}

TotalRecordsSummaryChart.propTypes = {
  counts: PropTypes.array.isRequired,
}

export default TotalRecordsSummaryChart
