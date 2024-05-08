export const processData = (originalData, specs) => {
  const groupByField = specs?.query?.groupBy?.field
  const metricField = specs?.query?.metric?.field
  const aggregateType = specs?.query?.aggregation?.type || 'sum'

  let aggregatedData = {}

  // Process each item in the chart result
  originalData?.chartResult?.forEach((item) => {
    const categoryValue = item[groupByField] || 'No Category'
    const metricValue = parseFloat(item[metricField])
    let categoryData = aggregatedData[categoryValue]

    if (!isNaN(metricValue)) {
      if (!categoryData) {
        // Initialize if not present
        categoryData = {
          sum: metricValue,
          count: 1,
          values: [metricValue],
        }
        aggregatedData[categoryValue] = categoryData
      } else {
        // Perform aggregation based on the specified type
        switch (aggregateType) {
          case 'max':
            categoryData.sum = Math.max(categoryData.sum, metricValue)
            break
          case 'sum':
            categoryData.sum += metricValue
            break
          case 'min':
            categoryData.sum = Math.min(categoryData.sum, metricValue)
            break
          case 'avg':
            categoryData.sum += metricValue
            categoryData.count += 1
            break
          case 'median':
            categoryData.values.push(metricValue)
            break
          case 'count':
            categoryData.count += 1
            break
        }
      }
    }
  })
  const data = Object.keys(aggregatedData).map((key) => {
    let value
    let sortedValues
    let mid
    const categoryData = aggregatedData[key]
    switch (aggregateType) {
      case 'avg':
        value = categoryData.sum / categoryData.count
        break
      case 'median':
        sortedValues = categoryData.values.sort((a, b) => a - b)
        mid = Math.floor(sortedValues.length / 2)
        value = sortedValues.length % 2 !== 0 ? sortedValues[mid] : (sortedValues[mid - 1] + sortedValues[mid]) / 2
        break
      case 'count':
        value = categoryData.count
        break
      default:
        value = categoryData.sum
    }
    return {
      category: key,
      value: value,
    }
  })

  return { data, categoryField: 'category', valueField: 'value' }
}
