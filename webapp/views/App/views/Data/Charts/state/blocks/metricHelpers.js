const createBlock = (id, title, type, optionsParams, options = []) => ({
  id,
  title,
  type,
  optionsParams,
  options,
})

const createLabelBuilder =
  (includeAggregation = false) =>
  (values) => {
    const column = values.column.map(({ label }) => label).join(', ')

    if (includeAggregation) {
      const aggregation = values.aggregation.map(({ label }) => label).join(', ')
      return `${aggregation}(${column})`
    }

    return `${column}`
  }

export const _valuesToSpec = ({ spec = {}, key, configItemsByPath }) => {
  const columnValues = configItemsByPath[`${key}.column`]?.value
  const aggregationValues = configItemsByPath[`${key}.aggregation`]?.value
  const metrics = columnValues?.map((val) => val.value)

  const aggValues = configItemsByPath['query.groupBy']?.value
  const aggs = aggValues?.map((val) => val.value)

  const aggregations = metrics?.map((value, index) => {
    const ag = aggregationValues[index]?.value
    return {
      op: ag,
      field: value,
      impute: {
        value: 'NULL',
      },
      as: `${ag}_${value}`,
    }
  })

  const fold = metrics?.map((value, index) => `${aggregationValues[index]?.value}_${value}`)

  const y = {
    field: 'value',
    type: 'quantitative',
    title: 'value',
    aggregate: 'max',
    impute: {
      value: 'NULL',
    },
  }

  const color = {
    field: 'key',
    title: 'values',
  }

  const xOffset = {
    field: 'key',
  }

  const newSpec = {
    ...spec,
    encoding: {
      ...(spec.encoding || {}),
      y,
      color,
      xOffset,
    },
    transform: [...(spec.transform || []), { aggregate: aggregations, groupby: aggs }, { fold: fold }],
  }

  return newSpec
}

export const _labelBuilder = createLabelBuilder(true)
export const _singleLabelBuilder = createLabelBuilder()

export const _blocks = {
  column: createBlock('column', 'Column', 'select', { filter: ['quantitative'] }),
  aggregation: createBlock('aggregation', 'Aggregation', 'select', { showIcons: false }, [
    { value: 'sum', label: 'Sum', name: 'sum', type: 'aggregation' },
    { value: 'average', label: 'Average', name: 'avg', type: 'aggregation' },
    { value: 'count', label: 'Count', name: 'count', type: 'aggregation' },
    { value: 'variance', label: 'Variance', name: 'variance', type: 'aggregation' },
    { value: 'median', label: 'Median', name: 'median', type: 'aggregation' },
    { value: 'min', label: 'Minimum', name: 'min', type: 'aggregation' },
    { value: 'max', label: 'Maximum', name: 'max', type: 'aggregation' },
  ]),
}

export const _singleBlocks = {
  column: createBlock('column', 'Column', 'select', { filter: ['quantitative'] }),
}
