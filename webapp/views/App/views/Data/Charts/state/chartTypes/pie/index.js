import { TitleBlock, ShowLegendBlock, GroupByBlock } from '../../blocks'
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
          metric: GroupByBlock({
            id: 'metric',
            title: 'Metric',
            subtitle: 'Select the metric to measure the data ( Y axis )',
            optionsParams: { filter: ['quantitative'] },
            valuesToSpec: ({ spec = {}, value = [] }) => {
              const transform = valuesToCalculations(value)
              const metric = {
                field: transform.as,
                field_uuid: transform.key,
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
          aggregation: GroupByBlock({
            id: 'aggregation',
            title: 'Aggregation Method',
            subtitle: '',
            isMulti: false,
            optionsParams: {
              options: [
                { value: 'average', label: 'Average', name: 'avg', type: 'aggregation' },
                { value: 'count', label: 'Count', name: 'count', type: 'aggregation' },
                { value: 'max', label: 'Maximum', name: 'max', type: 'aggregation' },
                { value: 'median', label: 'Median', name: 'median', type: 'aggregation' },
                { value: 'min', label: 'Minimum', name: 'min', type: 'aggregation' },
                { value: 'sum', label: 'Sum', name: 'sum', type: 'aggregation' },
              ],
            },
            valuesToSpec: ({ spec = {}, value = [] }) => {
              const transform = valuesToCalculations(value)
              const aggregation = {
                type: transform.as,
              }

              const newSpec = {
                ...spec,
                query: {
                  ...spec.query,
                  aggregation,
                },
              }
              return newSpec
            },
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
