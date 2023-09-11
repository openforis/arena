import { blockTypes } from '../common'
import { _valuesToSpec } from '../metricHelpers'

const _labelBuilder = (values) => {
  const column = values.column.map(({ label }) => label)

  return `${column}`
}

const _blocks = {
  column: {
    id: 'column',
    title: 'Column',
    type: 'select',
    optionsParams: { filter: ['quantitative'] },
  },
}

const SingleMetricBlock = ({
  id = 'metric',
  title = 'Metric',
  subtitle = '',
  type = blockTypes.metric,
  isMulti = false,
  labelBuilder = _labelBuilder,
  valuesToSpec = _valuesToSpec,
  blocks = _blocks,
  order = ['column'],
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

export default SingleMetricBlock
