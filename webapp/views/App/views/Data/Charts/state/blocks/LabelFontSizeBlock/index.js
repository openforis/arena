import { blockTypes } from '../common'

const _valuesToSpec = ({ value = [], spec = {} }) => {
  const newSpec = {
    ...spec,
    spec: {
      ...(spec.spec || {}),
      encoding: {
        ...(spec.spec?.encoding || {}),
        y: {
          ...spec.spec?.encoding?.y,
          axis: {
            labelFontSize: value,
          },
        },
        x: {
          ...spec.spec?.encoding?.x,
          axis: {
            labelFontSize: value,
          },
        },
      },
    },
  }

  return newSpec
}

const LabelFontSizeBlock = ({
  id = 'labelFontSize',
  title = 'Label Font Size',
  subtitle = '',
  type = blockTypes.slider,
  params = { min: 1, max: 25, default: 11, step: 1, unit: 'px' },
  valuesToSpec = _valuesToSpec,
} = {}) => ({
  id,
  title,
  subtitle,
  type,
  params,
  valuesToSpec,
})

export default LabelFontSizeBlock
