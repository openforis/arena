import { blockTypes } from '../common'
import { _valuesToSpec, _labelBuilder, _blocks } from '../metricHelpers'

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
