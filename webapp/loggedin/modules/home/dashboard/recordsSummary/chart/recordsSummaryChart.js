import './recordsSummaryChart.scss'

import React, { useEffect, useRef, useState } from 'react'

import DateUtils from '../../../../../../../common/dateUtils'

import YAxis, { getScale as getYScale } from './components/yAxis'
import XAxis, { getScale as getXScale } from './components/xAxis'
import DataPoints from './components/dataPoints'
import DataPath from './components/dataPath'

import { useOnResize } from '../../../../../../commonComponents/hooks'

import { elementOffset } from '../../../../../../utils/domUtils'

const RecordsSummaryChart = props => {
  const { counts, from, to } = props

  const chartRef = useRef(null)

  const [chartProps, setChartProps] = useState(null)

  const updateChartProps = () => {
    const { width, height } = elementOffset(chartRef.current)

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
      xScale: date => getXScale(counts, from, to, chartPropsUpdate)(DateUtils.parseISO(date)),
      yScale: getYScale(counts, chartPropsUpdate)
    })
  }

  useOnResize(updateChartProps, chartRef)

  useEffect(updateChartProps, [counts, from, to])

  return (
    <div className="home-dashboard__records-summary__chart"
         ref={chartRef}>

      {
        chartProps &&
        <svg width={chartProps.width} height={chartProps.height}>
          <YAxis
            {...props}
            chartProps={chartProps}/>
          <XAxis
            {...props}
            chartProps={chartProps}/>
          <DataPoints
            {...props}
            chartProps={chartProps}/>
          <DataPath
            {...props}
            chartProps={chartProps}/>
        </svg>
      }

    </div>
  )
}

export default RecordsSummaryChart