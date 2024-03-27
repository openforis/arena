import { GroupByBlock, ShowLegendBlock, TitleBlock } from '../../blocks'
import { valuesToCalculations } from '../../blocks/common'
import { aggregationOptions } from '../common'

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
            isMulti: false,
            valuesToSpec: ({ value = [], spec = {} }) => {
              const { key: field_uuid, as: field } = valuesToCalculations(value)
              const groupBy = { field_uuid, field, type: 'nominal' }

              return {
                ...spec,
                query: {
                  ...spec.query,
                  groupBy,
                },
              }
            },
          }),
          metric: GroupByBlock({
            id: 'metric',
            title: 'Metric',
            subtitle: '',
            isMulti: false,
            optionsParams: { filter: ['quantitative'] },
            valuesToSpec: ({ spec = {}, value = [] }) => {
              const { as: field, key: field_uuid } = valuesToCalculations(value)
              const metric = { field, field_uuid, type: 'quantitative' }

              return {
                ...spec,
                query: {
                  ...spec.query,
                  metric,
                },
              }
            },
          }),
          aggregation: GroupByBlock({
            id: 'aggregation',
            title: 'Aggregation Method',
            subtitle: '',
            isMulti: false,
            optionsParams: {
              options: aggregationOptions,
            },
            valuesToSpec: ({ spec = {}, value = [] }) => ({
              ...spec,
              query: {
                ...spec.query,
                aggregation: {
                  type: valuesToCalculations(value).as,
                },
              },
            }),
          }),
        },
        order: ['groupBy', 'metric', 'aggregation'],
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
