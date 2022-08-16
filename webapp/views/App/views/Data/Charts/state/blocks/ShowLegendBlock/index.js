import { blockTypes } from '../common'

const _valuesToSpec = ({ value = [], spec = {} }) => {
  let legend = true
  if (!value) {
    legend = null
  }

  const newSpec = {
    ...spec,
    spec: {
      ...(spec.spec || {}),
      encoding: {
        ...(spec.spec?.encoding || {}),
        color: {
          ...(spec.spec?.encoding?.color || {}),
          legend: legend,
        },
      },
    },
  }
  return newSpec
}

const ShowLegendBlock = ({
  id = 'show-legend',
  title = 'Show Legend',
  subtitle = '',
  label = 'Show legend',
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

export default ShowLegendBlock
