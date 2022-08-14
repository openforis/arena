import { blockTypes } from '../common'

const _valuesToSpec =
  (axisKey) =>
  ({ value = [], spec = {} }) => {
    const newSpec = {
      ...spec,
      spec: {
        ...(spec.spec || {}),
        encoding: {
          ...(spec.spec?.encoding || {}),
          [axisKey]: {
            ...spec.spec?.encoding?.[axisKey],
            title: value,
          },
        },
      },
    }
    return newSpec
  }

const AxisTitleBlock = ({
  id = '',
  title = (axisKey) => `Axis ${axisKey.toUpperCase()} title`,
  subtitle = (axisKey) => `Write the ${axisKey.toUpperCase()} axis title`,
  axisKey = '',
  type = blockTypes.input,
  valuesToSpec = _valuesToSpec(''),
} = {}) => ({
  id,
  title: typeof title === 'string' ? title : title(axisKey),
  subtitle: typeof subtitle === 'string' ? subtitle : subtitle(axisKey),
  axisKey,
  type,
  valuesToSpec: _valuesToSpec(axisKey),
})

export default AxisTitleBlock
