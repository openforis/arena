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
    title: 'Method',
    type: 'select',
    options: [
      { value: 'average', label: 'Average', name: 'avg', type: 'aggregation' },
      { value: 'count', label: 'Count', name: 'count', type: 'aggregation' },
      { value: 'max', label: 'Maximum', name: 'max', type: 'aggregation' },
      { value: 'median', label: 'Median', name: 'median', type: 'aggregation' },
      { value: 'min', label: 'Minimum', name: 'min', type: 'aggregation' },
      { value: 'sum', label: 'Sum', name: 'sum', type: 'aggregation' },
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
