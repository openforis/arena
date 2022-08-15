import { blockTypes, valuesToCalculations } from '../common'

const _valuesToSpec = ({ value = [], spec = {} }) => {
  const transform = valuesToCalculations(value)

  const x = {
    field: transform.as,
    type: 'nominal',
    impute: {
      value: 'NULL',
    },
  }

  const newSpec = {
    ...spec,
    transform: [transform],
    spec: {
      ...(spec.spec || {}),
      encoding: {
        ...(spec.spec?.encoding || {}),
        x: x,
      },
    },
  }

  return newSpec
}

const GroupByBlock = ({
  id = 'groupBy',
  title = 'Group by',
  subtitle = 'Select the dimension to group the data',
  type = blockTypes.select,
  optionsParams = { filter: ['nominal', 'temporal'] },
  isMulti = true,
  valuesToSpec = _valuesToSpec,
} = {}) => ({
  id,
  title,
  subtitle,
  type,
  optionsParams,
  isMulti,
  valuesToSpec,
})

export default GroupByBlock
