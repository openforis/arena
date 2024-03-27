import { GroupByBlock, MaxHeightBlock, ShowLegendBlock, TitleBlock } from '../../blocks'
import { sliderBlock, valuesToCalculations, valuesToSpec } from '../../blocks/common'

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
        subtitle: '',
        type: 'container',
        blocks: {
          groupBy: GroupByBlock({
            subtitle: 'Select the metric to group the data (X axis)',
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
            subtitle: 'Select the metric to measure the data (Y axis)',
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
          'show-title': ShowLegendBlock({
            id: 'show-legend',
            title: 'Show Title',
            label: 'Show title',
            valuesToSpec: valuesToSpec('showTitle'),
            defaultValue: true,
          }),
          title: TitleBlock({
            subtitle: '',
            valuesToSpec: valuesToSpec('title'),
          }),
          'show-legend': ShowLegendBlock({
            valuesToSpec: valuesToSpec('showLegend'),
            defaultValue: false,
          }),
          'title-size': sliderBlock('title-size', 'Title Font Size', 40),
          'axis-size': sliderBlock('axis-size', 'Axis Font Size', 25),
          'ticks-size': sliderBlock('ticks-size', 'Ticks Size', 15),
          xTitle: TitleBlock({
            id: 'xAxis',
            title: 'Name of the X axis',
            subtitle: '',
            valuesToSpec: ({ value = [], spec = {} }) => {
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
            subtitle: '',
            valuesToSpec: ({ value = [], spec = {} }) => {
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
