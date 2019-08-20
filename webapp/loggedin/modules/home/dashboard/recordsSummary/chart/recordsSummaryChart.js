import './recordsSummaryChart.scss'

import React, { useEffect, useRef, useState } from 'react'

import YAxis from './components/yAxis'
import XAxis from './components/xAxis'

import { elementOffset } from '../../../../../../utils/domUtils'

const RecordsSummaryChart = props => {

  const chartRef = useRef(null)

  const [chartProps, setChartProps] = useState(null)

  useEffect(() => {
    const { width, height } = elementOffset(chartRef.current)

    setChartProps({
      width,
      height,
      top: 20,
      bottom: 20,
      left: 50,
      transitionDuration: 300,
    })
  }, [])

  return (
    <div className="home-dashboard__records-summary__chart"
         ref={chartRef}>

      {
        chartProps &&
        <svg width={chartProps.width} height={chartProps.height}>
          <YAxis
            data={[]}
            chartProps={chartProps}/>
          <XAxis
            data={[]}
            chartProps={chartProps}/>
        </svg>
      }

    </div>
  )
}

export default RecordsSummaryChart