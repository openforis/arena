import * as d3 from 'd3'

export const getMetricAggregationPairs = (metric) => {
  const metricsFields = metric.field.split('-')
  const aggregationMethods = (metric.aggregate || 'sum').split('-')

  return metricsFields.map((field, index) => ({
    field,
    aggregation: aggregationMethods[index] || 'sum',
  }))
}

export const calculateAggregatedValues = (group, metricAggregationPairs) => {
  let aggregatedValues = {}

  metricAggregationPairs.forEach((pair) => {
    const aggregationMethod = pair.aggregation
    const metricField = pair.field
    const fieldAggName = `${metricField}_${aggregationMethod}` // create a unique name

    let calculatedValue
    switch (aggregationMethod) {
      case 'avg':
        calculatedValue = d3.mean(group, (g) => parseFloat(g[metricField]))
        break
      case 'count':
        calculatedValue = group.length
        break
      case 'median':
        calculatedValue = d3.median(group, (g) => parseFloat(g[metricField]))
        break
      case 'max':
        calculatedValue = d3.max(group, (g) => parseFloat(g[metricField]))
        break
      case 'min':
        calculatedValue = d3.min(group, (g) => parseFloat(g[metricField]))
        break
      case 'variance':
        calculatedValue = d3.variance(group, (g) => parseFloat(g[metricField]))
        break
      default:
        calculatedValue = d3.sum(group, (g) => parseFloat(g[metricField]))
    }

    aggregatedValues[fieldAggName] = calculatedValue
  })

  return aggregatedValues
}
