export const processData = (originalData, specs) => {
  const { xMetric, yMetric, category } = specs?.query || {}
  const xField = xMetric?.field
  const yField = yMetric?.field
  const categoryField = category?.field || null

  let data =
    originalData?.chartResult?.map((item) => ({
      [xField]: item[xField] !== undefined ? parseFloat(item[xField]) : null,
      [yField]: item[yField] !== undefined ? parseFloat(item[yField]) : null,
      category: categoryField && item[categoryField] !== undefined ? item[categoryField] : 'No Category',
    })) || []

  // Filter out data points with NaN x or y values
  data = data.filter((item) => !isNaN(item[xField]) && !isNaN(item[yField]))

  return { data, xField, yField, categoryField }
}
