import { blockTypes } from '../common'

const _valuesToSpec = ({ value = [], spec = {}, configItemsByPath }) => {
  if (configItemsByPath?.['other.show-title']?.value) {
    const newSpec = {
      ...spec,
      title: value,
    }
    return newSpec
  }
  return spec
}

const TitleBlock = ({
  id = 'title',
  title = 'Chart Title',
  subtitle = 'Write here the Chart title',
  hideIf = [['other.show-title', false]],
  type = blockTypes.input,
  valuesToSpec = _valuesToSpec,
} = {}) => ({
  id,
  title,
  subtitle,
  hideIf,
  type,
  valuesToSpec,
})

export default TitleBlock
