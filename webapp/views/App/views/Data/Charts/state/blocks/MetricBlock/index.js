import { blockTypes, valuesToCalculations } from '../common'

const _valuesToSpec = ({ value = [], spec = {}, key, configItemsByPath }) => {
  const columnValues = configItemsByPath[`${key}.column`]?.value
  const aggregationValues = configItemsByPath[`${key}.aggregation`]?.value
  const metrics = columnValues?.map((val) => val.value)

  const aggValues = configItemsByPath['query.groupBy']?.value
  const aggs = aggValues?.map((val) => val.value)

  const aggregations = metrics.map((value, index) => {
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

  const fold = metrics.map((value, index) => `${aggregationValues[index]?.value}_${value}`)

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
      y: y,
      color: color,
      xOffset: xOffset,
    },
    transform: [...spec.transform, { aggregate: aggregations, groupby: aggs }, { fold: fold }],
  }

  return newSpec
}

const _labelBuilder = (values) => {
  const aggregation = values.aggregation.map(({ label }) => label)
  const column = values.column.map(({ label }) => label)

  return `${aggregation}(${column})`
}

const _blocks = {
  column: {
    id: 'column',
    title: 'Column',
    type: 'select',
  },
  aggregation: {
    id: 'aggregation',
    title: 'Aggregation',
    type: 'select',
    options: [
      { value: 'sum', label: 'Sum', name: 'sum', type: 'aggregation' },
      { value: 'average', label: 'Average', name: 'avg', type: 'aggregation' },
      { value: 'count', label: 'Count', name: 'count', type: 'aggregation' },
      { value: 'variance', label: 'Variance', name: 'variance', type: 'aggregation' },
      { value: 'median', label: 'Median', name: 'median', type: 'aggregation' },
      { value: 'min', label: 'Minimum', name: 'min', type: 'aggregation' },
      { value: 'max', label: 'Maximum', name: 'max', type: 'aggregation' },
    ],
    optionsParams: { showIcons: false },
  },
}

const MetricBlock = ({
  id = 'metric',
  title = 'Metric',
  subtitle = 'Select the measurement to group the data',
  type = blockTypes.metric,
  isMulti = true,
  labelBuilder = _labelBuilder,
  valuesToSpec = _valuesToSpec,
  blocks = _blocks,
  order = ['column', 'aggregation'],
} = {}) => ({
  id,
  title,
  subtitle,
  type,
  isMulti,
  labelBuilder,
  valuesToSpec,
  blocks,
  order,
})

export default MetricBlock
