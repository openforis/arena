/* eslint-disable react/jsx-props-no-spreading */
import './TotalRecordsSummaryChart.scss'

import React, { useEffect, useRef, useState } from 'react'
import PropTypes from 'prop-types'

import * as DateUtils from '@core/dateUtils'

import { useElementOffset } from '@webapp/components/hooks'
import { useI18n } from '@webapp/store/system'

import RecordsSummaryPeriodSelector from '../RecordsSummaryPeriodSelector'

import DataPath from './components/dataPath'
import DataPoints from './components/dataPoints'
import XAxis, { getScale as getXScale } from './components/xAxis'
import YAxis, { getScale as getYScale } from './components/yAxis'

const TotalRecordsSummaryChart = (props) => {
  const { counts, from, to } = props

  const i18n = useI18n()
  const wrapperRef = useRef(null)
  const [chartProps, setChartProps] = useState(null)
  const { width, height } = useElementOffset(wrapperRef)

  useEffect(() => {
    if (!width || !height) return

    const chartPropsUpdate = {
      width,
      height,
      top: 20,
      bottom: 40,
      left: 35,
      right: 35,
      transitionDuration: 300,
    }

    setChartProps({
      ...chartPropsUpdate,
      xScale: (date) => getXScale(counts, from, to, chartPropsUpdate)(DateUtils.parseISO(date)),
      yScale: getYScale(counts, chartPropsUpdate),
    })
  }, [counts, from, height, to, width])

  return (
    <>
      <h4 className="dashboard-chart-header">{i18n.t('homeView.dashboard.totalRecords')}</h4>

      <RecordsSummaryPeriodSelector />

      <div className="dashboard-chart-wrapper total-records-chart" ref={wrapperRef}>
        {chartProps && (
          <svg width={chartProps.width} height={chartProps.height}>
            <YAxis {...props} chartProps={chartProps} />
            <XAxis {...props} chartProps={chartProps} />
            <DataPath {...props} chartProps={chartProps} />
            <DataPoints {...props} chartProps={chartProps} />
          </svg>
        )}
      </div>
    </>
  )
}

TotalRecordsSummaryChart.propTypes = {
  counts: PropTypes.array.isRequired,
  from: PropTypes.string.isRequired,
  to: PropTypes.string.isRequired,
}

export default TotalRecordsSummaryChart
