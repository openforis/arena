import { blockTypes } from '../common'

const _valuesToSpec = ({ value = [], spec = {} }) => {
  const newSpec = {
    ...spec,
    mark: {
      ...(spec.mark || {}),
      clip: true,
    },
    encoding: {
      ...(spec.encoding || {}),
      y: {
        ...spec.encoding?.y,
        scale: { domainMax: value },
      },
    },
  }
  return newSpec
}

const MaxHeightBlock = ({
  id = 'maxHeight',
  title = 'Max Height of the bars',
  subtitle = 'Clip the bars to the number input',
  type = blockTypes.input,
  valuesToSpec = _valuesToSpec,
} = {}) => ({
  id,
  title,
  subtitle,
  type,
  valuesToSpec,
})

export default MaxHeightBlock
