import './recordsSummaryChart.scss'

import React, { useEffect, useRef, useState } from 'react'
import { elementOffset } from '../../../../../../utils/domUtils'

const RecordsSummaryChart = props => {

  const chartRef = useRef(null)

  const [chartSize, setChartSize] = useState(null)

  useEffect(() => {
    const { width, height } = elementOffset(chartRef.current)
    console.log(elementOffset(document.getElementsByClassName('home-dashboard__records-summary')[0]))
    setChartSize({ width, height })
  }, [])

  return (
    <div className="home-dashboard__records-summary__chart"
         ref={chartRef}>

      {
        chartSize &&
        <svg width={chartSize.width} height={chartSize.height}>

        </svg>
      }

    </div>
  )
}

export default RecordsSummaryChart