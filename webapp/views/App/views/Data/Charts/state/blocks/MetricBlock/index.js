import { blockTypes, valuesToCalculations } from '../common'

const _valuesToSpec = ({ value = [], spec = {}, key, configItemsByPath }) => {
  const columnValues = configItemsByPath[`${key}.column`]?.value
  const aggregationValues = configItemsByPath[`${key}.aggregation`]?.value
  const metrics = columnValues?.map((val) => val.value)
  const transform = valuesToCalculations(columnValues)

  const ag = aggregationValues?.[0]?.value

  const repeat = {
    layer: metrics,
  }
  const y = {
    field: { repeat: 'layer' },
    type: 'quantitative',
    aggregate: ag,
    title: transform.as,
  }

  const color = {
    datum: {
      repeat: 'layer',
    },
    title: transform.as,
  }

  const xOffset = {
    datum: {
      repeat: 'layer',
    },
  }

  const newSpec = {
    ...spec,
    repeat: repeat,
    spec: {
      ...(spec.spec || {}),
      encoding: {
        ...(spec.spec?.encoding || {}),
        y: y,
        color: color,
        xOffset: xOffset,
      },
    },
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
