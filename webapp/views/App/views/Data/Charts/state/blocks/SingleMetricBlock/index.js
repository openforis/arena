import { blockTypes } from '../common'

const _valuesToSpec = ({ value = [], spec = {}, key, configItemsByPath }) => {
  const columnValues = configItemsByPath[`${key}.column`]?.value
  const aggregationValues = configItemsByPath[`${key}.aggregation`]?.value
  const metrics = columnValues?.map((val) => val.value)

  const aggValues = configItemsByPath['query.groupBy']?.value
  const aggs = aggValues?.map((val) => val.value)

  const aggregations = metrics?.map((value, index) => {
    const ag = aggregationValues[index]?.value
    return {
      op: ag,
      field: value,
      impute: {
        value: 'NULL',
      },
      as: `${ag}_${value}`,
    }
  })

  const fold = metrics?.map((value, index) => `${aggregationValues[index]?.value}_${value}`)

  const y = {
    field: 'value',
    type: 'quantitative',
    title: 'value',
    aggregate: 'max',
    impute: {
      value: 'NULL',
    },
  }

  const color = {
    field: 'key',
    title: 'values',
  }

  const xOffset = {
    field: 'key',
  }

  const newSpec = {
    ...spec,
    encoding: {
      ...(spec.encoding || {}),
      y,
      color,
      xOffset,
    },
    transform: [...(spec.transform || []), { aggregate: aggregations, groupby: aggs }, { fold: fold }],
  }

  return newSpec
}

const _labelBuilder = (values) => {
  const column = values.column.map(({ label }) => label)

  return `${column}`
}

const _blocks = {
  column: {
    id: 'column',
    title: 'Column',
    type: 'select',
    optionsParams: { filter: ['quantitative'] },
  }
}

const SingleMetricBlock = ({
  id = 'metric',
  title = 'Metric',
  subtitle = '',
  type = blockTypes.metric,
  isMulti = false,
  labelBuilder = _labelBuilder,
  valuesToSpec = _valuesToSpec,
  blocks = _blocks,
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
