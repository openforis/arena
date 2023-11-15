export const processData = (originalData, specs) => {
  const groupByField = specs?.query?.groupBy?.field
  const metricField = specs?.query?.metric?.field
  const aggregateType = specs?.query?.metric?.aggregate

  let aggregatedData = {}

  // Process each item in the chart result
  originalData?.chartResult?.forEach((item) => {
    const categoryValue = item[groupByField] || 'No Category'
    const metricValue = parseFloat(item[metricField])

    if (!isNaN(metricValue)) {
      if (!aggregatedData[categoryValue]) {
        // Initialize if not present
        aggregatedData[categoryValue] = {
          sum: metricValue,
          count: 1,
          values: [metricValue],
        }
      } else {
        // Perform aggregation based on the specified type
        switch (aggregateType) {
          case 'max':
            aggregatedData[categoryValue].sum = Math.max(aggregatedData[categoryValue].sum, metricValue)
            break
          case 'sum':
            aggregatedData[categoryValue].sum += metricValue
            break
          case 'min':
            aggregatedData[categoryValue].sum = Math.min(aggregatedData[categoryValue].sum, metricValue)
            break
          case 'avg':
            aggregatedData[categoryValue].sum += metricValue
            aggregatedData[categoryValue].count += 1
            break
          case 'median':
            aggregatedData[categoryValue].values.push(metricValue)
            break
          case 'count':
            aggregatedData[categoryValue].count += 1
            break
        }
      }
    }
  })
  const data = Object.keys(aggregatedData).map((key) => {
    let value
    switch (aggregateType) {
      case 'avg':
        value = aggregatedData[key].sum / aggregatedData[key].count
        break
      case 'median':
        const sortedValues = aggregatedData[key].values.sort((a, b) => a - b)
        const mid = Math.floor(sortedValues.length / 2)
        value = sortedValues.length % 2 !== 0 ? sortedValues[mid] : (sortedValues[mid - 1] + sortedValues[mid]) / 2
        break
      case 'count':
        value = aggregatedData[key].count
        break
      default:
        value = aggregatedData[key].sum
    }
    return {
      category: key,
      value: value,
    }
  })

  return { data, categoryField: 'category', valueField: 'value' }
}
