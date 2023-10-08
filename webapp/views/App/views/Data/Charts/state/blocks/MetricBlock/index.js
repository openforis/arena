import { blockTypes } from '../common'
import { _valuesToSpec } from '../metricHelpers'

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
    optionsParams: { filter: ['quantitative'] },
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
