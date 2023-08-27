import { TitleBlock, ShowLegendBlock, MaxHeightBlock, SingleMetricBlock } from '../../blocks'
import { valuesToCalculations } from '../../blocks/common'

const scatter = {
  selector: {
    title: 'Scatter',
  },
  baseSpec: {
    chartType: 'scatterPlot',
    chart: {
      dotSize: '8',
      titleSize: '33',
      axisSize: '16',
      ticksSize: '12',
      showLegend: false,
    },
    query: {},
  },
  builderBlocks: {
    blocks: {
      query: {
        title: 'Query',
        subtitle: 'Query for the Scatter plot',
        type: 'container',
        blocks: {
          metricX: SingleMetricBlock({
            id: 'metricX',
            title: 'Metric X axis',
            valuesToSpec: ({ value = [], spec = {}, key, configItemsByPath }) => {
              const columnValues = configItemsByPath[`${key}.column`]?.value
              const transform = valuesToCalculations(columnValues)

              const xMetric = {
                field: transform.as,
                type: 'quantitative',
              }

              const newSpec = {
                ...spec,
                query: {
                  ...spec.query,
                  xMetric,
                },
              }
              return newSpec
            },
          }),
          metricY: SingleMetricBlock({
            id: 'metricY',
            title: 'Metric Y axis',
            valuesToSpec: ({ value = [], spec = {}, key, configItemsByPath }) => {
              const columnValues = configItemsByPath[`${key}.column`]?.value
              const transform = valuesToCalculations(columnValues)

              const yMetric = {
                field: transform.as,
                type: 'quantitative',
              }

              const newSpec = {
                ...spec,
                query: {
                  ...spec.query,
                  yMetric,
                },
              }
              return newSpec
            },
          }),
          category: SingleMetricBlock({
            id: 'category',
            title: 'Category',
            blocks: {
              column: {
                id: 'column',
                title: 'Column',
                type: 'select',
                optionsParams: { filter: ['nominal'] },
              },
            },
            valuesToSpec: ({ value = [], spec = {}, key, configItemsByPath }) => {
              const columnValues = configItemsByPath[`${key}.column`]?.value
              const transform = valuesToCalculations(columnValues)

              const category = {
                field: transform.as,
                type: 'nominal',
              }

              const newSpec = {
                ...spec,
                query: {
                  ...spec.query,
                  category,
                },
              }
              return newSpec
            },
          }),
        },
        order: ['metricX', 'metricY', 'category'],
      },
      other: {
        title: 'Custom Chart',
        subtitle: 'Custom configuration of the chart',
        type: 'container',
        blocks: {
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
          xAxis: TitleBlock({
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
          yAxis: TitleBlock({
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
          'dot-size': {
            id: 'dot-size',
            title: 'Dot Size',
            subtitle: '',
            type: 'slider',
            params: { min: 0, max: 30, step: 1, default: 12, unit: 'px' },
            valuesToSpec: ({ value = [], spec = {} }) => {
              const newSpec = {
                ...spec,
                chart: {
                  ...spec.chart,
                  dotSize: value,
                },
              }
              return newSpec
            },
          },
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
          maxX: MaxHeightBlock({
            id: 'maxX',
            title: 'X Max',
            valuesToSpec: ({ value = [], spec = {} }) => {
              const newSpec = {
                ...spec,
                chart: {
                  ...spec.chart,
                  xMax: value,
                },
              }
              return newSpec
            },
          }),
          minX: MaxHeightBlock({
            id: 'minX',
            title: 'X Min',
            valuesToSpec: ({ value = [], spec = {} }) => {
              const newSpec = {
                ...spec,
                chart: {
                  ...spec.chart,
                  xMin: value,
                },
              }
              return newSpec
            },
          }),
          maxY: MaxHeightBlock({
            id: 'maxY',
            title: 'Y Max',
            valuesToSpec: ({ value = [], spec = {} }) => {
              const newSpec = {
                ...spec,
                chart: {
                  ...spec.chart,
                  yMax: value,
                },
              }
              return newSpec
            },
          }),
          minY: MaxHeightBlock({
            id: 'minY',
            title: 'Y Min',
            valuesToSpec: ({ value = [], spec = {} }) => {
              const newSpec = {
                ...spec,
                chart: {
                  ...spec.chart,
                  yMin: value,
                },
              }
              return newSpec
            },
          }),
        },
        order: [
          'title',
          'xAxis',
          'yAxis',
          'show-legend',
          'dot-size',
          'title-size',
          'axis-size',
          'ticks-size',
          'maxX',
          'minX',
          'maxY',
          'minY',
        ],
      },
    },
    order: ['query', 'other'],
  },
}
export default scatter
