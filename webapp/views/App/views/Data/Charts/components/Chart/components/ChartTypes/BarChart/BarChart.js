import React, { useEffect, useRef } from 'react'
import { groupBy, map } from 'lodash'
import { calculateAggregatedValues, getMetricAggregationPairs } from './utils/aggregation'
import { renderBarChart } from './utils/render'

const BarChart = ({ specs, originalData }) => {
  const chartRef = useRef()

  useEffect(() => {
    if (!(specs && specs.query && specs.query.metric && specs.query.groupBy)) return

    const metricAggregationPairs = getMetricAggregationPairs(specs.query.metric)
    const groupByField = specs.query.groupBy.field

    if (!groupByField) {
      console.error('groupByField cannot be null or undefined')
      return
    }

    let data
    if (originalData && originalData.chartResult) {
      const groupedData = groupBy(originalData.chartResult, groupByField)

      data = map(groupedData, (group, key) => {
        const aggregatedValues = calculateAggregatedValues(group, metricAggregationPairs)

        return {
          groupBy: key,
          ...aggregatedValues,
        }
      })
    } else {
      data = []
    }

    const metricAggregationNames = metricAggregationPairs.map((pair) => `${pair.field}_${pair.aggregation}`)
    renderBarChart(data, specs, metricAggregationNames, groupByField, chartRef)
  }, [specs, originalData])

  return <div ref={chartRef}></div>
}

export default React.memo(BarChart)
