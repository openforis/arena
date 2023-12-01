import './BarChart.css'

import React, { useEffect } from 'react'
import PropTypes from 'prop-types'

import { Objects } from '@openforis/arena-core'

import { renderBarChart } from './utils/render'

const BarChart = ({ specs, originalData, chartRef }) => {
  useEffect(() => {
    const { query = {} } = specs ?? {}
    const metricField = query.metric?.field
    const groupByField = query.groupBy?.field
    const aggregationType = query.aggregation?.type

    if (Objects.isEmpty(metricField) || Objects.isEmpty(groupByField) || Objects.isEmpty(aggregationType)) return

    if (groupByField) {
      let data
      if (originalData?.chartResult) {
        data = originalData.chartResult.map((item) => ({
          groupBy: item[groupByField],
          [`${metricField}_${aggregationType}`]: parseFloat(item[`${metricField}_${aggregationType}`]),
        }))
      } else {
        data = []
      }

      renderBarChart(data, specs, [`${metricField}_${aggregationType}`], groupByField, chartRef)
    }
  }, [specs, originalData, chartRef])

  return <div className="chart-container" ref={chartRef}></div>
}

BarChart.propTypes = {
  specs: PropTypes.shape({
    query: PropTypes.shape({
      metric: PropTypes.shape({
        field: PropTypes.string.isRequired,
      }).isRequired,
      groupBy: PropTypes.shape({
        field: PropTypes.string.isRequired,
      }).isRequired,
      aggregation: PropTypes.shape({
        type: PropTypes.string.isRequired,
      }).isRequired,
    }).isRequired,
  }).isRequired,
  originalData: PropTypes.shape({
    chartResult: PropTypes.arrayOf(
      PropTypes.shape({
        [PropTypes.string]: PropTypes.number,
      })
    ),
  }),
  chartRef: PropTypes.oneOfType([PropTypes.func, PropTypes.shape({ current: PropTypes.instanceOf(Element) })]),
}

export default React.memo(BarChart)
