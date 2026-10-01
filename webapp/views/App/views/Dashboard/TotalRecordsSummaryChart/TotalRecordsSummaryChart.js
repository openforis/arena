import React, { useMemo } from 'react'
import PropTypes from 'prop-types'

import { convertDateFromISOToDisplay } from '@core/dateUtils'

import { LineChart } from '@webapp/charts/LineChart'

import { NoRecordsAddedInSelectedPeriod } from '../NoRecordsAddedInSelectedPeriod'

// The period selector and the title live at page/section level, so the chart renders only the data.
const TotalRecordsSummaryChart = (props) => {
  const { counts } = props

  const chartData = useMemo(
    () =>
      counts.map(({ date, count }) => ({
        date: convertDateFromISOToDisplay(date),
        count: Number(count),
      })),
    [counts]
  )

  if (chartData.length === 0) return <NoRecordsAddedInSelectedPeriod />

  return <LineChart allowDecimals={false} data={chartData} dataKeys={['count']} labelDataKey="date" />
}

TotalRecordsSummaryChart.propTypes = {
  counts: PropTypes.array.isRequired,
}

export default TotalRecordsSummaryChart
