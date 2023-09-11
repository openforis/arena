import { blockTypes } from '../common'
import { _valuesToSpec, _singleLabelBuilder, _singleBlocks } from '../metricHelpers'

const SingleMetricBlock = ({
  id = 'metric',
  title = 'Metric',
  subtitle = '',
  type = blockTypes.metric,
  isMulti = false,
  labelBuilder = _singleLabelBuilder,
  valuesToSpec = _valuesToSpec,
  blocks = _singleBlocks,
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
