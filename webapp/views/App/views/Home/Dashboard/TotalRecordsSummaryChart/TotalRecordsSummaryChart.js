/* eslint-disable react/jsx-props-no-spreading */
import './TotalRecordsSummaryChart.scss'

import React from 'react'
import PropTypes from 'prop-types'

import { useI18n } from '@webapp/store/system'

import RecordsSummaryPeriodSelector from '../RecordsSummaryPeriodSelector'

import { LineChart } from '@webapp/charts/LineChart'

const TotalRecordsSummaryChart = (props) => {
  const { counts } = props

  const i18n = useI18n()

  const chartData = counts

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
  from: PropTypes.string.isRequired,
  to: PropTypes.string.isRequired,
}

export default TotalRecordsSummaryChart
