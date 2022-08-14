import { blockTypes } from '../common'

const _valuesToSpec = ({ value = [], spec = {} }) => {
  if (value) {
    const newSpec = {
      ...spec,
      spec: {
        ...(spec.spec || {}),
        encoding: {
          ...(spec.spec?.encoding || {}),
          y: spec.spec?.encoding?.x,
          x: spec.spec?.encoding?.y,
          yOffset: spec.spec?.encoding?.xOffset,
          xOffset: null,
        },
      },
    }
    return newSpec
  }
  return spec
}

const SwitchHorizontalBlock = ({
  id = 'switchHorizontal',
  title = 'Make chart Horizontal',
  subtitle = '',
  label = 'Make horizontal',
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

export default SwitchHorizontalBlock
