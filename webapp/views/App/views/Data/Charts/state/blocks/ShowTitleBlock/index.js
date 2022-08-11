import { blockTypes } from '../common'

const _valuesToSpec = ({ value = [], spec = {} }) => spec

const ShowTitleBlock = ({
  id = 'show-title',
  title = 'Show title',
  subtitle = '',
  label = 'Show title',
  type = blockTypes.checkbox,
  defaultValue = false,
  valuesToSpec = _valuesToSpec,
} = {}) => ({
  id,
  title,
  subtitle,
  label,
  type,
  defaultValue,
  valuesToSpec,
})

export default ShowTitleBlock
