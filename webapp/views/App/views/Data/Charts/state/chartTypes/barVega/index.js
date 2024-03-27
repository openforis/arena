import {
  AxisTitleBlock,
  GroupByBlock,
  LabelFontSizeBlock,
  MaxHeightBlock,
  MetricBlock,
  ShowLegendBlock,
  ShowTitleBlock,
  SwitchHorizontalBlock,
  TitleBlock,
} from '../../blocks'

const barVega = {
  selector: {
    title: 'Bar',
  },
  baseSpec: {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    mark: { type: 'bar' },
    config: {
      mark: {
        invalid: null,
      },
    },
  },
  builderBlocks: {
    blocks: {
      query: {
        title: 'Query',
        subtitle: 'Config of the query for the bar chart',
        type: 'container',
        blocks: {
          groupBy: GroupByBlock(),
          metric: MetricBlock(),
        },
        order: ['groupBy', 'metric'],
      },
      other: {
        title: 'Custom Chart',
        subtitle: 'Custom configuration of the chart',
        type: 'container',
        blocks: {
          'show-title': ShowTitleBlock(),
          title: TitleBlock(),
          'show-legend': ShowLegendBlock(),
          labelFontSize: LabelFontSizeBlock(),
          xTitle: AxisTitleBlock({ id: 'xTitle', axisKey: 'x' }),
          yTitle: AxisTitleBlock({ id: 'yTitle', axisKey: 'y' }),

          maxHeight: MaxHeightBlock(),
          stack: {
            id: 'stack',
            title: 'Stack and normalize bars',
            subtitle: '',
            label: 'stack bars',
            type: 'checkbox',
            defaultValue: false,
            valuesToSpec: ({ value = [], spec = {} }) => {
              if (value) {
                const newSpec = {
                  ...spec,
                  encoding: {
                    ...(spec.encoding || {}),
                    y: {
                      ...(spec.encoding?.y || {}),
                      stack: 'normalize',
                    },
                    xOffset: null,
                  },
                }
                return newSpec
              }
              return spec
            },
          },
          switchHorizontal: SwitchHorizontalBlock(),
        },

        order: [
          'show-title',
          'title',
          'show-legend',
          'labelFontSize',
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

export default barVega
