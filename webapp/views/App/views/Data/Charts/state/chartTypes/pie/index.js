import { TitleBlock, ShowLegendBlock, MetricBlock, GroupByBlock } from '../../blocks'
import { valuesToCalculations } from '../../blocks/common'

const pie = {
  selector: {
    title: 'Pie',
  },
  baseSpec: {
    chartType: 'pieChart',
    chart: {
      titleSize: '20',
      showLegend: true,
    },
    query: {},
  },
  builderBlocks: {
    blocks: {
      query: {
        title: 'Query',
        type: 'container',
        blocks: {
          groupBy: GroupByBlock({
            valuesToSpec: ({ value = [], spec = {} }) => {
              const transform = valuesToCalculations(value)
              const groupBy = {
                field_uuid: transform.key,
                field: transform.as,
                type: 'nominal',
              }

              const newSpec = {
                ...spec,
                query: {
                  ...spec.query,
                  groupBy,
                },
              }
              return newSpec
            },
          }),
          metric: MetricBlock({
            valuesToSpec: ({ spec = {}, key, configItemsByPath }) => {
              const columnValues = configItemsByPath[`${key}.column`]?.value
              const aggregationValues = configItemsByPath[`${key}.aggregation`]?.value
              const transform = valuesToCalculations(columnValues, '-')
              const aggTransform = valuesToCalculations(aggregationValues, '-')

              const metric = {
                field: transform.as,
                field_uuid: transform.key,
                aggregate: aggTransform.as,
                type: 'quantitative',
              }

              const newSpec = {
                ...spec,
                query: {
                  ...spec.query,
                  metric,
                },
              }
              return newSpec
            },
          }),
        },
        order: ['groupBy', 'metric'],
      },
      other: {
        title: 'Custom Chart',
        subtitle: 'Configuration of the Chart',
        type: 'container',
        blocks: {
          title: TitleBlock({
            valuesToSpec: ({ value = [], spec = {} }) => ({
              ...spec,
              chart: {
                ...spec.chart,
                title: value,
              },
            }),
          }),
          'show-legend': ShowLegendBlock({
            valuesToSpec: ({ value = [], spec = {} }) => ({
              ...spec,
              chart: {
                ...spec.chart,
                showLegend: value,
              },
            }),
          }),
          'donut-radio': {
            id: 'donut-radio',
            title: 'Radio',
            subtitle: '',
            type: 'slider',
            params: { min: 0, max: 80, step: 1, default: 0, unit: 'px' },
            valuesToSpec: ({ value = [], spec = {} }) => ({
              ...spec,
              chart: {
                ...spec.chart,
                innerRadius: value,
              },
            }),
          },
        },
        order: ['title', 'show-legend', 'donut-radio'],
      },
    },
    order: ['query', 'other'],
  },
}

export default pie
