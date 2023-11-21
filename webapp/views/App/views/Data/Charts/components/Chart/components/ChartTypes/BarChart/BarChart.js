import React, { useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import { renderBarChart } from './utils/render'
import './BarChart.css'

const BarChart = ({ specs, originalData }) => {
  const chartRef = useRef()

  useEffect(() => {
    if (!specs?.query?.metric || !specs?.query?.groupBy || !specs?.query?.aggregation) return

    const groupByField = specs.query.groupBy.field

    if (groupByField) {
      let data
      if (originalData?.chartResult) {
        data = originalData.chartResult.map((item) => ({
          groupBy: item[groupByField],
          [`${specs.query.metric.field}_${specs.query.aggregation.type || 'sum'}`]: parseFloat(
            item[`${specs.query.metric.field}_${specs.query.aggregation.type || 'sum'}`]
          ),
        }))
      } else {
        data = []
      }

      renderBarChart(
        data,
        specs,
        [`${specs.query.metric.field}_${specs.query.aggregation.type || 'sum'}`],
        groupByField,
        chartRef
      )
    }
  }, [specs, originalData])

  return <div className="chart-container" ref={chartRef}></div>
}

BarChart.propTypes = {
  specs: PropTypes.shape({
    query: PropTypes.shape({
      metric: PropTypes.shape({
        field: PropTypes.string.isRequired,
        aggregate: PropTypes.string,
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
}

export default React.memo(BarChart)
