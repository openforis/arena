export const processData = (originalData, specs) => {
  let xField, yField, categoryField

  if (specs && specs.query && specs.query.xMetric && specs.query.yMetric) {
    xField = specs.query.xMetric.field
    yField = specs.query.yMetric.field
    categoryField = specs.query.category ? specs.query.category.field : null
  } else {
    xField = yField = categoryField = null
  }

  let data = []
  if (originalData && originalData.chartResult) {
    data = originalData.chartResult.map((item) => {
      let newItem = {}
      newItem[xField] = item[xField] !== undefined ? parseFloat(item[xField]) : null
      newItem[yField] = item[yField] !== undefined ? parseFloat(item[yField]) : null
      newItem.category = categoryField && item[categoryField] !== undefined ? item[categoryField] : 'No Category'
      return newItem
    })
    // Filter out data points with NaN x or y values
    data = data.filter((item) => !isNaN(item[xField]) && !isNaN(item[yField]))
  }

  return { data, xField, yField, categoryField }
}
