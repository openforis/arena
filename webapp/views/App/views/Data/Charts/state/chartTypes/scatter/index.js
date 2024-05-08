import { TitleBlock, ShowLegendBlock, MaxHeightBlock, GroupByBlock } from '../../blocks'
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
        subtitle: '',
        type: 'container',
        blocks: {
          metricX: GroupByBlock({
            id: 'metricX',
            title: 'X axis',
            subtitle: '',
            isMulti: false,
            optionsParams: { filter: ['quantitative'] },
            valuesToSpec: ({ spec = {}, value = [] }) => {
              const transform = valuesToCalculations(value)

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
          metricY: GroupByBlock({
            id: 'metricY',
            title: 'Y axis',
            subtitle: '',
            isMulti: false,
            optionsParams: { filter: ['quantitative'] },
            valuesToSpec: ({ spec = {}, value = [] }) => {
              const transform = valuesToCalculations(value)

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
          category: GroupByBlock({
            id: 'category',
            title: 'Category',
            subtitle: '',
            isMulti: false,
            optionsParams: { filter: ['nominal'] },
            valuesToSpec: ({ spec = {}, value = [] }) => {
              const transform = valuesToCalculations(value)

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
        subtitle: 'Configuration of the Chart',
        type: 'container',
        blocks: {
          title: TitleBlock({
            valuesToSpec: ({ value = [], spec = {} }) => {
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
          yAxis: TitleBlock({
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
