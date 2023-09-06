import { TitleBlock, ShowLegendBlock, MaxHeightBlock, GroupByBlock, MetricBlock } from '../../blocks'
import { valuesToCalculations } from '../../blocks/common'

const bar = {
  selector: {
    title: 'Bar',
  },
  baseSpec: {
    chartType: 'barChart',
    chart: {
      showLegend: false,
    },
    query: {},
  },
  builderBlocks: {
    blocks: {
      query: {
        title: 'Query',
        subtitle: 'Config of the query for the bar chart',
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
            valuesToSpec: ({ value = [], spec = {}, key, configItemsByPath }) => {
              const columnValues = configItemsByPath[`${key}.column`]?.value
              const aggregationValues = configItemsByPath[`${key}.aggregation`]?.value
              const transform = valuesToCalculations(columnValues, '-')
              const aggTransform = valuesToCalculations(aggregationValues, '-')

              const aggValues = configItemsByPath['query.groupBy']?.value
              const aggs = aggValues?.map((val) => val.value)

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
        subtitle: 'Custom configuration of the chart',
        type: 'container',
        blocks: {
          'show-title': ShowLegendBlock({
            id: 'show-legend',
            title: 'Show Title',
            label: 'Show title',
            valuesToSpec: ({ value = [], spec = {} }) => {
              const newSpec = {
                ...spec,
                chart: {
                  ...spec.chart,
                  showTitle: value,
                },
              }
              return newSpec
            },
            defaultValue: false,
          }),
          title: TitleBlock({
            valuesToSpec: ({ value = [], spec = {}, configItemsByPath }) => {
              const newSpec = {
                ...spec,
                chart: {
                  ...spec.chart,
                  title: value,
                },
              }
              return newSpec
            },
          }),
          'show-legend': ShowLegendBlock({
            valuesToSpec: ({ value = [], spec = {} }) => {
              const newSpec = {
                ...spec,
                chart: {
                  ...spec.chart,
                  showLegend: value,
                },
              }
              return newSpec
            },
            defaultValue: false,
          }),
          'title-size': {
            id: 'title-size',
            title: 'Title Font Size',
            subtitle: '',
            type: 'slider',
            params: { min: 0, max: 80, step: 1, default: 40, unit: 'px' },
            valuesToSpec: ({ value = [], spec = {} }) => {
              const newSpec = {
                ...spec,
                chart: {
                  ...spec.chart,
                  titleSize: value,
                },
              }
              return newSpec
            },
          },
          'axis-size': {
            id: 'axis-size',
            title: 'Axis Font Size',
            subtitle: '',
            type: 'slider',
            params: { min: 0, max: 80, step: 1, default: 25, unit: 'px' },
            valuesToSpec: ({ value = [], spec = {} }) => {
              const newSpec = {
                ...spec,
                chart: {
                  ...spec.chart,
                  axisSize: value,
                },
              }
              return newSpec
            },
          },
          'ticks-size': {
            id: 'ticks-size',
            title: 'Ticks Size',
            subtitle: '',
            type: 'slider',
            params: { min: 0, max: 80, step: 1, default: 15, unit: 'px' },
            valuesToSpec: ({ value = [], spec = {} }) => {
              const newSpec = {
                ...spec,
                chart: {
                  ...spec.chart,
                  ticksSize: value,
                },
              }
              return newSpec
            },
          },
          xTitle: TitleBlock({
            id: 'xAxis',
            title: 'Name of the X axis',
            subtitle: 'Write here the name of the X axis',
            valuesToSpec: ({ value = [], spec = {}, configItemsByPath }) => {
              const newSpec = {
                ...spec,
                chart: {
                  ...spec.chart,
                  xAxisTitle: value,
                },
              }
              return newSpec
            },
          }),
          yTitle: TitleBlock({
            id: 'yAxis',
            title: 'Name of the Y axis',
            subtitle: 'Write here the name of the Y axis',
            valuesToSpec: ({ value = [], spec = {}, configItemsByPath }) => {
              const newSpec = {
                ...spec,
                chart: {
                  ...spec.chart,
                  yAxisTitle: value,
                },
              }
              return newSpec
            },
          }),
          maxHeight: MaxHeightBlock({
            valuesToSpec: ({ value = [], spec = {} }) => {
              const newSpec = {
                ...spec,
                chart: {
                  ...spec.chart,
                  barMaxHeight: value,
                },
              }
              return newSpec
            },
          }),
          stack: {
            id: 'stack',
            title: 'Stack and normalize bars',
            subtitle: '',
            label: 'stack bars',
            type: 'checkbox',
            defaultValue: false,
            valuesToSpec: ({ value = [], spec = {} }) => {
              const newSpec = {
                ...spec,
                chart: {
                  ...spec.chart,
                  stackedBars: value,
                },
              }
              return newSpec
            },
          },
          switchHorizontal: {
            id: 'horizontal',
            title: 'Make chart Horizontal',
            subtitle: 'Make Horizontal',
            label: 'Make horizontal',
            type: 'checkbox',
            defaultValue: false,
            valuesToSpec: ({ value = [], spec = {} }) => {
              const newSpec = {
                ...spec,
                chart: {
                  ...spec.chart,
                  isHorizontal: value,
                },
              }
              return newSpec
            },
          },
        },

        order: [
          'show-title',
          'title',
          'show-legend',
          'title-size',
          'axis-size',
          'ticks-size',
          'xTitle',
          'yTitle',
          'maxHeight',
          'stack',
          'switchHorizontal',
        ],
      },
    },
    order: ['query', 'other'],
  },
}

export default bar
